// lib/airtable.js
// Updated to match confirmed Airtable schema - December 2024

import Airtable from 'airtable'

// ============================================================================
// CONFIGURATION
// ============================================================================

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID)

// Table references
const Members = base('Members')
const Drops = base('Drops')
const Gyms = base('Gyms')
const Issues = base('Issues')
const Plans = base('Plans')
const Config = base('Config')
const AuditLogs = base('Audit Logs')

// ============================================================================
// MEMBER FUNCTIONS
// ============================================================================

/**
 * Get member by phone number
 * Field: Phone (phone number type)
 * Handles: +447xxx, 447xxx, 07xxx formats
 */
export async function getMemberByPhone(phone) {
  const normalized = phone.replace('whatsapp:', '').replace(/\D/g, '')
  
  // Build search formats
  const formats = []
  if (normalized.startsWith('44')) {
    formats.push('+' + normalized)           // +447530659971
    formats.push(normalized)                  // 447530659971
    formats.push('0' + normalized.slice(2))   // 07530659971
  } else if (normalized.startsWith('0')) {
    formats.push(normalized)                  // 07530659971
    formats.push('+44' + normalized.slice(1)) // +447530659971
    formats.push('44' + normalized.slice(1))  // 447530659971
  } else {
    formats.push(normalized)
    formats.push('+' + normalized)
  }

  const conditions = formats.map(f => `{Phone} = '${f}'`).join(', ')
  const formula = `OR(${conditions})`

  try {
    const records = await Members.select({
      filterByFormula: formula,
      maxRecords: 1,
    }).firstPage()

    if (records.length === 0) {
      console.log(`❌ No member found for: ${formats.join(' / ')}`)
      return null
    }

    return records[0]
  } catch (error) {
    console.error(`❌ getMemberByPhone error: ${error.message}`)
    throw error
  }
}

/**
 * Get member by ID
 */
export async function getMemberById(memberId) {
  try {
    return await Members.find(memberId)
  } catch (error) {
    console.error(`❌ getMemberById error: ${error.message}`)
    throw error
  }
}

/**
 * Update member's conversation state
 * Field: Conversation State (single select)
 */
export async function updateMemberState(memberId, state) {
  try {
    return await Members.update(memberId, {
      'Conversation State': state,
    })
  } catch (error) {
    console.error(`❌ updateMemberState error: ${error.message}`)
    throw error
  }
}

/**
 * Update member fields
 */
export async function updateMember(memberId, fields) {
  try {
    return await Members.update(memberId, fields)
  } catch (error) {
    console.error(`❌ updateMember error: ${error.message}`)
    throw error
  }
}

/**
 * Create new member
 */
export async function createMember(data) {
  try {
    return await Members.create({
      'First Name': data.firstName,
      'Last Name': data.lastName || '',
      'Email': data.email,
      'Phone': data.phone,
      'Gym': data.gymId ? [data.gymId] : [],
      'Subscription Tier': data.plan || 'Essential',
      'Subscription Status': 'Active',
      'Stripe Customer ID': data.stripeCustomerId || '',
      'Stripe Subscription ID': data.stripeSubscriptionId || '',
      'Signup Date': new Date().toISOString(),
      'Conversation State': 'idle',
      'Referral Code': generateReferralCode(data.firstName),
    })
  } catch (error) {
    console.error(`❌ createMember error: ${error.message}`)
    throw error
  }
}

