// lib/airtable.js
// Airtable database operations for FLEX

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`

async function airtableRequest(table, options = {}) {
  const { method = 'GET', body, params = {} } = options
  
  let url = `${BASE_URL}/${encodeURIComponent(table)}`
  
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, value)
    }
    url += `?${searchParams.toString()}`
  }

  const fetchOptions = {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetch(url, fetchOptions)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Airtable request failed')
  }

  return response.json()
}

// ============================================================================
// MEMBERS
// ============================================================================

export async function getMemberByPhone(phone) {
  // Normalize phone format - remove whatsapp: prefix and ensure + prefix
  let normalizedPhone = phone.replace('whatsapp:', '').trim()
  
  // Ensure it starts with +
  if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+' + normalizedPhone
  }
  
  try {
    const result = await airtableRequest('Members', {
      params: {
        filterByFormula: `{Phone Number} = '${normalizedPhone}'`,
        maxRecords: '1',
      },
    })
    return result.records[0] || null
  } catch (error) {
    console.error('getMemberByPhone error:', error)
    return null
  }
}

export async function getMemberById(id) {
  try {
    const result = await fetch(`${BASE_URL}/Members/${id}`, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    })
    return result.ok ? await result.json() : null
  } catch {
    return null
  }
}

export async function getMemberByStripeId(stripeCustomerId) {
  const result = await airtableRequest('Members', {
    params: {
      filterByFormula: `{Stripe Customer ID} = '${stripeCustomerId}'`,
      maxRecords: '1',
    },
  })

  return result.records[0] || null
}

export async function getMemberByToken(token) {
  if (!token) return null
  
  try {
    const result = await airtableRequest('Members', {
      params: {
        filterByFormula: `{Login Token} = '${token}'`,
        maxRecords: '1',
      },
    })

    const member = result.records[0]
    if (!member) return null

    // Check if token is expired
    const tokenExpiry = member.fields['Token Expiry']
    if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
      return null // Token expired
    }

    return member
  } catch (error) {
    console.error('Get member by token error:', error)
    return null
  }
}

export async function createMember(data) {
  const { firstName, lastName, email, phone, gym, plan, stripeCustomerId, stripeSubscriptionId } = data

  // Generate referral code
  const referralCode = `FLEX${firstName.substring(0, 2).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  const result = await airtableRequest('Members', {
    method: 'POST',
    body: {
      records: [{
        fields: {
          'First Name': firstName,
          'Last Name': lastName,
          'Email': email,
          'Phone Number': phone,
          'Gym': gym,
          'Subscription Tier': plan.charAt(0).toUpperCase() + plan.slice(1),
          'Status': 'Active',
          'Signup Date': new Date().toISOString().split('T')[0],
          'Stripe Customer ID': stripeCustomerId,
          'Stripe Subscription ID': stripeSubscriptionId,
          'Referral Code': referralCode,
          'Conversation State': 'idle',
        },
      }],
    },
  })

  return result.records[0]
}

