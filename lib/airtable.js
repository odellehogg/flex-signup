// lib/airtable.js
// ============================================================================
// AIRTABLE DATABASE FUNCTIONS
// Uses REST API (not npm package) to avoid AbortSignal errors in Vercel
// Uses ARRAYJOIN for linked record queries
// ✅ FIX: Uses "Phone" field name (not "Phone Number")
// ============================================================================

import { TABLES, DROP_STATUSES, MEMBER_STATUSES } from './constants.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appkU13tG14ZLVZZ9';
const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Re-export TABLES for convenience
export { TABLES };

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normalizePhone(phone) {
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
    // ✅ FIX: Use "Phone" to match actual Airtable field name
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

export async function createMember(memberData) {
  try {
    const data = await airtableFetch(TABLES.MEMBERS, {
      method: 'POST',
      body: {
        records: [{
          fields: {
            // ✅ FIX: Use "Phone" to match actual Airtable field name
            'Phone': normalizePhone(memberData.phone),
            'Email': memberData.email,
            'First Name': memberData.firstName,
            'Last Name': memberData.lastName || '',
            'Gym': memberData.gymId ? [memberData.gymId] : [],
            'Subscription Tier': memberData.plan,
            'Status': MEMBER_STATUSES.ACTIVE,
            'Stripe Customer ID': memberData.stripeCustomerId,
            'Stripe Subscription ID': memberData.stripeSubscriptionId || '',
            'Conversation State': 'idle',
            'Total Drops': 0,
            'Drops This Period': 0,
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

export async function updateConversationState(memberId, state, additionalFields = {}) {
  return updateMember(memberId, {
    'Conversation State': state,
    ...additionalFields,
  });
}

// ============================================================================
// DROP FUNCTIONS
// ============================================================================

export async function createDrop(dropData) {
  try {
    const data = await airtableFetch(TABLES.DROPS, {
      method: 'POST',
      body: {
        records: [{
          fields: {
            'Member': [dropData.memberId],
            'Bag Number': dropData.bagNumber,
            'Status': DROP_STATUSES.DROPPED,
            'Drop Date': new Date().toISOString(),
            'Gym': dropData.gymId ? [dropData.gymId] : [],
          },
        }],
      },
    });

    // Also increment member's drop count
    await incrementDropCount(dropData.memberId);

    return {
      id: data.records[0].id,
      fields: data.records[0].fields,
    };
  } catch (error) {
    console.error('Error creating drop:', error);
    throw error;
  }
}

export async function getDropByBagNumber(bagNumber) {
  try {
    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `{Bag Number} = '${bagNumber}'`,
        sort: [{ field: 'Drop Date', direction: 'desc' }],
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
    console.error('Error getting drop by bag number:', error);
    return null;
  }
}

export async function getActiveDropsByMember(memberId) {
  // ✅ Use FIND with ARRAYJOIN for linked record queries
  try {
    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `AND(FIND('${memberId}', ARRAYJOIN({Member})), NOT(OR({Status} = 'Collected', {Status} = 'Cancelled')))`,
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

export async function getAllDropsByMember(memberId) {
  try {
    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `FIND('${memberId}', ARRAYJOIN({Member}))`,
        sort: [{ field: 'Drop Date', direction: 'desc' }],
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

export async function updateDropStatus(dropId, status) {
  try {
    const updates = { 'Status': status };
    
    // Add timestamp based on status
    if (status === DROP_STATUSES.READY) {
      updates['Ready Date'] = new Date().toISOString();
    } else if (status === DROP_STATUSES.COLLECTED) {
      updates['Collected Date'] = new Date().toISOString();
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

export async function incrementDropCount(memberId) {
  try {
    const member = await getMemberById(memberId);
    const currentTotal = member.fields['Total Drops'] || 0;
    const currentPeriod = member.fields['Drops This Period'] || 0;

    await updateMember(memberId, {
      'Total Drops': currentTotal + 1,
      'Drops This Period': currentPeriod + 1,
    });
  } catch (error) {
    console.error('Error incrementing drop count:', error);
  }
}

// ============================================================================
// GYM FUNCTIONS
// ============================================================================

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

export async function getGymByCode(code) {
  try {
    const data = await airtableFetch(TABLES.GYMS, {
      params: {
        filterByFormula: `{Code} = '${code}'`,
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

export async function getAllGyms() {
  try {
    const data = await airtableFetch(TABLES.GYMS, {
      params: {
        filterByFormula: `{Status} = 'Active'`,
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

// Alias for getAllGyms
export async function getGyms() {
  return getAllGyms();
}

// ============================================================================
// ISSUE/SUPPORT FUNCTIONS
// ============================================================================

export async function createIssue(issueData) {
  try {
    const data = await airtableFetch(TABLES.ISSUES, {
      method: 'POST',
      body: {
        records: [{
          fields: {
            'Member': [issueData.memberId],
            'Issue Type': issueData.type,
            'Description': issueData.description,
            'Status': 'Open',
            'Drop': issueData.dropId ? [issueData.dropId] : [],
            'Photo URLs': issueData.photoUrls?.join(',') || '',
            'Created': new Date().toISOString(),
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

export async function getIssuesByMember(memberId) {
  try {
    const data = await airtableFetch(TABLES.ISSUES, {
      params: {
        filterByFormula: `FIND('${memberId}', ARRAYJOIN({Member}))`,
        sort: [{ field: 'Created', direction: 'desc' }],
      },
    });

    return data.records.map(record => ({
      id: record.id,
      fields: record.fields,
    }));
  } catch (error) {
    console.error('Error getting issues by member:', error);
    return [];
  }
}

export async function getOpenIssues() {
  try {
    const data = await airtableFetch(TABLES.ISSUES, {
      params: {
        filterByFormula: `{Status} = 'Open'`,
        sort: [{ field: 'Created', direction: 'asc' }],
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
// REVENUE/REPORTING FUNCTIONS (for ops dashboard)
// ============================================================================

export async function getRevenueByPlan() {
  try {
    const data = await airtableFetch(TABLES.MEMBERS, {
      params: {
        filterByFormula: `{Status} = 'Active'`,
      },
    });

    const planCounts = {};
    const planPrices = {
      'One-Off': 5,
      'Essential': 35,
      'Unlimited': 48,
    };

    (data.records || []).forEach(member => {
      const plan = member.fields['Subscription Tier'];
      if (plan) {
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      }
    });

    return Object.entries(planCounts).map(([name, count]) => ({
      name,
      count,
      price: planPrices[name] || 0,
      monthlyRevenue: count * (planPrices[name] || 0),
    }));
  } catch (error) {
    console.error('Error getting revenue by plan:', error);
    return [];
  }
}

export async function getChurnStats() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await airtableFetch(TABLES.MEMBERS, {
      params: {
        filterByFormula: `AND({Status} = 'Cancelled', IS_AFTER({Modified}, '${thirtyDaysAgo.toISOString().split('T')[0]}'))`,
      },
    });

    const reasons = {};
    (data.records || []).forEach(member => {
      const reason = member.fields['Cancellation Reason'] || 'Not specified';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    return {
      cancelledCount: data.records?.length || 0,
      reasons,
    };
  } catch (error) {
    console.error('Error getting churn stats:', error);
    return { cancelledCount: 0, reasons: {} };
  }
}

export async function getUtilisationStats() {
  try {
    const membersData = await airtableFetch(TABLES.MEMBERS, {
      params: {
        filterByFormula: `{Status} = 'Active'`,
      },
    });

    const planDrops = {
      'One-Off': 1,
      'Essential': 10,
      'Unlimited': 16,
    };

    let totalUsed = 0;
    let totalAllowed = 0;

    (membersData.records || []).forEach(member => {
      const plan = member.fields['Subscription Tier'];
      const used = member.fields['Drops This Period'] || 0;
      const allowed = planDrops[plan] || 0;
      
      totalUsed += used;
      totalAllowed += allowed;
    });

    const utilisationRate = totalAllowed > 0 ? Math.round((totalUsed / totalAllowed) * 100) : 0;

    return {
      totalUsed,
      totalAllowed,
      utilisationRate,
    };
  } catch (error) {
    console.error('Error getting utilisation stats:', error);
    return { totalUsed: 0, totalAllowed: 0, utilisationRate: 0 };
  }
}

export async function getSLAStats() {
  try {
    // Get completed drops from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `AND({Status} = 'Collected', IS_AFTER({Drop Date}, '${thirtyDaysAgo.toISOString().split('T')[0]}'))`,
      },
    });

    const drops = data.records || [];
    let totalHours = 0;
    let onTimeCount = 0;

    drops.forEach(drop => {
      const dropDate = new Date(drop.fields['Drop Date']);
      const readyDate = drop.fields['Ready Date'] ? new Date(drop.fields['Ready Date']) : null;
      
      if (readyDate) {
        const hours = (readyDate - dropDate) / (1000 * 60 * 60);
        totalHours += hours;
        if (hours <= 48) onTimeCount++;
      }
    });

    const avgTurnaroundHours = drops.length > 0 ? Math.round(totalHours / drops.length) : 0;
    const onTimeRate = drops.length > 0 ? Math.round((onTimeCount / drops.length) * 100) : 100;

    return {
      avgTurnaroundHours,
      onTimeRate,
      totalCompleted: drops.length,
    };
  } catch (error) {
    console.error('Error getting SLA stats:', error);
    return { avgTurnaroundHours: 0, onTimeRate: 100, totalCompleted: 0 };
  }
}

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
    // Get drops from last 30 days
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

// ============================================================================
// VERIFICATION/AUTH FUNCTIONS
// ============================================================================

export async function setVerificationCode(memberId, code, expiresAt) {
  return updateMember(memberId, {
    'Verification Code': code,
    'Verification Expires': expiresAt.toISOString(),
    'Verification Attempts': 0,
  });
}

export async function verifyCode(memberId, code) {
  const member = await getMemberById(memberId);
  
  if (!member) return { success: false, error: 'Member not found' };
  
  const storedCode = member.fields['Verification Code'];
  const expires = member.fields['Verification Expires'];
  const attempts = member.fields['Verification Attempts'] || 0;

  // Check attempts
  if (attempts >= 3) {
    return { success: false, error: 'Too many attempts. Please request a new code.' };
  }

  // Check expiry
  if (new Date(expires) < new Date()) {
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

  return { success: true };
}

// Export utility function
export { normalizePhone };
