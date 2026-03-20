// lib/airtable.js
// ============================================================================
// CORRECTED TO MATCH ACTUAL AIRTABLE SCHEMA (verified via MCP)
//
// Key corrections:
// - Members: 'Phone' ✅, 'Subscription Status' (not 'Status'), 'Drops Allowed'
//   (not 'Drops Remaining'), 'Drops Used' (not 'Total Drops')
// - Gyms: 'Slug' (not 'Code'), 'Is Active' checkbox (not Status='Active')
// - Drops: 'Available Until' (not 'Expected Ready'), 'Pickup Date' (not 'Collected Date')
//   'Bags' link field (not 'Bag'), no Expected Ready field
// - Issues: 'Created At' (not 'Created'), 'Photo URL' single url (not Photos array)
// ============================================================================

import {
  TABLES,
  DROP_STATUSES,
  MEMBER_STATUSES,
  BAG_STATUSES,
  CONVERSATION_STATES
} from './constants.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY) throw new Error('Missing env: AIRTABLE_API_KEY');
if (!AIRTABLE_BASE_ID) throw new Error('Missing env: AIRTABLE_BASE_ID');

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

export { TABLES };

function escapeFormulaValue(value) {
  if (value == null) return '';
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[^\d+]/g, '');
  // Handle common UK format: 07xxx → +447xxx
  if (cleaned.startsWith('07') && cleaned.length === 11) cleaned = '+44' + cleaned.slice(1);
  // Handle bare 0 prefix only if it looks like a UK number (starts with 07)
  else if (cleaned.startsWith('0')) cleaned = '+44' + cleaned.slice(1);
  // Handle missing + prefix for numbers that start with country code
  else if (!cleaned.startsWith('+') && cleaned.length >= 10) cleaned = '+' + cleaned;
  // Ensure + prefix
  else if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
  return cleaned;
}

export function normalizeBagNumber(input) {
  if (!input) return null;
  const match = input.toString().match(/^B?0*(\d{1,3})$/i);
  if (!match) return null;
  return `B${match[1].padStart(3, '0')}`;
}

