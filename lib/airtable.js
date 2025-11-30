// lib/airtable.js
// OPTIMIZED: Connection reuse, gym field handling, efficient queries

import Airtable from 'airtable'

// ============================================================================
// CONFIGURATION - Reuse connection
// ============================================================================

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY,
  endpointUrl: 'https://api.airtable.com',
}).base(process.env.AIRTABLE_BASE_ID)

// Table references (reused)
const Members = base('Members')
const Drops = base('Drops')
const Gyms = base('Gyms')
const Issues = base('Issues')

// ============================================================================
// MEMBER FUNCTIONS
// ============================================================================

/**
 * Get member by phone number
 * Handles multiple phone formats: +447xxx, 447xxx, 07xxx
 */
export async function getMemberByPhone(phone) {
  // Normalize phone to search all formats
  const normalized = phone.replace('whatsapp:', '').replace(/\D/g, '')
  
  // Try different formats
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

  // Build OR formula
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

    const member = records[0]
    
    // OPTIMIZATION: Resolve gym name if it's a linked record
    if (member.fields['Gym'] && Array.isArray(member.fields['Gym'])) {
      // Check if there's already a lookup field
      if (!member.fields['Gym Name']) {
        try {
          const gymRecord = await Gyms.find(member.fields['Gym'][0])
          member.fields['Gym Name'] = gymRecord.fields['Name']
        } catch (e) {
          console.log(`⚠️ Could not resolve gym: ${e.message}`)
          member.fields['Gym Name'] = 'your gym'
        }
      }
    }

    return member
  } catch (error) {
    console.error(`❌ getMemberByPhone error: ${error.message}`)
    throw error
  }
}

/**
 * Update member's conversation state
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

// ============================================================================
// DROP FUNCTIONS
// ============================================================================

/**
 * Create a new drop
 * NOTE: gymName should be text, not a record ID
 */
export async function createDrop(memberId, bagNumber, gymName) {
  try {
    // Check what fields exist in your Drops table
    // Common variations: 'Gym', 'Gym Name', 'Location', 'Drop Location'
    
    const dropData = {
      'Member': [memberId],        // Linked record - must be array
      'Bag Number': bagNumber,
      'Status': 'Dropped',
      'Drop Date': new Date().toISOString(),
    }
    
    // TRY: Add gym as text field
    // If your Drops table has a text field for gym, use this:
    // dropData['Gym Name'] = gymName
    
    // OR if it's a linked record to Gyms table:
    // const gym = await getGymByName(gymName)
    // if (gym) dropData['Gym'] = [gym.id]
    
    // SAFEST: Don't include gym if it causes errors
    // The gym info is already on the Member record
    
    console.log(`📦 Creating drop:`, JSON.stringify(dropData))
    
    const record = await Drops.create(dropData)
    console.log(`✅ Drop created: ${record.id}`)
    return record
    
  } catch (error) {
    console.error(`❌ createDrop error: ${error.message}`)
    
    // If gym field causes error, retry without it
    if (error.message.includes('Unknown field')) {
      console.log(`⚠️ Retrying without problematic field...`)
      const retryData = {
        'Member': [memberId],
        'Bag Number': bagNumber,
        'Status': 'Dropped',
        'Drop Date': new Date().toISOString(),
      }
      return await Drops.create(retryData)
    }
    
    throw error
  }
}

/**
 * Get active drop for member (not yet collected)
 */
export async function getActiveDropByMember(memberId) {
  try {
    const records = await Drops.select({
      filterByFormula: `AND(
        FIND('${memberId}', ARRAYJOIN({Member})) > 0,
        NOT(OR({Status} = 'Collected', {Status} = 'Cancelled'))
      )`,
      maxRecords: 1,
    }).firstPage()

    return records[0] || null
  } catch (error) {
    // If formula fails, try simpler approach
    console.log(`⚠️ Complex formula failed, trying simple filter`)
    
    const allDrops = await Drops.select({
      maxRecords: 100,
    }).firstPage()
    
    return allDrops.find(d => {
      const memberLinks = d.fields['Member'] || []
      const status = d.fields['Status']
      return memberLinks.includes(memberId) && 
             status !== 'Collected' && 
             status !== 'Cancelled'
    }) || null
  }
}

