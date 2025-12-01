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