async function airtableFetch(endpoint, options = {}) {
  let paramStr = '';
  if (options.params) {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (key === 'sort' && Array.isArray(value)) {
        value.forEach((s, i) => {
          if (s.field) p.append(`sort[${i}][field]`, s.field);
          if (s.direction) p.append(`sort[${i}][direction]`, s.direction);
        });
      } else {
        p.append(key, value);
      }
    }
    paramStr = `?${p.toString()}`;
  }
  // Don't encode the whole endpoint — it contains slashes for record IDs (e.g. Members/recXXX)
  // Only encode each path segment individually
  const encodedEndpoint = endpoint.split('/').map(segment => encodeURIComponent(segment)).join('/');
  const url = `${BASE_URL}/${encodedEndpoint}${paramStr}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const error = await response.text();
    console.error(`Airtable [${endpoint}] ${response.status}:`, error);
    throw new Error(`Airtable ${response.status}: ${error}`);
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
        filterByFormula: `{Phone} = '${escapeFormulaValue(normalizedPhone)}'`,
        maxRecords: 1,
      },
    });
    if (data.records?.length > 0) return { id: data.records[0].id, fields: data.records[0].fields };
    return null;
  } catch (e) { console.error('getMemberByPhone:', e); return null; }
}

export async function getMemberById(memberId) {
  try {
    const data = await airtableFetch(`${TABLES.MEMBERS}/${memberId}`);
    return { id: data.id, fields: data.fields };
  } catch (e) { console.error('getMemberById:', e); return null; }
}

export async function getMemberByStripeCustomerId(stripeCustomerId) {
  try {
    const data = await airtableFetch(TABLES.MEMBERS, {
      params: {
        filterByFormula: `{Stripe Customer ID} = '${escapeFormulaValue(stripeCustomerId)}'`,
        maxRecords: 1,
      },
    });
    if (data.records?.length > 0) return { id: data.records[0].id, fields: data.records[0].fields };
    return null;
  } catch (e) { console.error('getMemberByStripeCustomerId:', e); return null; }
}

export async function getMemberByEmail(email) {
  if (!email) return null;
  try {
    const data = await airtableFetch(TABLES.MEMBERS, {
      params: {
        filterByFormula: `LOWER({Email}) = '${escapeFormulaValue(email.toLowerCase())}'`,
        maxRecords: 1,
      },
    });
    if (data.records?.length > 0) return { id: data.records[0].id, fields: data.records[0].fields };
    return null;
  } catch (e) { console.error('getMemberByEmail:', e); return null; }
}

export async function createMember(memberData) {
  try {
    const data = await airtableFetch(TABLES.MEMBERS, {
      method: 'POST',
      body: {
        records: [{
          fields: {
            'Phone': normalizePhone(memberData.phone),
            'Email': memberData.email || '',
            'First Name': memberData.firstName || '',
            'Last Name': memberData.lastName || '',
            'Gym': memberData.gymId ? [memberData.gymId] : [],
            'Subscription Tier': memberData.plan || '',
            'Subscription Status': memberData.status || MEMBER_STATUSES.ACTIVE,
            'Stripe Customer ID': memberData.stripeCustomerId || '',
            'Stripe Subscription ID': memberData.stripeSubscriptionId || '',
            'Conversation State': CONVERSATION_STATES.IDLE,
            'Drops Allowed': memberData.dropsAllowed || 0,
            'Drops Used': 0,
          },
        }],
      },
    });
    return { id: data.records[0].id, fields: data.records[0].fields };
  } catch (e) { console.error('createMember:', e); throw e; }
}

/**
 * updateMember - transparently maps code field names to actual Airtable field names.
 * Code may pass 'Status', 'Drops Remaining', 'Total Drops' - these are translated.
 */
export async function updateMember(memberId, updates) {
  const fieldMap = {
    'Status': 'Subscription Status',
    'Drops Remaining': 'Drops Allowed',
    'Total Drops': 'Drops Used',
  };
  const translated = {};
  for (const [k, v] of Object.entries(updates)) {
    translated[fieldMap[k] || k] = v;
  }
  try {
    const data = await airtableFetch(`${TABLES.MEMBERS}/${memberId}`, {
      method: 'PATCH',
      body: { fields: translated },
    });
    return { id: data.id, fields: data.fields };
  } catch (e) { console.error('updateMember:', e); throw e; }
}

// Helper: calculate drops remaining = Drops Allowed - Drops Used
export function getMemberDropsRemaining(fields) {
  const allowed = fields['Drops Allowed'] || 0;
  const used = fields['Drops Used'] || 0;
  return Math.max(0, allowed - used);
}
export function getMemberTotalDrops(fields) {
  return fields['Drops Allowed'] || 0;
}
export function getMemberDropsUsed(fields) {
  return fields['Drops Used'] || 0;
}
export function getMemberStatus(fields) {
  return fields['Subscription Status'] || 'Unknown';
}

// ============================================================================
// BAG FUNCTIONS
// ============================================================================

export async function getBagByNumber(bagNumber) {
  const normalized = normalizeBagNumber(bagNumber);
  if (!normalized) return null;
  try {
    const data = await airtableFetch(TABLES.BAGS, {
      params: {
        filterByFormula: `{Bag Number} = '${escapeFormulaValue(normalized)}'`,
        maxRecords: 1,
      },
    });
    if (data.records?.length > 0) return { id: data.records[0].id, fields: data.records[0].fields };
    return null;
  } catch (e) { console.error('getBagByNumber:', e); return null; }
}

export async function validateBag(bagNumber) {
  const normalized = normalizeBagNumber(bagNumber);
  if (!normalized) return { valid: false, error: 'INVALID_FORMAT', message: 'Bag number should look like B042 or 042' };
  const bag = await getBagByNumber(normalized);
  if (!bag) return { valid: false, error: 'NOT_FOUND', message: `Bag ${normalized} doesn't exist in our system` };
  if (bag.fields['Status'] !== BAG_STATUSES.AVAILABLE) return { valid: false, error: 'NOT_AVAILABLE', message: `Bag ${normalized} is already in use` };
  return { valid: true, bag, bagNumber: normalized };
}

export async function markBagInUse(bagId, dropId) {
  try {
    const data = await airtableFetch(`${TABLES.BAGS}/${bagId}`, {
      method: 'PATCH',
      body: { fields: { 'Status': BAG_STATUSES.IN_USE, 'Current Drop': [dropId] } },
    });
    return { id: data.id, fields: data.fields };
  } catch (e) { console.error('markBagInUse:', e); throw e; }
}