export async function updateMember(id, fields) {
  const result = await fetch(`${BASE_URL}/Members/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })

  return result.json()
}

export async function updateMemberState(id, state) {
  return updateMember(id, { 'Conversation State': state })
}

export async function getInactiveMembers(days = 14) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const formatted = cutoffDate.toISOString().split('T')[0]

  const result = await airtableRequest('Members', {
    params: {
      filterByFormula: `AND({Status} = 'Active', OR({Last Drop Date} = '', {Last Drop Date} < '${formatted}'))`,
    },
  })

  return result.records
}

// ============================================================================
// DROPS
// ============================================================================

export async function createDrop(memberId, bagNumber, gymName) {
  // Update member's last drop date
  await updateMember(memberId, { 'Last Drop Date': new Date().toISOString().split('T')[0] })

  const result = await airtableRequest('Drops', {
    method: 'POST',
    body: {
      records: [{
        fields: {
          'Bag Number': bagNumber,
          'Member': [memberId],
          'Gym': gymName,
          'Status': 'Dropped',
          'Drop Date': new Date().toISOString(),
        },
      }],
    },
  })

  return result.records[0]
}

export async function getActiveDropByMember(memberId) {
  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `AND(FIND('${memberId}', ARRAYJOIN({Member})), OR({Status} = 'Dropped', {Status} = 'At Laundry', {Status} = 'Ready'))`,
      maxRecords: '1',
      sort: JSON.stringify([{ field: 'Drop Date', direction: 'desc' }]),
    },
  })

  return result.records[0] || null
}

// Get drop that's awaiting pickup confirmation (status = Ready, not yet confirmed)
export async function getDropAwaitingPickupConfirm(memberId) {
  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `AND(FIND('${memberId}', ARRAYJOIN({Member})), {Status} = 'Ready')`,
      maxRecords: '1',
      sort: JSON.stringify([{ field: 'Ready Date', direction: 'desc' }]),
    },
  })

  return result.records[0] || null
}

// Get drops ready for pickup confirmation request (24 hours since ready)
export async function getDropsNeedingPickupConfirmation() {
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
  const formatted = twentyFourHoursAgo.toISOString()

  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `AND({Status} = 'Ready', {Ready Date} < '${formatted}', {Pickup Confirm Sent} != TRUE())`,
    },
  })

  return result.records
}

// Get drops needing pickup reminder (48 hours since ready, already sent confirm request)
export async function getDropsNeedingPickupReminder() {
  const fortyEightHoursAgo = new Date()
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)
  const formatted = fortyEightHoursAgo.toISOString()

  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `AND({Status} = 'Ready', {Ready Date} < '${formatted}', {Pickup Confirm Sent} = TRUE(), {Pickup Reminder Sent} != TRUE())`,
    },
  })

  return result.records
}

export async function getDropByBagNumber(bagNumber) {
  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `{Bag Number} = '${bagNumber}'`,
      maxRecords: '1',
      sort: JSON.stringify([{ field: 'Drop Date', direction: 'desc' }]),
    },
  })

  return result.records[0] || null
}

export async function updateDropStatus(dropId, status, additionalFields = {}) {
  const fields = { Status: status, ...additionalFields }
  
  if (status === 'Ready') {
    fields['Ready Date'] = new Date().toISOString()
  } else if (status === 'Picked Up' || status === 'Collected') {
    fields['Pickup Date'] = new Date().toISOString()
    // Also set status to Collected for clarity
    fields['Status'] = 'Collected'
  }

  const result = await fetch(`${BASE_URL}/Drops/${dropId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })

  return result.json()
}

// Mark that pickup confirmation was sent
export async function markPickupConfirmSent(dropId) {
  return updateDrop(dropId, { 'Pickup Confirm Sent': true })
}

// Mark that pickup reminder was sent
export async function markPickupReminderSent(dropId) {
  return updateDrop(dropId, { 'Pickup Reminder Sent': true })
}

