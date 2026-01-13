// lib/airtable.js
// ============================================================================
// AIRTABLE DATABASE FUNCTIONS
// MVP VERSION - Uses REST API with bag validation
// ============================================================================

import { 
  TABLES, 
  DROP_STATUSES, 
  MEMBER_STATUSES, 
  BAG_STATUSES,
  CONVERSATION_STATES 
} from './constants.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appkU13tG14ZLVZZ9';
const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Re-export TABLES for convenience
export { TABLES };

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function normalizePhone(phone) {
  if (!phone) return null;
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  // Ensure it starts with +44 for UK numbers
  if (cleaned.startsWith('0')) {
    cleaned = '+44' + cleaned.slice(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export function normalizeBagNumber(input) {
  if (!input) return null;
  // Accept "B042", "b042", "042", "42" -> "B042"
  const match = input.toString().match(/^B?0*(\d{1,3})$/i);
  if (!match) return null;
  return `B${match[1].padStart(3, '0')}`;
}

async function airtableFetch(endpoint, options = {}) {
  const url = `${BASE_URL}/${encodeURIComponent(endpoint)}`;
  
  const response = await fetch(url + (options.params ? `?${new URLSearchParams(options.params)}` : ''), {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Airtable API error: ${response.status}`, error);
    throw new Error(`Airtable API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============================================================================
// MEMBER FUNCTIONS
// ============================================================================

export async function getMemberByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  try {
    const data = await airtableFetch(TABLES.MEMBERS, {
      params: {
        filterByFormula: `{Phone} = '${normalizedPhone}'`,
        maxRecords: 1,
      },
    });

    if (data.records && data.records.length > 0) {
      return {
        id: data.records[0].id,
        fields: data.records[0].fields,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting member by phone:', error);
    return null;
  }
}

export async function getMemberById(memberId) {
  try {
    const data = await airtableFetch(`${TABLES.MEMBERS}/${memberId}`);
    return {
      id: data.id,
      fields: data.fields,
    };
  } catch (error) {
    console.error('Error getting member by ID:', error);
    return null;
  }
}

export async function getMemberByStripeCustomerId(stripeCustomerId) {
  try {
    const data = await airtableFetch(TABLES.MEMBERS, {
      params: {
        filterByFormula: `{Stripe Customer ID} = '${stripeCustomerId}'`,
        maxRecords: 1,
      },
    });

    if (data.records && data.records.length > 0) {
      return {
        id: data.records[0].id,
        fields: data.records[0].fields,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting member by Stripe customer ID:', error);
    return null;
  }
}

export async function getMemberByEmail(email) {
  if (!email) return null;
  
  try {
    const data = await airtableFetch(TABLES.MEMBERS, {
      params: {
        filterByFormula: `LOWER({Email}) = '${email.toLowerCase()}'`,
        maxRecords: 1,
      },
    });

    if (data.records && data.records.length > 0) {
      return {
        id: data.records[0].id,
        fields: data.records[0].fields,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting member by email:', error);
    return null;
  }
}

export async function createMember(memberData) {
  try {
    const data = await airtableFetch(TABLES.MEMBERS, {
      method: 'POST',
      body: {
        records: [{
          fields: {
            'Phone': normalizePhone(memberData.phone),
            'Email': memberData.email,
            'First Name': memberData.firstName,
            'Last Name': memberData.lastName || '',
            'Gym': memberData.gymId ? [memberData.gymId] : [],
            'Subscription Tier': memberData.plan || '',
            'Status': memberData.status || MEMBER_STATUSES.PENDING,
            'Stripe Customer ID': memberData.stripeCustomerId || '',
            'Stripe Subscription ID': memberData.stripeSubscriptionId || '',
            'Conversation State': CONVERSATION_STATES.IDLE,
            'Drops Remaining': memberData.dropsRemaining || 0,
            'Total Drops': 0,
          },
        }],
      },
    });

    return {
      id: data.records[0].id,
      fields: data.records[0].fields,
    };
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
}

export async function updateMember(memberId, updates) {
  try {
    const data = await airtableFetch(`${TABLES.MEMBERS}/${memberId}`, {
      method: 'PATCH',
      body: {
        fields: updates,
      },
    });

    return {
      id: data.id,
      fields: data.fields,
    };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
}

// ============================================================================
// BAG FUNCTIONS (NEW)
// ============================================================================

export async function getBagByNumber(bagNumber) {
  const normalized = normalizeBagNumber(bagNumber);
  if (!normalized) return null;

  try {
    const data = await airtableFetch(TABLES.BAGS, {
      params: {
        filterByFormula: `{Bag Number} = '${normalized}'`,
        maxRecords: 1,
      },
    });

    if (data.records && data.records.length > 0) {
      return {
        id: data.records[0].id,
        fields: data.records[0].fields,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting bag by number:', error);
    return null;
  }
}

export async function validateBag(bagNumber) {
  const normalized = normalizeBagNumber(bagNumber);
  
  if (!normalized) {
    return { 
      valid: false, 
      error: 'INVALID_FORMAT',
      message: 'Bag number should look like B042 or 042',
    };
  }

  const bag = await getBagByNumber(normalized);

  if (!bag) {
    return { 
      valid: false, 
      error: 'NOT_FOUND',
      message: `Bag ${normalized} doesn't exist in our system`,
    };
  }

  if (bag.fields['Status'] !== BAG_STATUSES.AVAILABLE) {
    return { 
      valid: false, 
      error: 'NOT_AVAILABLE',
      message: `Bag ${normalized} is already in use`,
    };
  }

  return { 
    valid: true, 
    bag,
    bagNumber: normalized,
  };
}

export async function markBagInUse(bagId, dropId) {
  try {
    const data = await airtableFetch(`${TABLES.BAGS}/${bagId}`, {
      method: 'PATCH',
      body: {
        fields: {
          'Status': BAG_STATUSES.IN_USE,
          'Current Drop': [dropId],
        },
      },
    });

    return { id: data.id, fields: data.fields };
  } catch (error) {
    console.error('Error marking bag in use:', error);
    throw error;
  }
}

export async function markBagAvailable(bagId) {
  try {
    const data = await airtableFetch(`${TABLES.BAGS}/${bagId}`, {
      method: 'PATCH',
      body: {
        fields: {
          'Status': BAG_STATUSES.AVAILABLE,
          'Current Drop': [],
        },
      },
    });

    return { id: data.id, fields: data.fields };
  } catch (error) {
    console.error('Error marking bag available:', error);
    throw error;
  }
}

// ============================================================================
// DROP FUNCTIONS
// ============================================================================

export async function createDrop({ memberId, bagId, bagNumber, gymId }) {
  try {
    // Calculate expected ready date (48 hours from now)
    const expectedReady = new Date();
    expectedReady.setHours(expectedReady.getHours() + 48);

    const data = await airtableFetch(TABLES.DROPS, {
      method: 'POST',
      body: {
        records: [{
          fields: {
            'Member': [memberId],
            'Bag Number': bagNumber,
            'Bag': bagId ? [bagId] : [],
            'Status': DROP_STATUSES.DROPPED,
            'Drop Date': new Date().toISOString(),
            'Expected Ready': expectedReady.toISOString(),
            'Gym': gymId ? [gymId] : [],
          },
        }],
      },
    });

    const drop = {
      id: data.records[0].id,
      fields: data.records[0].fields,
    };

    // Mark the bag as in use
    if (bagId) {
      await markBagInUse(bagId, drop.id);
    }

    return drop;
  } catch (error) {
    console.error('Error creating drop:', error);
    throw error;
  }
}

export async function getActiveDropsByMember(memberId) {
  try {
    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `AND(
          FIND('${memberId}', ARRAYJOIN({Member})),
          NOT(OR(
            {Status} = '${DROP_STATUSES.COLLECTED}'
          ))
        )`,
        sort: [{ field: 'Drop Date', direction: 'desc' }],
      },
    });

    return data.records.map(record => ({
      id: record.id,
      fields: record.fields,
    }));
  } catch (error) {
    console.error('Error getting active drops:', error);
    return [];
  }
}

export async function getAllDropsByMember(memberId, limit = 20) {
  try {
    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `FIND('${memberId}', ARRAYJOIN({Member}))`,
        sort: [{ field: 'Drop Date', direction: 'desc' }],
        maxRecords: limit,
      },
    });

    return data.records.map(record => ({
      id: record.id,
      fields: record.fields,
    }));
  } catch (error) {
    console.error('Error getting all drops:', error);
    return [];
  }
}

export async function getDropById(dropId) {
  try {
    const data = await airtableFetch(`${TABLES.DROPS}/${dropId}`);
    return {
      id: data.id,
      fields: data.fields,
    };
  } catch (error) {
    console.error('Error getting drop by ID:', error);
    return null;
  }
}

export async function updateDropStatus(dropId, status) {
  try {
    const updates = { 'Status': status };
    
    // Add timestamp based on status
    if (status === DROP_STATUSES.READY) {
      updates['Ready Date'] = new Date().toISOString();
    } else if (status === DROP_STATUSES.COLLECTED) {
      updates['Collected Date'] = new Date().toISOString();
      
      // Also mark bag as available again
      const drop = await getDropById(dropId);
      if (drop?.fields?.Bag?.[0]) {
        await markBagAvailable(drop.fields.Bag[0]);
      }
    }

    const data = await airtableFetch(`${TABLES.DROPS}/${dropId}`, {
      method: 'PATCH',
      body: { fields: updates },
    });

    return {
      id: data.id,
      fields: data.fields,
    };
  } catch (error) {
    console.error('Error updating drop status:', error);
    throw error;
  }
}

// ============================================================================
// GYM FUNCTIONS
// ============================================================================

export async function getGymByCode(gymCode) {
  if (!gymCode) return null;
  
  try {
    const data = await airtableFetch(TABLES.GYMS, {
      params: {
        filterByFormula: `LOWER({Code}) = '${gymCode.toLowerCase()}'`,
        maxRecords: 1,
      },
    });

    if (data.records && data.records.length > 0) {
      return {
        id: data.records[0].id,
        fields: data.records[0].fields,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting gym by code:', error);
    return null;
  }
}

export async function getGymById(gymId) {
  try {
    const data = await airtableFetch(`${TABLES.GYMS}/${gymId}`);
    return {
      id: data.id,
      fields: data.fields,
    };
  } catch (error) {
    console.error('Error getting gym by ID:', error);
    return null;
  }
}

export async function getAllGyms() {
  try {
    const data = await airtableFetch(TABLES.GYMS, {
      params: {
        filterByFormula: `{Active} = TRUE()`,
        sort: [{ field: 'Name', direction: 'asc' }],
      },
    });

    return data.records.map(record => ({
      id: record.id,
      fields: record.fields,
    }));
  } catch (error) {
    console.error('Error getting all gyms:', error);
    return [];
  }
}

// ============================================================================
// ISSUE/SUPPORT FUNCTIONS
// ============================================================================

export async function createIssue({ memberId, type, description, photoUrls = [], dropId = null }) {
  try {
    const data = await airtableFetch(TABLES.ISSUES, {
      method: 'POST',
      body: {
        records: [{
          fields: {
            'Member': [memberId],
            'Type': type || 'General',
            'Description': description,
            'Status': 'Open',
            'Created': new Date().toISOString(),
            ...(dropId && { 'Drop': [dropId] }),
            ...(photoUrls.length > 0 && { 'Photos': photoUrls.map(url => ({ url })) }),
          },
        }],
      },
    });

    return {
      id: data.records[0].id,
      fields: data.records[0].fields,
    };
  } catch (error) {
    console.error('Error creating issue:', error);
    throw error;
  }
}

export async function getOpenIssues() {
  try {
    const data = await airtableFetch(TABLES.ISSUES, {
      params: {
        filterByFormula: `{Status} = 'Open'`,
        sort: [{ field: 'Created', direction: 'desc' }],
      },
    });

    return data.records.map(record => ({
      id: record.id,
      fields: record.fields,
    }));
  } catch (error) {
    console.error('Error getting open issues:', error);
    return [];
  }
}

export async function updateIssue(issueId, updates) {
  try {
    const data = await airtableFetch(`${TABLES.ISSUES}/${issueId}`, {
      method: 'PATCH',
      body: { fields: updates },
    });

    return {
      id: data.id,
      fields: data.fields,
    };
  } catch (error) {
    console.error('Error updating issue:', error);
    throw error;
  }
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

export async function setVerificationCode(memberId, code, expiresAt) {
  return updateMember(memberId, {
    'Verification Code': code,
    'Verification Expires': expiresAt.toISOString(),
    'Verification Attempts': 0,
  });
}

export async function checkVerificationCode(memberId, code) {
  const member = await getMemberById(memberId);
  
  if (!member) {
    return { success: false, error: 'Member not found' };
  }
  
  const storedCode = member.fields['Verification Code'];
  const expires = member.fields['Verification Expires'];
  const attempts = member.fields['Verification Attempts'] || 0;

  // Check attempts
  if (attempts >= 3) {
    return { success: false, error: 'Too many attempts. Please request a new code.' };
  }

  // Check expiry
  if (!expires || new Date(expires) < new Date()) {
    return { success: false, error: 'Code expired. Please request a new code.' };
  }

  // Check code
  if (storedCode !== code) {
    await updateMember(memberId, {
      'Verification Attempts': attempts + 1,
    });
    return { success: false, error: 'Invalid code' };
  }

  // Success - clear verification fields
  await updateMember(memberId, {
    'Verification Code': '',
    'Verification Expires': '',
    'Verification Attempts': 0,
  });

  return { success: true, member };
}

export async function clearVerificationCode(memberId) {
  return updateMember(memberId, {
    'Verification Code': '',
    'Verification Expires': '',
    'Verification Attempts': 0,
  });
}

// Alias for backwards compatibility with auth.js
export const verifyCode = checkVerificationCode;

// ============================================================================
// STATS FUNCTIONS (for ops dashboard)
// ============================================================================

export async function getMemberStats() {
  try {
    const data = await airtableFetch(TABLES.MEMBERS);
    
    const stats = {
      total: data.records.length,
      active: 0,
      paused: 0,
      cancelled: 0,
    };

    data.records.forEach(record => {
      const status = record.fields.Status;
      if (status === MEMBER_STATUSES.ACTIVE) stats.active++;
      else if (status === MEMBER_STATUSES.PAUSED) stats.paused++;
      else if (status === MEMBER_STATUSES.CANCELLED) stats.cancelled++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting member stats:', error);
    return { total: 0, active: 0, paused: 0, cancelled: 0 };
  }
}

export async function getDropStats() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `IS_AFTER({Drop Date}, '${thirtyDaysAgo.toISOString().split('T')[0]}')`,
      },
    });

    const stats = {
      total: data.records.length,
      byStatus: {},
    };

    data.records.forEach(record => {
      const status = record.fields.Status || 'Unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting drop stats:', error);
    return { total: 0, byStatus: {} };
  }
}