export async function markBagAvailable(bagId) {
  try {
    const data = await airtableFetch(`${TABLES.BAGS}/${bagId}`, {
      method: 'PATCH',
      body: { fields: { 'Status': BAG_STATUSES.AVAILABLE, 'Current Drop': [] } },
    });
    return { id: data.id, fields: data.fields };
  } catch (e) { console.error('markBagAvailable:', e); throw e; }
}

// ============================================================================
// DROP FUNCTIONS
// ============================================================================

export async function createDrop({ memberId, bagId, bagNumber, gymId }) {
  try {
    const expectedReady = new Date();
    expectedReady.setHours(expectedReady.getHours() + 48);
    const data = await airtableFetch(TABLES.DROPS, {
      method: 'POST',
      body: {
        records: [{
          fields: {
            'Member': [memberId],
            'Bag Number': bagNumber,
            'Bags': bagId ? [bagId] : [],
            'Status': DROP_STATUSES.DROPPED,
            'Drop Date': new Date().toISOString(),
            'Available Until': expectedReady.toISOString(),
            'Gym': gymId ? [gymId] : [],
          },
        }],
      },
    });
    const drop = { id: data.records[0].id, fields: data.records[0].fields };
    if (bagId) await markBagInUse(bagId, drop.id).catch(e => console.error('markBagInUse non-fatal:', e));
    return drop;
  } catch (e) { console.error('createDrop:', e); throw e; }
}

export async function getActiveDropsByMember(memberOrId) {
  try {
    // ARRAYJOIN({Member}) returns the primary field value (First Name), NOT the record ID.
    // Instead, we use the member's Drops linked field (array of drop record IDs) and filter
    // using RECORD_ID() to match exactly — fully reliable.
    let dropIds;
    if (typeof memberOrId === 'object' && memberOrId !== null) {
      dropIds = memberOrId.fields?.['Drops'] || [];
    } else {
      // Fallback: fetch the member record to get their Drops field
      const member = await getMemberById(memberOrId);
      dropIds = member?.fields?.['Drops'] || [];
    }

    if (dropIds.length === 0) return [];

    const idConditions = dropIds.map(id => `RECORD_ID()='${escapeFormulaValue(id)}'`).join(',');
    const formula = `AND(OR(${idConditions}),NOT({Status}='${DROP_STATUSES.COLLECTED}'))`;

    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: formula,
        sort: [{ field: 'Drop Date', direction: 'desc' }],
      },
    });
    return data.records.map(r => ({ id: r.id, fields: r.fields }));
  } catch (e) { console.error('getActiveDropsByMember:', e); return []; }
}

export async function getAllDropsByMember(memberOrId, limit = 20) {
  try {
    // Same fix as getActiveDropsByMember — use RECORD_ID() via the member's Drops field
    let dropIds;
    if (typeof memberOrId === 'object' && memberOrId !== null) {
      dropIds = memberOrId.fields?.['Drops'] || [];
    } else {
      const member = await getMemberById(memberOrId);
      dropIds = member?.fields?.['Drops'] || [];
    }

    if (dropIds.length === 0) return [];

    // Apply limit client-side to avoid overly long formulas
    const slicedIds = dropIds.slice(0, limit);
    const idConditions = slicedIds.map(id => `RECORD_ID()='${escapeFormulaValue(id)}'`).join(',');

    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `OR(${idConditions})`,
        sort: [{ field: 'Drop Date', direction: 'desc' }],
        maxRecords: limit,
      },
    });
    return data.records.map(r => ({ id: r.id, fields: r.fields }));
  } catch (e) { console.error('getAllDropsByMember:', e); return []; }
}

export async function getDropById(dropId) {
  try {
    const data = await airtableFetch(`${TABLES.DROPS}/${dropId}`);
    return { id: data.id, fields: data.fields };
  } catch (e) { console.error('getDropById:', e); return null; }
}