// Helper function to update any drop fields
async function updateDrop(dropId, fields) {
  const result = await fetch(`${BASE_URL}/Drops/${dropId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })

  return result.json()
}

export async function getMemberDropsThisMonth(memberId) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `AND(FIND('${memberId}', ARRAYJOIN({Member})), {Drop Date} >= '${startOfMonth}')`,
    },
  })

  return result.records.length
}

// ============================================================================
// CMS - PLANS
// ============================================================================

export async function getPlans() {
  const result = await airtableRequest('Plans', {
    params: {
      filterByFormula: `{Is Active} = TRUE()`,
      sort: JSON.stringify([{ field: 'Sort Order', direction: 'asc' }]),
    },
  })

  return result.records.map(r => ({
    id: r.id,
    name: r.fields['Name'],
    slug: r.fields['Slug'],
    price: r.fields['Price'],
    drops: r.fields['Drops Per Month'],
    description: r.fields['Description'],
    stripePriceId: r.fields['Stripe Price ID'],
    isPopular: r.fields['Is Popular'],
    features: r.fields['Features']?.split('\n') || [],
  }))
}

// ============================================================================
// CMS - GYMS
// ============================================================================

export async function getGyms() {
  const result = await airtableRequest('Gyms', {
    params: {
      filterByFormula: `{Is Active} = TRUE()`,
    },
  })

  return result.records.map(r => ({
    id: r.id,
    name: r.fields['Name'],
    slug: r.fields['Slug'],
    address: r.fields['Address'],
    postcode: r.fields['Postcode'],
    contactEmail: r.fields['Contact Email'],
    pickupHours: r.fields['Pickup Hours'],
    fields: r.fields, // Include raw fields for ops pages
  }))
}

// ============================================================================
// CMS - CONFIG
// ============================================================================

export async function getConfig() {
  const result = await airtableRequest('Config')
  
  const config = {}
  for (const record of result.records) {
    config[record.fields['Key']] = record.fields['Value']
  }
  return config
}

export async function getConfigValue(key, defaultValue = '') {
  const config = await getConfig()
  return config[key] || defaultValue
}

// ============================================================================
// ISSUE DETECTION
// ============================================================================

// Get drops that are stuck (not progressing through statuses)
export async function getStuckDrops() {
  const sixHoursAgo = new Date()
  sixHoursAgo.setHours(sixHoursAgo.getHours() - 6)
  const sixHoursAgoStr = sixHoursAgo.toISOString()

  const thirtyHoursAgo = new Date()
  thirtyHoursAgo.setHours(thirtyHoursAgo.getHours() - 30)
  const thirtyHoursAgoStr = thirtyHoursAgo.toISOString()

  // Get drops stuck in Dropped status for >6 hours OR At Laundry for >30 hours
  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `OR(AND({Status} = 'Dropped', {Drop Date} < '${sixHoursAgoStr}'), AND({Status} = 'At Laundry', {Drop Date} < '${thirtyHoursAgoStr}'))`,
    },
  })

  return result.records
}

// Get drops that have been Ready for more than 5 days (overdue pickup)
export async function getOverduePickups() {
  const fiveDaysAgo = new Date()
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
  const fiveDaysAgoStr = fiveDaysAgo.toISOString()

  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `AND({Status} = 'Ready', {Ready Date} < '${fiveDaysAgoStr}')`,
    },
  })

  return result.records
}

// ============================================================================
// PAYMENT ISSUES
// ============================================================================

// Get members with payment issues (Past Due status)
export async function getMembersWithPaymentIssues() {
  const result = await airtableRequest('Members', {
    params: {
      filterByFormula: `{Status} = 'Past Due'`,
    },
  })

  return result.records
}

// ============================================================================
// SCAN LOG
// ============================================================================

// Update drop with scan log entry
export async function updateDropScanLog(dropId, scanEntry) {
  // First get existing scan log
  const drop = await fetch(`${BASE_URL}/Drops/${dropId}`, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    },
  }).then(r => r.json())

  const existingLog = drop.fields['Scan Log'] || '[]'
  let logArray = []
  try {
    logArray = JSON.parse(existingLog)
  } catch {
    logArray = []
  }

  logArray.push(scanEntry)

  const result = await fetch(`${BASE_URL}/Drops/${dropId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'Scan Log': JSON.stringify(logArray),
        'Last Modified': new Date().toISOString(),
      }
    }),
  })

  return result.json()
}

// ============================================================================
// ENHANCED ISSUES
// ============================================================================

// Create issue with optional photo and priority
export async function createIssue(memberId, type, description, photoUrl = null, priority = 'Medium', dropId = null) {
  const ticketId = `TKT${Date.now().toString().slice(-6)}`

  const fields = {
    'Ticket ID': ticketId,
    'Type': type,
    'Description': description,
    'Status': 'Open',
    'Priority': priority,
    'Created': new Date().toISOString(),
  }

  // Only add Member link if memberId is provided
  if (memberId) {
    fields['Member'] = [memberId]
  }

  // Add photo URL if provided
  if (photoUrl) {
    fields['Photo URL'] = photoUrl
  }

  // Link to drop if provided
  if (dropId) {
    fields['Related Drop'] = [dropId]
  }

  const result = await airtableRequest('Issues', {
    method: 'POST',
    body: {
      records: [{
        fields,
      }],
    },
  })

  return result.records[0]
}