function generateReferralCode(firstName) {
  const name = (firstName || 'FLEX').toUpperCase().slice(0, 6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${name}${random}`
}

// ============================================================================
// DROP FUNCTIONS
// ============================================================================

/**
 * Create a new drop
 * Fields: Member (link), Gym (link), Bag Number, Status, Drop Date
 * Status options: Dropped, In Transit, At Laundry, Ready, Collected, Cancelled
 */
export async function createDrop(memberId, bagNumber, gymId) {
  try {
    const dropData = {
      'Bag Number': bagNumber,
      'Member': [memberId],
      'Status': 'Dropped',
      'Drop Date': new Date().toISOString(),
    }
    
    // Add gym if provided (must be record ID)
    if (gymId && !gymId.includes(' ')) {
      // Looks like a record ID (no spaces)
      dropData['Gym'] = [gymId]
    }
    
    console.log(`📦 Creating drop:`, JSON.stringify(dropData))
    const record = await Drops.create(dropData)
    console.log(`✅ Drop created: ${record.id}`)
    return record
    
  } catch (error) {
    console.error(`❌ createDrop error: ${error.message}`)
    
    // Retry without gym if it caused the error
    if (error.message.includes('Unknown field') || error.message.includes('Invalid')) {
      console.log(`⚠️ Retrying without Gym field...`)
      const retryData = {
        'Bag Number': bagNumber,
        'Member': [memberId],
        'Status': 'Dropped',
        'Drop Date': new Date().toISOString(),
      }
      return await Drops.create(retryData)
    }
    
    throw error
  }
}

/**
 * Get active drop for member (not Collected or Cancelled)
 */
export async function getActiveDropByMember(memberId) {
  try {
    // Get all non-completed drops
    const records = await Drops.select({
      filterByFormula: `AND(
        {Status} != 'Collected',
        {Status} != 'Cancelled'
      )`,
      maxRecords: 100,
    }).firstPage()
    
    // Filter by member (linked record)
    return records.find(d => {
      const memberLinks = d.fields['Member'] || []
      return memberLinks.includes(memberId)
    }) || null
    
  } catch (error) {
    console.error(`❌ getActiveDropByMember error: ${error.message}`)
    return null
  }
}

/**
 * Get drop awaiting pickup confirmation (Ready status)
 */
export async function getDropAwaitingPickupConfirm(memberId) {
  try {
    const records = await Drops.select({
      filterByFormula: `{Status} = 'Ready'`,
      maxRecords: 100,
    }).firstPage()
    
    return records.find(d => {
      const memberLinks = d.fields['Member'] || []
      return memberLinks.includes(memberId)
    }) || null
    
  } catch (error) {
    console.error(`❌ getDropAwaitingPickupConfirm error: ${error.message}`)
    return null
  }
}

/**
 * Get drops this month for member (for usage counting)
 */
export async function getMemberDropsThisMonth(memberId) {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const records = await Drops.select({
      filterByFormula: `IS_AFTER({Drop Date}, '${startOfMonth.toISOString()}')`,
      maxRecords: 100,
    }).firstPage()
    
    return records.filter(d => {
      const memberLinks = d.fields['Member'] || []
      return memberLinks.includes(memberId)
    }).length
    
  } catch (error) {
    console.error(`❌ getMemberDropsThisMonth error: ${error.message}`)
    return 0
  }
}

/**
 * Update drop status
 */
export async function updateDropStatus(dropId, status) {
  try {
    const fields = { 'Status': status }
    
    if (status === 'Ready') {
      fields['Ready Date'] = new Date().toISOString()
    }
    if (status === 'Collected') {
      fields['Pickup Date'] = new Date().toISOString()
    }
    
    return await Drops.update(dropId, fields)
  } catch (error) {
    console.error(`❌ updateDropStatus error: ${error.message}`)
    throw error
  }
}

/**
 * Get all drops (for ops dashboard)
 */
export async function getAllDrops(filters = {}) {
  try {
    const options = { maxRecords: 500 }
    
    if (filters.status) {
      options.filterByFormula = `{Status} = '${filters.status}'`
    }
    
    return await Drops.select(options).firstPage()
  } catch (error) {
    console.error(`❌ getAllDrops error: ${error.message}`)
    return []
  }
}

/**
 * Get drops by status (for ops dashboard counts)
 */
export async function getDropCountsByStatus() {
  try {
    const records = await Drops.select({ maxRecords: 500 }).firstPage()
    
    const counts = {
      Dropped: 0,
      'In Transit': 0,
      'At Laundry': 0,
      Ready: 0,
      Collected: 0,
      Cancelled: 0,
    }
    
    records.forEach(r => {
      const status = r.fields['Status']
      if (counts[status] !== undefined) {
        counts[status]++
      }
    })
    
    return counts
  } catch (error) {
    console.error(`❌ getDropCountsByStatus error: ${error.message}`)
    return {}
  }
}

// ============================================================================
// GYM FUNCTIONS
// ============================================================================

/**
 * Get all active gyms
 * Fields: Name, Slug, Address, Is Active
 */
export async function getGyms() {
  try {
    const records = await Gyms.select({
      filterByFormula: `{Is Active} = TRUE()`,
    }).firstPage()

    return records.map(r => ({
      id: r.id,
      name: r.fields['Name'],
      slug: r.fields['Slug'],
      address: r.fields['Address'],
      postcode: r.fields['Postcode'],
      dropOffCutoff: r.fields['Drop Off Cutoff'],
      pickupHours: r.fields['Pickup Hours'],
    }))
  } catch (error) {
    console.error(`❌ getGyms error: ${error.message}`)
    return []
  }
}

/**
 * Get gym by ID
 */
export async function getGymById(gymId) {
  try {
    const record = await Gyms.find(gymId)
    return {
      id: record.id,
      name: record.fields['Name'],
      slug: record.fields['Slug'],
      address: record.fields['Address'],
    }
  } catch (error) {
    console.error(`❌ getGymById error: ${error.message}`)
    return null
  }
}

/**
 * Get gym by name
 */
export async function getGymByName(name) {
  try {
    const records = await Gyms.select({
      filterByFormula: `{Name} = '${name}'`,
      maxRecords: 1,
    }).firstPage()

    return records[0] || null
  } catch (error) {
    console.error(`❌ getGymByName error: ${error.message}`)
    return null
  }
}

// ============================================================================
// ISSUE FUNCTIONS
// ============================================================================

/**
 * Create a support issue
 * Fields: Ticket ID, Member (link), Type, Description, Status, Priority, Created
 * Type options: Late Delivery, Missing Bag, Wrong Items, Damage Claim, Feedback, Other
 * Status options: Open, In Progress, Waiting on Customer, Resolved, Closed
 */
export async function createIssue(memberId, type, description, photoUrl = null) {
  try {
    const ticketId = `FLEX-${Date.now().toString(36).toUpperCase()}`
    
    const issueData = {
      'Ticket ID': ticketId,
      'Member': [memberId],
      'Type': type,
      'Description': description,
      'Status': 'Open',
      'Priority': 'Medium',
      'Created': new Date().toISOString(),
    }
    
    if (photoUrl) {
      issueData['Photo URL'] = photoUrl
    }
    
    const record = await Issues.create(issueData)
    record.fields['Ticket ID'] = ticketId
    
    return record
  } catch (error) {
    console.error(`❌ createIssue error: ${error.message}`)
    
    // Return mock to prevent flow breakage
    return {
      id: 'error',
      fields: { 'Ticket ID': `FLEX-${Date.now().toString(36).toUpperCase()}` }
    }
  }
}

// ============================================================================
// PLAN FUNCTIONS
// ============================================================================

/**
 * Get all active plans
 * Fields: Name, Slug, Price, Drops Per Month, Stripe Price ID, Is Active
 */
export async function getPlans() {
  try {
    const records = await Plans.select({
      filterByFormula: `{Is Active} = TRUE()`,
      sort: [{ field: 'Sort Order', direction: 'asc' }],
    }).firstPage()

    return records.map(r => ({
      id: r.id,
      name: r.fields['Name'],
      slug: r.fields['Slug'],
      price: r.fields['Price'],
      dropsPerMonth: r.fields['Drops Per Month'],
      stripePriceId: r.fields['Stripe Price ID'],
      description: r.fields['Description'],
      isPopular: r.fields['Is Popular'],
    }))
  } catch (error) {
    console.error(`❌ getPlans error: ${error.message}`)
    return []
  }
}

/**
 * Get plan by name
 */
export async function getPlanByName(name) {
  try {
    const records = await Plans.select({
      filterByFormula: `{Name} = '${name}'`,
      maxRecords: 1,
    }).firstPage()

    if (records.length === 0) return null
    
    const r = records[0]
    return {
      id: r.id,
      name: r.fields['Name'],
      slug: r.fields['Slug'],
      price: r.fields['Price'],
      dropsPerMonth: r.fields['Drops Per Month'],
      stripePriceId: r.fields['Stripe Price ID'],
    }
  } catch (error) {
    console.error(`❌ getPlanByName error: ${error.message}`)
    return null
  }
}

// ============================================================================
// CONFIG FUNCTIONS
// ============================================================================

/**
 * Get config value by key
 * Fields: Key, Value
 */
export async function getConfig(key) {
  try {
    const records = await Config.select({
      filterByFormula: `{Key} = '${key}'`,
      maxRecords: 1,
    }).firstPage()

    return records[0]?.fields['Value'] || null
  } catch (error) {
    console.error(`❌ getConfig error: ${error.message}`)
    return null
  }
}

/**
 * Get all config as object
 */
export async function getAllConfig() {
  try {
    const records = await Config.select().firstPage()
    
    const config = {}
    records.forEach(r => {
      config[r.fields['Key']] = r.fields['Value']
    })
    
    return config
  } catch (error) {
    console.error(`❌ getAllConfig error: ${error.message}`)
    return {}
  }
}

// ============================================================================
// AUDIT LOG FUNCTIONS
// ============================================================================

/**
 * Create audit log entry
 * Fields: Timestamp, Action, Actor, Entity Type, Entity ID, Details, IP Address
 */
export async function createAuditLog(action, actor, entityType, entityId, details = '', ipAddress = '') {
  try {
    return await AuditLogs.create({
      'Timestamp': new Date().toISOString(),
      'Action': action,
      'Actor': actor,
      'Entity Type': entityType,
      'Entity ID': entityId,
      'Details': details,
      'IP Address': ipAddress,
    })
  } catch (error) {
    console.error(`❌ createAuditLog error: ${error.message}`)
    // Don't throw - audit logs shouldn't break main flow
  }
}

// ============================================================================
// OPS DASHBOARD FUNCTIONS
// ============================================================================

// Add table references for ops
const LaundryPartners = base('Laundry Partners')
const GymsLaundryMapping = base('Gyms Laundry Mapping')

/**
 * Main dashboard data aggregation
 */
export async function getOpsDashboardData() {
  try {
    const [members, drops, issues] = await Promise.all([
      Members.select({ maxRecords: 500 }).firstPage(),
      Drops.select({ maxRecords: 500 }).firstPage(),
      Issues.select({ maxRecords: 100 }).firstPage(),
    ])

    // Active members
    const activeMembers = members.filter(m => 
      m.fields['Subscription Status'] === 'Active'
    ).length

    // Drops this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const dropsThisMonth = drops.filter(d => 
      new Date(d.fields['Drop Date']) >= startOfMonth
    ).length

    // Drop counts by status
    const bagsDropped = drops.filter(d => d.fields['Status'] === 'Dropped').length
    const bagsAtLaundry = drops.filter(d => 
      d.fields['Status'] === 'At Laundry' || d.fields['Status'] === 'In Transit'
    ).length
    const bagsReady = drops.filter(d => d.fields['Status'] === 'Ready').length

    // Critical issues (open issues)
    const criticalIssues = issues.filter(i => 
      i.fields['Status'] === 'Open' && i.fields['Priority'] === 'Urgent'
    ).length

    // Alerts - bags stuck too long
    const alerts = []
    drops.forEach(d => {
      const status = d.fields['Status']
      const dropDate = new Date(d.fields['Drop Date'] || d.fields['Created'])
      const hoursOld = (Date.now() - dropDate.getTime()) / (1000 * 60 * 60)

      if (status === 'Dropped' && hoursOld > 6) {
        alerts.push({
          type: hoursOld > 12 ? 'critical' : 'warning',
          message: `Bag ${d.fields['Bag Number']} waiting ${Math.round(hoursOld)}hrs for pickup`,
          gym: d.fields['Gym'] || 'Unknown',
        })
      }
      if (status === 'At Laundry' && hoursOld > 36) {
        alerts.push({
          type: hoursOld > 48 ? 'critical' : 'warning',
          message: `Bag ${d.fields['Bag Number']} at laundry for ${Math.round(hoursOld)}hrs`,
          gym: d.fields['Gym'] || 'Unknown',
        })
      }
    })

    // Recent activity (last 10 drops)
    const recentActivity = drops
      .sort((a, b) => new Date(b.fields['Drop Date'] || 0) - new Date(a.fields['Drop Date'] || 0))
      .slice(0, 10)
      .map(d => ({
        action: `${d.fields['Bag Number']} → ${d.fields['Status']}`,
        gym: d.fields['Gym'] || 'Unknown',
        member: d.fields['Member Name'] || 'Unknown',
        time: formatTimeAgo(d.fields['Drop Date']),
      }))

    // Calculate turnaround from completed drops
    const completedDrops = drops.filter(d => d.fields['Status'] === 'Collected')
    let avgTurnaround = 0
    let onTimeCount = 0

    if (completedDrops.length > 0) {
      let totalHours = 0
      completedDrops.forEach(d => {
        const dropDate = new Date(d.fields['Drop Date'])
        const pickupDate = new Date(d.fields['Pickup Date'] || d.fields['Ready Date'])
        const hours = (pickupDate - dropDate) / (1000 * 60 * 60)
        totalHours += hours
        if (hours <= 48) onTimeCount++
      })
      avgTurnaround = Math.round(totalHours / completedDrops.length)
    }

    const onTimeRate = completedDrops.length > 0 
      ? Math.round((onTimeCount / completedDrops.length) * 100) 
      : 100

    return {
      activeMembers,
      memberChange: 0,
      dropsThisMonth,
      dropsChange: 0,
      avgTurnaround,
      turnaroundChange: 0,
      onTimeRate,
      onTimeChange: 0,
      bagsAvailable: 0,
      bagsDropped,
      bagsAtLaundry,
      bagsReady,
      criticalIssues,
      alerts,
      recentActivity,
    }
  } catch (error) {
    console.error('❌ getOpsDashboardData error:', error.message)
    return {
      activeMembers: 0,
      memberChange: 0,
      dropsThisMonth: 0,
      dropsChange: 0,
      avgTurnaround: 0,
      turnaroundChange: 0,
      onTimeRate: 100,
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
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

/**
 * Get drops awaiting pickup (status = Dropped)
 */
export async function getDropsAwaitingPickup() {
  try {
    return await Drops.select({
      filterByFormula: `{Status} = 'Dropped'`,
    }).firstPage()
  } catch (error) {
    console.error('❌ getDropsAwaitingPickup error:', error.message)
    return []
  }
}

/**
 * Get drops in transit
 */
export async function getDropsInTransit() {
  try {
    return await Drops.select({
      filterByFormula: `{Status} = 'In Transit'`,
    }).firstPage()
  } catch (error) {
    console.error('❌ getDropsInTransit error:', error.message)
    return []
  }
}

/**
 * Get drops at laundry
 */
export async function getDropsAtLaundry() {
  try {
    return await Drops.select({
      filterByFormula: `{Status} = 'At Laundry'`,
    }).firstPage()
  } catch (error) {
    console.error('❌ getDropsAtLaundry error:', error.message)
    return []
  }
}

/**
 * Get drops ready for delivery
 */
export async function getDropsReadyForDelivery() {
  try {
    return await Drops.select({
      filterByFormula: `{Status} = 'Ready'`,
    }).firstPage()
  } catch (error) {
    console.error('❌ getDropsReadyForDelivery error:', error.message)
    return []
  }
}

/**
 * Get all laundry partners
 */
export async function getLaundryPartners() {
  try {
    return await LaundryPartners.select().firstPage()
  } catch (error) {
    console.error('❌ getLaundryPartners error:', error.message)
    return []
  }
}

/**
 * Get active laundry partners
 */
export async function getActiveLaundryPartners() {
  try {
    return await LaundryPartners.select({
      filterByFormula: `{Status} = 'Active'`,
    }).firstPage()
  } catch (error) {
    console.error('❌ getActiveLaundryPartners error:', error.message)
    return []
  }
}

/**
 * Get gym to laundry partner mapping
 */
export async function getGymLaundryMapping() {
  try {
    const records = await GymsLaundryMapping.select().firstPage()
    const mapping = {}
    
    records.forEach(r => {
      const gym = r.fields['Gym']
      const partner = r.fields['Laundry Partner']
      const isDefault = r.fields['Is Default']
      
      if (gym && partner && isDefault) {
        const gymName = Array.isArray(gym) ? gym[0] : gym
        const partnerName = Array.isArray(partner) ? partner[0] : partner
        mapping[gymName] = partnerName
      }
    })
    
    return mapping
  } catch (error) {
    console.error('❌ getGymLaundryMapping error:', error.message)
    return {}
  }
}

/**
 * Get available bags (we removed Bags table, return empty)
 */
export async function getAvailableBags() {
  return []
}

/**
 * Get bags with issues (we removed Bags table, return empty)
 */
export async function getBagsWithIssues() {
  return []
}

/**
 * Get revenue breakdown by plan
 */
export async function getRevenueByPlan() {
  try {
    const [members, plans] = await Promise.all([
      Members.select({ filterByFormula: `{Subscription Status} = 'Active'` }).firstPage(),
      Plans.select().firstPage(),
    ])

    const planCounts = {}
    members.forEach(m => {
      const plan = m.fields['Subscription Tier'] || 'Essential'
      planCounts[plan] = (planCounts[plan] || 0) + 1
    })

    const planPrices = {}
    plans.forEach(p => {
      planPrices[p.fields['Name']] = p.fields['Price'] || 0
    })

    return Object.entries(planCounts).map(([name, count]) => ({
      name,
      count,
      price: planPrices[name] || 0,
      monthlyRevenue: count * (planPrices[name] || 0),
    }))
  } catch (error) {
    console.error('❌ getRevenueByPlan error:', error.message)
    return []
  }
}

/**
 * Get churn statistics
 */
export async function getChurnStats() {
  try {
    const members = await Members.select({
      filterByFormula: `{Subscription Status} = 'Cancelled'`,
    }).firstPage()
    
    const reasons = {}
    members.forEach(m => {
      const reason = m.fields['Cancellation Reason'] || 'Not specified'
      reasons[reason] = (reasons[reason] || 0) + 1
    })

    return {
      cancelledCount: members.length,
      reasons,
    }
  } catch (error) {
    console.error('❌ getChurnStats error:', error.message)
    return { cancelledCount: 0, reasons: {} }
  }
}

/**
 * Get utilisation statistics
 */
export async function getUtilisationStats() {
  try {
    const members = await Members.select({
      filterByFormula: `{Subscription Status} = 'Active'`,
    }).firstPage()
    
    let totalAllowed = 0
    let totalUsed = 0

    members.forEach(m => {
      const allowed = m.fields['Drops Allowed'] || 10
      const used = m.fields['Drops Used'] || 0
      totalAllowed += allowed
      totalUsed += used
    })

    const utilisationRate = totalAllowed > 0 
      ? Math.round((totalUsed / totalAllowed) * 100) 
      : 0

    return {
      totalAllowed,
      totalUsed,
      utilisationRate,
    }
  } catch (error) {
    console.error('❌ getUtilisationStats error:', error.message)
    return { totalAllowed: 0, totalUsed: 0, utilisationRate: 0 }
  }
}

/**
 * Get SLA statistics
 */
export async function getSLAStats() {
  try {
    const drops = await Drops.select({
      filterByFormula: `{Status} = 'Collected'`,
    }).firstPage()
    
    if (drops.length === 0) {
      return {
        avgTurnaroundHours: 0,
        onTimeRate: 100,
        totalCompleted: 0,
      }
    }

    let totalHours = 0
    let onTimeCount = 0

    drops.forEach(d => {
      const dropDate = new Date(d.fields['Drop Date'])
      const pickupDate = new Date(d.fields['Pickup Date'] || d.fields['Ready Date'])
      const hours = (pickupDate - dropDate) / (1000 * 60 * 60)
      
      totalHours += hours
      if (hours <= 48) onTimeCount++
    })

    return {
      avgTurnaroundHours: Math.round(totalHours / drops.length),
      onTimeRate: Math.round((onTimeCount / drops.length) * 100),
      totalCompleted: drops.length,
    }
  } catch (error) {
    console.error('❌ getSLAStats error:', error.message)
    return { avgTurnaroundHours: 0, onTimeRate: 100, totalCompleted: 0 }
  }
}

/**
 * Get bags breaching SLA
 */
export async function getBagsBreachingSLA() {
  try {
    const drops = await Drops.select({ maxRecords: 500 }).firstPage()
    const breaches = []

    const thresholds = {
      'Dropped': { warning: 4, critical: 6 },
      'In Transit': { warning: 4, critical: 8 },
      'At Laundry': { warning: 18, critical: 30 },
      'Ready': { warning: 72, critical: 120 },
    }

    drops.forEach(d => {
      const status = d.fields['Status']
      const threshold = thresholds[status]
      
      if (!threshold) return

      const statusDate = new Date(d.fields['Drop Date'] || d.fields['Created'])
      const hoursInStatus = (Date.now() - statusDate.getTime()) / (1000 * 60 * 60)

      if (hoursInStatus >= threshold.warning) {
        breaches.push({
          id: d.id,
          bagNumber: d.fields['Bag Number'],
          status,
          gym: d.fields['Gym'] || 'Unknown',
          memberName: d.fields['Member Name'] || 'Unknown',
          hoursInStatus: Math.round(hoursInStatus),
          threshold: threshold.critical,
          severity: hoursInStatus >= threshold.critical ? 'critical' : 'warning',
        })
      }
    })

    return breaches.sort((a, b) => b.hoursInStatus - a.hoursInStatus)
  } catch (error) {
    console.error('❌ getBagsBreachingSLA error:', error.message)
    return []
  }
}

// ============================================================================
// HELPER: Extract member context for WhatsApp handlers
// ============================================================================

export function extractMemberContext(member) {
  const fields = member.fields
  
  // Get gym name (from lookup field, not linked record)
  const gymName = fields['Gym Name'] || 'your gym'
  
  // Get gym record ID if needed
  const gymField = fields['Gym']
  const gymRecordId = Array.isArray(gymField) ? gymField[0] : null

  // Get plan details
  const planName = fields['Subscription Tier'] || 'Essential'
  const dropsAllowed = fields['Drops Allowed'] || (planName === 'Unlimited' ? 16 : planName === 'Essential' ? 10 : 1)

  return {
    memberId: member.id,
    firstName: fields['First Name'] || 'there',
    lastName: fields['Last Name'] || '',
    email: fields['Email'] || '',
    phone: fields['Phone'] || '',
    gymName,
    gymRecordId,
    planName,
    dropsAllowed,
    subscriptionStatus: fields['Subscription Status'] || 'Active',
    stripeCustomerId: fields['Stripe Customer ID'],
    stripeSubId: fields['Stripe Subscription ID'],
    signupDate: fields['Signup Date'],
    state: fields['Conversation State'] || 'idle',
    referralCode: fields['Referral Code'] || 'FLEX10',
    pendingIssueType: fields['Pending Issue Type'],
    dropsUsed: fields['Drops Used'] || 0,
  }
}