export async function updateDropStatus(dropId, status) {
  try {
    const updates = { 'Status': status };
    if (status === DROP_STATUSES.READY) updates['Ready Date'] = new Date().toISOString();
    if (status === DROP_STATUSES.COLLECTED) {
      updates['Pickup Date'] = new Date().toISOString();
      const drop = await getDropById(dropId);
      const bagId = drop?.fields?.['Bags']?.[0];
      if (bagId) await markBagAvailable(bagId).catch(e => console.error('markBagAvailable non-fatal:', e));
    }
    const data = await airtableFetch(`${TABLES.DROPS}/${dropId}`, {
      method: 'PATCH',
      body: { fields: updates },
    });
    return { id: data.id, fields: data.fields };
  } catch (e) { console.error('updateDropStatus:', e); throw e; }
}

// ============================================================================
// GYM FUNCTIONS
// ============================================================================

export async function getGymByCode(gymCode) {
  if (!gymCode) return null;
  try {
    const data = await airtableFetch(TABLES.GYMS, {
      params: {
        filterByFormula: `LOWER({Slug}) = '${escapeFormulaValue(gymCode.toLowerCase())}'`,
        maxRecords: 1,
      },
    });
    if (data.records?.length > 0) return { id: data.records[0].id, fields: data.records[0].fields };
    return null;
  } catch (e) { console.error('getGymByCode:', e); return null; }
}

export async function getGymById(gymId) {
  try {
    const data = await airtableFetch(`${TABLES.GYMS}/${gymId}`);
    return { id: data.id, fields: data.fields };
  } catch (e) { console.error('getGymById:', e); return null; }
}

export async function getAllGyms() {
  try {
    const data = await airtableFetch(TABLES.GYMS, {
      params: {
        filterByFormula: `{Is Active}`,
        sort: [{ field: 'Name', direction: 'asc' }],
      },
    });
    return data.records.map(r => ({ id: r.id, fields: r.fields }));
  } catch (e) { console.error('getAllGyms:', e); return []; }
}

// ============================================================================
// ISSUE FUNCTIONS
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
            'Created At': new Date().toISOString(),
            ...(dropId && { 'Drops': [dropId] }),
            ...(photoUrls.length > 0 && { 'Photo URL': photoUrls[0] }),
          },
        }],
      },
    });
    return { id: data.records[0].id, fields: data.records[0].fields };
  } catch (e) { console.error('createIssue:', e); throw e; }
}

export async function updateIssue(issueId, updates) {
  try {
    const data = await airtableFetch(`${TABLES.ISSUES}/${issueId}`, {
      method: 'PATCH', body: { fields: updates },
    });
    return { id: data.id, fields: data.fields };
  } catch (e) { console.error('updateIssue:', e); throw e; }
}

// ============================================================================
// VERIFICATION
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
  if (!member) return { success: false, error: 'Member not found' };
  const storedCode = member.fields['Verification Code'];
  const expires = member.fields['Verification Expires'];
  const attempts = member.fields['Verification Attempts'] || 0;
  if (attempts >= 3) return { success: false, error: 'Too many attempts. Please request a new code.' };
  if (!expires || new Date(expires) < new Date()) return { success: false, error: 'Code expired. Please request a new code.' };
  if (storedCode !== code) {
    await updateMember(memberId, { 'Verification Attempts': attempts + 1 });
    return { success: false, error: 'Invalid code' };
  }
  await updateMember(memberId, { 'Verification Code': '', 'Verification Expires': '', 'Verification Attempts': 0 });
  return { success: true, member };
}

export async function clearVerificationCode(memberId) {
  return updateMember(memberId, { 'Verification Code': '', 'Verification Expires': '', 'Verification Attempts': 0 });
}

export const verifyCode = checkVerificationCode;

export async function getMemberStats() {
  try {
    const data = await airtableFetch(TABLES.MEMBERS);
    const stats = { total: data.records.length, active: 0, paused: 0, cancelled: 0 };
    data.records.forEach(r => {
      const s = r.fields['Subscription Status'];
      if (s === MEMBER_STATUSES.ACTIVE) stats.active++;
      else if (s === MEMBER_STATUSES.PAUSED) stats.paused++;
      else if (s === MEMBER_STATUSES.CANCELLED) stats.cancelled++;
    });
    return stats;
  } catch (e) { console.error('getMemberStats:', e); return { total: 0, active: 0, paused: 0, cancelled: 0 }; }
}