// ============================================================================
// OPS DASHBOARD
// ============================================================================

// Get dashboard summary data
export async function getOpsDashboardData() {
  try {
    // Get all members
    const members = await airtableRequest('Members', {
      params: { filterByFormula: `{Status} = 'Active'` }
    })
    const activeMembers = members.records?.length || 0

    // Get all drops this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const drops = await airtableRequest('Drops', {
      params: { 
        filterByFormula: `IS_AFTER({Drop Date}, '${startOfMonth}')` 
      }
    })
    const dropsThisMonth = drops.records?.length || 0

    // Count bags by status
    const allDrops = await airtableRequest('Drops')
    const statusCounts = {
      bagsDropped: 0,
      bagsAtLaundry: 0,
      bagsReady: 0,
      bagsAvailable: activeMembers, // Simplified: assume 1 bag per member
    }

    const alerts = []
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)

    allDrops.records?.forEach(drop => {
      const status = drop.fields['Status']
      const dropDate = new Date(drop.fields['Drop Date'] || Date.now())

      if (status === 'Dropped') {
        statusCounts.bagsDropped++
        statusCounts.bagsAvailable--
        
        // Check for SLA risk
        if (dropDate < sixHoursAgo) {
          alerts.push({
            type: 'critical',
            message: `${drop.fields['Bag Number']} stuck in Dropped for ${Math.floor((Date.now() - dropDate) / (1000 * 60 * 60))} hours`,
            gym: drop.fields['Gym'] || 'Unknown'
          })
        }
      } else if (status === 'At Laundry') {
        statusCounts.bagsAtLaundry++
        statusCounts.bagsAvailable--
      } else if (status === 'Ready') {
        statusCounts.bagsReady++
        statusCounts.bagsAvailable--
      }
    })

    // Get recent activity (last 10 status changes)
    const recentActivity = allDrops.records
      ?.filter(d => d.fields['Modified'])
      .sort((a, b) => new Date(b.fields['Modified']) - new Date(a.fields['Modified']))
      .slice(0, 10)
      .map(drop => ({
        action: `Bag ${drop.fields['Bag Number']} → ${drop.fields['Status']}`,
        gym: drop.fields['Gym'] || 'Unknown',
        member: drop.fields['Member Name'] || 'Unknown',
        time: formatTimeAgo(drop.fields['Modified'])
      })) || []

    return {
      activeMembers,
      memberChange: 12, // TODO: Calculate from historical data
      dropsThisMonth,
      dropsChange: 28, // TODO: Calculate from historical data
      avgTurnaround: 31, // TODO: Calculate from actual data
      turnaroundChange: -2,
      onTimeRate: 96.2, // TODO: Calculate from actual data
      onTimeChange: 1.2,
      ...statusCounts,
      criticalIssues: alerts.filter(a => a.type === 'critical').length,
      alerts,
      recentActivity,
    }
  } catch (error) {
    console.error('Dashboard data error:', error)
    return {
      activeMembers: 0,
      memberChange: 0,
      dropsThisMonth: 0,
      dropsChange: 0,
      avgTurnaround: 0,
      turnaroundChange: 0,
      onTimeRate: 0,
      onTimeChange: 0,
      bagsAvailable: 0,
      bagsDropped: 0,
      bagsAtLaundry: 0,
      bagsReady: 0,
      criticalIssues: 0,
      alerts: [],
      recentActivity: [],
    }
  }
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} mins ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hours ago`
  return `${Math.floor(diffHours / 24)} days ago`
}

// Get drops awaiting pickup (status = Dropped)
export async function getDropsAwaitingPickup() {
  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `{Status} = 'Dropped'`,
    }
  })
  return result.records || []
}

// Get drops in transit (picked up but not at laundry)
export async function getDropsInTransit() {
  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `{Status} = 'In Transit'`,
    }
  })
  return result.records || []
}

// Get drops at laundry
export async function getDropsAtLaundry() {
  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `{Status} = 'At Laundry'`,
    }
  })
  return result.records || []
}

// Get drops ready for delivery (cleaned, ready to return to gym)
export async function getDropsReadyForDelivery() {
  const result = await airtableRequest('Drops', {
    params: {
      filterByFormula: `OR({Status} = 'Ready for Delivery', {Status} = 'Cleaned')`,
    }
  })
  return result.records || []
}

// Get all laundry partners
export async function getLaundryPartners() {
  try {
    const result = await airtableRequest('Laundry Partners')
    return result.records || []
  } catch (error) {
    console.error('getLaundryPartners error:', error)
    return []
  }
}

// Get active laundry partners only
export async function getActiveLaundryPartners() {
  try {
    const result = await airtableRequest('Laundry Partners', {
      params: {
        filterByFormula: `{Status} = 'Active'`,
      }
    })
    return result.records || []
  } catch (error) {
    console.error('getActiveLaundryPartners error:', error)
    return []
  }
}

// Get gym-to-laundry partner mapping
export async function getGymLaundryMapping() {
  try {
    const gyms = await getGyms()
    const mapping = {}
    
    gyms.forEach(gym => {
      const gymName = gym.name || gym.fields?.['Name']
      const laundryPartner = gym.fields?.['Laundry Partner'] || 'Default'
      mapping[gymName] = laundryPartner
    })
    
    return mapping
  } catch (error) {
    console.error('getGymLaundryMapping error:', error)
    return {}
  }
}

// ============================================================================
// BAG MANAGEMENT
// ============================================================================

// Get available bags (not currently issued to anyone)
export async function getAvailableBags() {
  try {
    const result = await airtableRequest('Bags', {
      params: {
        filterByFormula: `{Status} = 'Available'`,
      }
    })
    return result.records || []
  } catch (error) {
    console.error('getAvailableBags error:', error)
    return []
  }
}

// Get a specific bag by number
export async function getBagByNumber(bagNumber) {
  try {
    const result = await airtableRequest('Bags', {
      params: {
        filterByFormula: `{Bag Number} = '${bagNumber}'`,
        maxRecords: '1',
      }
    })
    return result.records?.[0] || null
  } catch (error) {
    console.error('getBagByNumber error:', error)
    return null
  }
}

// Get bag currently issued to a member
export async function getMemberBag(memberId) {
  try {
    const result = await airtableRequest('Bags', {
      params: {
        filterByFormula: `AND({Member} = '${memberId}', {Status} = 'Issued')`,
        maxRecords: '1',
      }
    })
    return result.records?.[0] || null
  } catch (error) {
    console.error('getMemberBag error:', error)
    return null
  }
}

// Issue a bag to a member (when they want to drop)
export async function issueBagToMember(bagId, memberId) {
  const result = await fetch(`${BASE_URL}/Bags/${bagId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'Status': 'Issued',
        'Member': [memberId],
        'Issued Date': new Date().toISOString().split('T')[0],
      }
    }),
  })
  return result.json()
}

