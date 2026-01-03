// lib/airtable.js
// Airtable REST API functions for FLEX
// Uses direct fetch instead of SDK to avoid Vercel edge issues

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

// ============================================================================
// BASE FUNCTIONS
// ============================================================================

async function airtableFetch(table, options = {}) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`
  
  const response = await fetch(options.url || url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Airtable error: ${response.status}`)
  }

  return response.json()
}

async function airtableQuery(table, formula, options = {}) {
  const params = new URLSearchParams()
  if (formula) params.append('filterByFormula', formula)
  if (options.maxRecords) params.append('maxRecords', options.maxRecords)
  if (options.sort) {
    options.sort.forEach((s, i) => {
      params.append(`sort[${i}][field]`, s.field)
      params.append(`sort[${i}][direction]`, s.direction || 'asc')
    })
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${params}`
  return airtableFetch(table, { url })
}

// ============================================================================
// MEMBER FUNCTIONS
// ============================================================================

export async function getMemberById(memberId) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${memberId}`
    return airtableFetch('Members', { url })
  } catch (error) {
    console.error('getMemberById error:', error)
    return null
  }
}

export async function getMemberByPhone(phone) {
  const normalized = normalizePhone(phone)
  
  // Build search formats
  const formats = []
  if (normalized.startsWith('44')) {
    formats.push('+' + normalized)
    formats.push(normalized)
    formats.push('0' + normalized.slice(2))
  } else {
    formats.push(normalized)
    formats.push('+' + normalized)
  }

  const conditions = formats.map(f => `{Phone} = '${f}'`).join(', ')
  const formula = `OR(${conditions})`

  try {
    const data = await airtableQuery('Members', formula, { maxRecords: 1 })
    return data.records?.[0] || null
  } catch (error) {
    console.error('getMemberByPhone error:', error)
    return null
  }
}

export async function updateMember(memberId, fields) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${memberId}`
  
  return airtableFetch('Members', {
    url,
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })
}

export async function createMember(fields) {
  return airtableFetch('Members', {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })
}

// ============================================================================
// DROPS FUNCTIONS
// ============================================================================

export async function getActiveDropsByMember(memberId) {
  // Get drops that are not "Collected" or "Cancelled"
  const formula = `AND({Member} = '${memberId}', NOT(OR({Status} = 'Collected', {Status} = 'Cancelled')))`
  
  try {
    const data = await airtableQuery('Drops', formula, {
      sort: [{ field: 'Drop Date', direction: 'desc' }],
    })
    return data.records || []
  } catch (error) {
    console.error('getActiveDropsByMember error:', error)
    return []
  }
}

export async function getDropByBagNumber(bagNumber, memberId) {
  const formula = `AND({Bag Number} = '${bagNumber}', {Member} = '${memberId}')`
  
  try {
    const data = await airtableQuery('Drops', formula, { maxRecords: 1 })
    return data.records?.[0] || null
  } catch (error) {
    console.error('getDropByBagNumber error:', error)
    return null
  }
}

export async function createDrop(fields) {
  return airtableFetch('Drops', {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })
}

export async function updateDrop(dropId, fields) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Drops/${dropId}`
  
  return airtableFetch('Drops', {
    url,
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })
}

// ============================================================================
// GYMS FUNCTIONS
// ============================================================================

export async function getGyms() {
  try {
    const data = await airtableQuery('Gyms', "{Status} = 'Active'", {
      sort: [{ field: 'Name', direction: 'asc' }],
    })
    return data.records || []
  } catch (error) {
    console.error('getGyms error:', error)
    return []
  }
}

export async function getGymById(gymId) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Gyms/${gymId}`
    return airtableFetch('Gyms', { url })
  } catch (error) {
    console.error('getGymById error:', error)
    return null
  }
}

export async function getGymByCode(code) {
  const formula = `{Code} = '${code}'`
  
  try {
    const data = await airtableQuery('Gyms', formula, { maxRecords: 1 })
    return data.records?.[0] || null
  } catch (error) {
    console.error('getGymByCode error:', error)
    return null
  }
}

// ============================================================================
// ISSUES/TICKETS FUNCTIONS
// ============================================================================

export async function getMemberTickets(memberId) {
  const formula = `{Member} = '${memberId}'`
  
  try {
    const data = await airtableQuery('Issues', formula, {
      sort: [{ field: 'Created At', direction: 'desc' }],
    })
    return data.records || []
  } catch (error) {
    console.error('getMemberTickets error:', error)
    return []
  }
}

export async function getMemberOpenTickets(memberId) {
  const formula = `AND({Member} = '${memberId}', NOT(OR({Status} = 'Resolved', {Status} = 'Closed')))`
  
  try {
    const data = await airtableQuery('Issues', formula, {
      sort: [{ field: 'Created At', direction: 'desc' }],
    })
    return data.records || []
  } catch (error) {
    console.error('getMemberOpenTickets error:', error)
    return []
  }
}

export async function createIssue(fields) {
  return airtableFetch('Issues', {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })
}

export async function updateIssue(issueId, fields) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Issues/${issueId}`
  
  return airtableFetch('Issues', {
    url,
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })
}

// ============================================================================
// PLANS FUNCTIONS
// ============================================================================

export async function getPlanDetails(planName) {
  const formula = `{Name} = '${planName}'`
  
  try {
    const data = await airtableQuery('Plans', formula, { maxRecords: 1 })
    const record = data.records?.[0]
    
    if (!record) {
      // Return defaults if plan not in Airtable
      const defaults = {
        'One-Off': { price: 5, drops: 1 },
        'Essential': { price: 35, drops: 8 },
        'Unlimited': { price: 48, drops: 16 },
      }
      return defaults[planName] || defaults['Essential']
    }
    
    return {
      price: record.fields['Price'],
      drops: record.fields['Drops'],
      features: record.fields['Features'],
    }
  } catch (error) {
    console.error('getPlanDetails error:', error)
    return { price: 35, drops: 8 }
  }
}

// ============================================================================
// CONTEXT EXTRACTION
// ============================================================================

export function extractMemberContext(member) {
  if (!member) return null
  
  const fields = member.fields || member
  
  return {
    id: member.id,
    firstName: fields['First Name'] || '',
    lastName: fields['Last Name'] || '',
    email: fields['Email'] || '',
    phone: fields['Phone'] || '',
    gymName: fields['Gym Name']?.[0] || fields['Gym Name'] || 'your gym',
    gymId: fields['Gym']?.[0] || null,
    plan: fields['Subscription Tier'] || 'Essential',
    status: fields['Subscription Status'] || 'Active',
    dropsUsed: fields['Drops Used'] || 0,
    dropsAllowed: fields['Drops Allowed'] || 8,
    conversationState: fields['Conversation State'] || 'idle',
    stripeCustomerId: fields['Stripe Customer ID'],
    stripeSubscriptionId: fields['Stripe Subscription ID'],
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function normalizePhone(phone) {
  if (!phone) return ''
  let cleaned = phone.replace('whatsapp:', '').replace(/\D/g, '')
  
  // Handle UK numbers
  if (cleaned.startsWith('0')) {
    cleaned = '44' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('44') && cleaned.length === 10) {
    cleaned = '44' + cleaned
  }
  
  return cleaned
}

export { normalizePhone }
