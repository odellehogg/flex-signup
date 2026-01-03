// lib/airtable.js
// FLEX Airtable MVP - Simplified data access
// Using direct fetch API to avoid SDK AbortSignal issues

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`

// ============================================================================
// CORE FETCH HELPERS
// ============================================================================

async function airtableFetch(table, options = {}) {
  const { filterByFormula, maxRecords, sort, recordId, method = 'GET', body } = options
  
  let url = `${AIRTABLE_URL}/${encodeURIComponent(table)}`
  
  if (recordId) {
    url += `/${recordId}`
  } else if (method === 'GET') {
    const params = new URLSearchParams()
    if (filterByFormula) params.append('filterByFormula', filterByFormula)
    if (maxRecords) params.append('maxRecords', String(maxRecords))
    if (sort) {
      sort.forEach((s, i) => {
        params.append(`sort[${i}][field]`, s.field)
        params.append(`sort[${i}][direction]`, s.direction || 'asc')
      })
    }
    if (params.toString()) url += `?${params.toString()}`
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
    const error = await response.text()
    throw new Error(`Airtable error: ${error}`)
  }
  
  return response.json()
}

async function getRecords(table, options = {}) {
  const data = await airtableFetch(table, options)
  return data.records || []
}

async function getRecord(table, recordId) {
  return airtableFetch(table, { recordId })
}

async function createRecord(table, fields) {
  return airtableFetch(table, { method: 'POST', body: { fields } })
}

async function updateRecord(table, recordId, fields) {
  return airtableFetch(table, { method: 'PATCH', recordId, body: { fields } })
}

// ============================================================================
// MEMBER FUNCTIONS
// ============================================================================

/**
 * Get member by phone number
 * Handles: +447xxx, 447xxx, 07xxx formats
 */
export async function getMemberByPhone(phone) {
  const normalized = phone.replace('whatsapp:', '').replace(/\D/g, '')
  
  // Build search formats for UK numbers
  const formats = []
  if (normalized.startsWith('44')) {
    formats.push('+' + normalized)
    formats.push(normalized)
    formats.push('0' + normalized.slice(2))
  } else if (normalized.startsWith('0')) {
    formats.push(normalized)
    formats.push('+44' + normalized.slice(1))
    formats.push('44' + normalized.slice(1))
  } else {
    formats.push(normalized)
    formats.push('+' + normalized)
  }

  const conditions = formats.map(f => `{Phone} = '${f}'`).join(', ')
  const formula = `OR(${conditions})`

  try {
    const records = await getRecords('Members', {
      filterByFormula: formula,
      maxRecords: 1,
    })

    if (records.length === 0) {
      console.log(`❌ No member found for: ${formats.join(' / ')}`)
      return null
    }

    return records[0]
  } catch (error) {
    console.error(`❌ getMemberByPhone error: ${error.message}`)
    return null
  }
}

/**
 * Get member by Airtable record ID
 */
export async function getMemberById(memberId) {
  try {
    return await getRecord('Members', memberId)
  } catch (error) {
    console.error(`❌ getMemberById error: ${error.message}`)
    return null
  }
}

/**
 * Get member by Stripe customer ID
 */
export async function getMemberByStripeId(stripeCustomerId) {
  try {
    const records = await getRecords('Members', {
      filterByFormula: `{Stripe Customer ID} = '${stripeCustomerId}'`,
      maxRecords: 1,
    })
    return records[0] || null
  } catch (error) {
    console.error(`❌ getMemberByStripeId error: ${error.message}`)
    return null
  }
}

/**
 * Update member's conversation state
 */
export async function updateMemberState(memberId, state) {
  try {
    return await updateRecord('Members', memberId, {
      'Conversation State': state,
    })
  } catch (error) {
    console.error(`❌ updateMemberState error: ${error.message}`)
  }
}

/**
 * Update member fields
 */
export async function updateMember(memberId, fields) {
  try {
    return await updateRecord('Members', memberId, fields)
  } catch (error) {
    console.error(`❌ updateMember error: ${error.message}`)
  }
}

/**
 * Create new member
 */
export async function createMember(data) {
  try {
    const fields = {
      'First Name': data.firstName,
      'Last Name': data.lastName || '',
      'Email': data.email,
      'Phone': data.phone,
      'Subscription Tier': data.plan || 'Essential',
      'Subscription Status': 'Active',
      'Stripe Customer ID': data.stripeCustomerId || '',
      'Stripe Subscription ID': data.stripeSubscriptionId || '',
      'Signup Date': new Date().toISOString(),
      'Conversation State': 'idle',
      'Drops Used': 0,
    }
    
    // Add gym if provided (must be record ID)
    if (data.gymId) {
      fields['Gym'] = [data.gymId]
    }
    
    return await createRecord('Members', fields)
  } catch (error) {
    console.error(`❌ createMember error: ${error.message}`)
    throw error
  }
}

// ============================================================================
// DROP FUNCTIONS
// ============================================================================

/**
 * Create a new drop
 */
export async function createDrop(memberId, bagNumber, gymId = null) {
  try {
    const fields = {
      'Bag Number': bagNumber,
      'Member': [memberId],
      'Status': 'Dropped',
      'Drop Date': new Date().toISOString(),
    }
    
    if (gymId) {
      fields['Gym'] = [gymId]
    }
    
    const record = await createRecord('Drops', fields)
    console.log(`✅ Drop created: ${bagNumber}`)
    return record
    
  } catch (error) {
    console.error(`❌ createDrop error: ${error.message}`)
    throw error
  }
}

/**
 * Get all active drops for a member (not Collected or Cancelled)
 */
export async function getActiveDropsByMember(memberId) {
  try {
    const records = await getRecords('Drops', {
      filterByFormula: `AND({Status} != 'Collected', {Status} != 'Cancelled')`,
      maxRecords: 50,
      sort: [{ field: 'Drop Date', direction: 'desc' }],
    })
    
    // Filter by member (linked record field)
    return records.filter(d => {
      const memberLinks = d.fields['Member'] || []
      return memberLinks.includes(memberId)
    })
    
  } catch (error) {
    console.error(`❌ getActiveDropsByMember error: ${error.message}`)
    return []
  }
}

/**
 * Get single active drop for member
 */
export async function getActiveDropByMember(memberId) {
  const drops = await getActiveDropsByMember(memberId)
  return drops[0] || null
}

/**
 * Update drop fields
 */
export async function updateDrop(dropId, fields) {
  try {
    return await updateRecord('Drops', dropId, fields)
  } catch (error) {
    console.error(`❌ updateDrop error: ${error.message}`)
  }
}

/**
 * Get drop by bag number
 */
export async function getDropByBagNumber(bagNumber) {
  try {
    const records = await getRecords('Drops', {
      filterByFormula: `{Bag Number} = '${bagNumber}'`,
      maxRecords: 1,
      sort: [{ field: 'Drop Date', direction: 'desc' }],
    })
    return records[0] || null
  } catch (error) {
    console.error(`❌ getDropByBagNumber error: ${error.message}`)
    return null
  }
}

// ============================================================================
// GYM FUNCTIONS
// ============================================================================

/**
 * Get all active gyms
 */
export async function getGyms() {
  try {
    return await getRecords('Gyms', {
      filterByFormula: `{Status} = 'Active'`,
    })
  } catch (error) {
    console.error(`❌ getGyms error: ${error.message}`)
    return []
  }
}

/**
 * Get gym by slug
 */
export async function getGymBySlug(slug) {
  try {
    const records = await getRecords('Gyms', {
      filterByFormula: `{Slug} = '${slug}'`,
      maxRecords: 1,
    })
    return records[0] || null
  } catch (error) {
    console.error(`❌ getGymBySlug error: ${error.message}`)
    return null
  }
}

// ============================================================================
// PLAN FUNCTIONS
// ============================================================================

/**
 * Get all active plans
 */
export async function getPlans() {
  try {
    return await getRecords('Plans', {
      filterByFormula: `{Active} = TRUE()`,
      sort: [{ field: 'Price', direction: 'asc' }],
    })
  } catch (error) {
    console.error(`❌ getPlans error: ${error.message}`)
    return []
  }
}

/**
 * Get plan details
 */
export function getPlanDetails(planName) {
  const plans = {
    'One-Off': { price: 5, drops: 1 },
    'Essential': { price: 35, drops: 8 },
    'Unlimited': { price: 48, drops: 16 },
  }
  return plans[planName] || plans['Essential']
}

// ============================================================================
// CONTEXT EXTRACTOR
// ============================================================================

/**
 * Extract member context for WhatsApp handlers
 */
export function extractMemberContext(member) {
  const fields = member.fields
  
  // Get gym name from lookup field
  const gymName = fields['Gym Name']?.[0] || fields['Gym Name'] || 'your gym'
  
  // Get gym record ID
  const gymField = fields['Gym']
  const gymRecordId = Array.isArray(gymField) ? gymField[0] : null

  // Get plan details
  const planName = fields['Subscription Tier'] || 'Essential'
  const planDetails = getPlanDetails(planName)

  return {
    memberId: member.id,
    firstName: fields['First Name'] || 'there',
    lastName: fields['Last Name'] || '',
    email: fields['Email'] || '',
    phone: fields['Phone'] || '',
    gymName,
    gymRecordId,
    planName,
    dropsAllowed: planDetails.drops,
    dropsUsed: fields['Drops Used'] || 0,
    subscriptionStatus: fields['Subscription Status'] || 'Active',
    stripeCustomerId: fields['Stripe Customer ID'],
    stripeSubId: fields['Stripe Subscription ID'],
    state: fields['Conversation State'] || 'idle',
    pendingIssueType: fields['Pending Issue Type'],
    pendingDescription: fields['Pending Issue Description'],
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  airtableFetch,
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
}