// Return a bag (when member is inactive, pausing, or cancelling)
export async function returnBag(bagId) {
  const result = await fetch(`${BASE_URL}/Bags/${bagId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'Status': 'Available',
        'Member': [],
        'Returned Date': new Date().toISOString().split('T')[0],
      }
    }),
  })
  return result.json()
}

// Mark bag as lost/unreturned (for charging fee)
export async function markBagUnreturned(bagId, memberId) {
  const result = await fetch(`${BASE_URL}/Bags/${bagId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'Status': 'Unreturned',
        'Unreturned Date': new Date().toISOString().split('T')[0],
      }
    }),
  })
  return result.json()
}

// Get all bags with issues (unreturned, damaged)
export async function getBagsWithIssues() {
  try {
    const result = await airtableRequest('Bags', {
      params: {
        filterByFormula: `OR({Status} = 'Unreturned', {Status} = 'Damaged')`,
      }
    })
    return result.records || []
  } catch (error) {
    console.error('getBagsWithIssues error:', error)
    return []
  }
}

// Update bag condition
export async function updateBagCondition(bagId, condition) {
  const result = await fetch(`${BASE_URL}/Bags/${bagId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'Condition': condition,
        'Last Inspected': new Date().toISOString().split('T')[0],
      }
    }),
  })
  return result.json()
}

// ============================================================================
// PLAN MANAGEMENT (Dynamic)
// ============================================================================

// Get all active plans
export async function getActivePlans() {
  try {
    const result = await airtableRequest('Plans', {
      params: {
        filterByFormula: `{Is Active} = TRUE()`,
      }
    })
    return result.records?.map(r => ({
      id: r.id,
      name: r.fields['Name'],
      slug: r.fields['Slug'],
      price: r.fields['Price'],
      dropsPerMonth: r.fields['Drops Per Month'],
      stripePriceId: r.fields['Stripe Price ID'],
      isSubscription: r.fields['Is Subscription'] !== false,
      isPopular: r.fields['Is Popular'] || false,
      features: r.fields['Features']?.split('\n') || [],
    })) || []
  } catch (error) {
    console.error('getActivePlans error:', error)
    return []
  }
}

// Get plan by slug
export async function getPlanBySlug(slug) {
  try {
    const result = await airtableRequest('Plans', {
      params: {
        filterByFormula: `{Slug} = '${slug}'`,
        maxRecords: '1',
      }
    })
    const plan = result.records?.[0]
    if (!plan) return null
    
    return {
      id: plan.id,
      name: plan.fields['Name'],
      slug: plan.fields['Slug'],
      price: plan.fields['Price'],
      dropsPerMonth: plan.fields['Drops Per Month'],
      stripePriceId: plan.fields['Stripe Price ID'],
      isSubscription: plan.fields['Is Subscription'] !== false,
    }
  } catch (error) {
    console.error('getPlanBySlug error:', error)
    return null
  }
}

// Get member's plan details (including drop limit)
export async function getMemberPlanDetails(memberId) {
  try {
    const member = await getMemberById(memberId)
    if (!member) return null
    
    const planName = member.fields['Subscription Tier'] || 'Essential'
    const plans = await getActivePlans()
    const plan = plans.find(p => p.name === planName)
    
    return {
      planName,
      dropsPerMonth: plan?.dropsPerMonth || 10,
      price: plan?.price || 30,
      isSubscription: plan?.isSubscription !== false,
    }
  } catch (error) {
    console.error('getMemberPlanDetails error:', error)
    return null
  }
}

// ============================================================================
// SLA MONITORING
// ============================================================================

// Get bags exceeding SLA thresholds
export async function getBagsBreachingSLA() {
  try {
    const allDrops = await airtableRequest('Drops', {
      params: {
        filterByFormula: `OR({Status} = 'Dropped', {Status} = 'At Laundry', {Status} = 'Ready')`,
      }
    })

    const now = new Date()
    const breaches = []

    allDrops.records?.forEach(drop => {
      const status = drop.fields['Status']
      const statusChanged = drop.fields['Status Changed'] || drop.fields['Drop Date']
      if (!statusChanged) return

      const hoursInStatus = (now - new Date(statusChanged)) / (1000 * 60 * 60)

      // SLA thresholds
      const thresholds = {
        'Dropped': 6,
        'At Laundry': 30,
        'Ready': 120,
      }

      if (hoursInStatus > thresholds[status]) {
        breaches.push({
          id: drop.id,
          bagNumber: drop.fields['Bag Number'],
          status,
          hoursInStatus: Math.round(hoursInStatus),
          threshold: thresholds[status],
          gym: drop.fields['Gym'],
          memberName: drop.fields['Member Name'],
          memberId: drop.fields['Member']?.[0],
          severity: hoursInStatus > thresholds[status] * 2 ? 'critical' : 'warning',
        })
      }
    })

    return breaches.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1
      return b.hoursInStatus - a.hoursInStatus
    })
  } catch (error) {
    console.error('getBagsBreachingSLA error:', error)
    return []
  }
}

// Get SLA summary stats
export async function getSLAStats() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const completedDrops = await airtableRequest('Drops', {
      params: {
        filterByFormula: `AND({Status} = 'Collected', IS_AFTER({Pickup Date}, '${thirtyDaysAgo.toISOString()}'))`,
      }
    })

    let totalTurnaround = 0
    let onTimeCount = 0
    let totalCount = 0

    completedDrops.records?.forEach(drop => {
      const dropDate = new Date(drop.fields['Drop Date'])
      const collectedDate = new Date(drop.fields['Pickup Date'])
      const turnaroundHours = (collectedDate - dropDate) / (1000 * 60 * 60)

      totalTurnaround += turnaroundHours
      totalCount++
      if (turnaroundHours <= 48) onTimeCount++
    })

    return {
      avgTurnaroundHours: totalCount > 0 ? Math.round(totalTurnaround / totalCount) : 0,
      onTimeRate: totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 100,
      totalCompleted: totalCount,
    }
  } catch (error) {
    console.error('getSLAStats error:', error)
    return { avgTurnaroundHours: 0, onTimeRate: 100, totalCompleted: 0 }
  }
}

// ============================================================================
// FINANCIAL REPORTING HELPERS
// ============================================================================

// Get revenue breakdown by plan
export async function getRevenueByPlan() {
  try {
    const members = await airtableRequest('Members', {
      params: {
        filterByFormula: `{Status} = 'Active'`,
      }
    })

    const plans = await getActivePlans()
    const breakdown = {}

    members.records?.forEach(member => {
      const planName = member.fields['Subscription Tier'] || 'Unknown'
      if (!breakdown[planName]) {
        const plan = plans.find(p => p.name === planName)
        breakdown[planName] = {
          name: planName,
          count: 0,
          monthlyRevenue: 0,
          price: plan?.price || 0,
        }
      }
      breakdown[planName].count++
      breakdown[planName].monthlyRevenue = breakdown[planName].count * breakdown[planName].price
    })

    return Object.values(breakdown)
  } catch (error) {
    console.error('getRevenueByPlan error:', error)
    return []
  }
}

// Get churn data
export async function getChurnStats() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const cancelled = await airtableRequest('Members', {
      params: {
        filterByFormula: `{Status} = 'Cancelled'`,
      }
    })

    const reasons = {}
    cancelled.records?.forEach(member => {
      const reason = member.fields['Cancellation Reason'] || 'Unknown'
      reasons[reason] = (reasons[reason] || 0) + 1
    })

    return {
      cancelledCount: cancelled.records?.length || 0,
      reasons,
    }
  } catch (error) {
    console.error('getChurnStats error:', error)
    return { cancelledCount: 0, reasons: {} }
  }
}

// Get utilisation stats (drops used vs allowed)
export async function getUtilisationStats() {
  try {
    const members = await airtableRequest('Members', {
      params: {
        filterByFormula: `{Status} = 'Active'`,
      }
    })

    const plans = await getActivePlans()
    let totalAllowed = 0
    let totalUsed = 0

    for (const member of members.records || []) {
      const planName = member.fields['Subscription Tier'] || 'Essential'
      const plan = plans.find(p => p.name === planName)
      totalAllowed += plan?.dropsPerMonth || 10
      totalUsed += member.fields['Drops Used'] || 0
    }

    return {
      totalAllowed,
      totalUsed,
      utilisationRate: totalAllowed > 0 ? Math.round((totalUsed / totalAllowed) * 100) : 0,
    }
  } catch (error) {
    console.error('getUtilisationStats error:', error)
    return { totalAllowed: 0, totalUsed: 0, utilisationRate: 0 }
  }
}
