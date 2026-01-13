// lib/audit.js
// ============================================================================
// AUDIT LOGGING (Stub for MVP)
// Logs subscription and drop changes - can be expanded later
// ============================================================================

/**
 * Log subscription changes for audit trail
 * For MVP, just console.log - can add Airtable logging later
 */
export async function logSubscriptionChange(memberId, action, details = {}) {
  console.log(`[Audit] Member ${memberId}: ${action}`, details);
  return { success: true };
}

/**
 * Log drop status changes for audit trail
 */
export async function logDropStatusChange(dropId, oldStatus, newStatus, details = {}) {
  console.log(`[Audit] Drop ${dropId}: ${oldStatus} → ${newStatus}`, details);
  return { success: true };
}

export default {
  logSubscriptionChange,
  logDropStatusChange,
};