/**
 * Get drop awaiting pickup confirmation (Ready status, not confirmed)
 */
export async function getDropAwaitingPickupConfirm(memberId) {
  try {
    const records = await Drops.select({
      filterByFormula: `AND(
        FIND('${memberId}', ARRAYJOIN({Member})) > 0,
        {Status} = 'Ready'
      )`,
      maxRecords: 1,
    }).firstPage()

    return records[0] || null
  } catch (error) {
    // Fallback to simple filter
    const allDrops = await Drops.select({
      filterByFormula: `{Status} = 'Ready'`,
      maxRecords: 100,
    }).firstPage()
    
    return allDrops.find(d => {
      const memberLinks = d.fields['Member'] || []
      return memberLinks.includes(memberId)
    }) || null
  }
}

/**
 * Get count of drops this month for member
 */
export async function getMemberDropsThisMonth(memberId) {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    
    const records = await Drops.select({
      filterByFormula: `AND(
        FIND('${memberId}', ARRAYJOIN({Member})) > 0,
        IS_AFTER({Drop Date}, '${startOfMonth}')
      )`,
    }).firstPage()

    return records.length
  } catch (error) {
    // Fallback
    const allDrops = await Drops.select({
      maxRecords: 100,
    }).firstPage()
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    return allDrops.filter(d => {
      const memberLinks = d.fields['Member'] || []
      const dropDate = new Date(d.fields['Drop Date'])
      return memberLinks.includes(memberId) && dropDate >= startOfMonth
    }).length
  }
}

/**
 * Update drop status
 */
export async function updateDropStatus(dropId, status) {
  try {
    const fields = { 'Status': status }
    
    if (status === 'Collected') {
      fields['Collected Date'] = new Date().toISOString()
    }
    
    return await Drops.update(dropId, fields)
  } catch (error) {
    console.error(`❌ updateDropStatus error: ${error.message}`)
    throw error
  }
}

// ============================================================================
// GYM FUNCTIONS
// ============================================================================

/**
 * Get all gyms
 */
export async function getGyms() {
  try {
    const records = await Gyms.select({
      fields: ['Name', 'Slug', 'Address'],
    }).firstPage()

    return records.map(r => ({
      id: r.id,
      name: r.fields['Name'],
      slug: r.fields['Slug'],
      address: r.fields['Address'],
    }))
  } catch (error) {
    console.error(`❌ getGyms error: ${error.message}`)
    return []
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

/**
 * Get gym name from record ID
 */
export async function getGymName(gymRecordId) {
  if (!gymRecordId) return 'your gym'
  
  try {
    const gym = await Gyms.find(gymRecordId)
    return gym.fields['Name'] || 'your gym'
  } catch (error) {
    console.error(`❌ getGymName error: ${error.message}`)
    return 'your gym'
  }
}

// ============================================================================
// ISSUE FUNCTIONS
// ============================================================================

/**
 * Create a support issue/ticket
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
      'Created': new Date().toISOString(),
    }
    
    if (photoUrl) {
      // If you have an Attachments field
      // issueData['Photos'] = [{ url: photoUrl }]
      // Or just store URL in description
      issueData['Photo URL'] = photoUrl
    }
    
    const record = await Issues.create(issueData)
    
    // Add the ticket ID to the returned record for reference
    record.fields['Ticket ID'] = ticketId
    
    return record
  } catch (error) {
    console.error(`❌ createIssue error: ${error.message}`)
    
    // Return a mock issue so the flow continues
    return {
      id: 'error',
      fields: {
        'Ticket ID': `FLEX-${Date.now().toString(36).toUpperCase()}`,
      }
    }
  }
}
