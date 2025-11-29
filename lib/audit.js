// lib/audit.js
// Audit trail logging for all system actions

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

/**
 * Log an action to the audit trail
 * @param {Object} params
 * @param {string} params.entityType - 'Drop', 'Member', 'Subscription', 'Bag', 'Issue'
 * @param {string} params.entityId - Airtable record ID
 * @param {string} params.action - What happened
 * @param {string} params.oldValue - Previous state (optional)
 * @param {string} params.newValue - New state (optional)
 * @param {string} params.operator - Who did it
 * @param {string} params.source - 'Ops Dashboard', 'WhatsApp', 'System', 'Stripe', 'Customer'
 * @param {Object} params.metadata - Additional context (optional)
 */
export async function logAudit({
  entityType,
  entityId,
  action,
  oldValue = null,
  newValue = null,
  operator = 'System',
  source = 'System',
  metadata = null,
}) {
  try {
    const fields = {
      'Timestamp': new Date().toISOString(),
      'Entity Type': entityType,
      'Entity ID': entityId,
      'Action': action,
      'Operator': operator,
      'Source': source,
    }

    if (oldValue) fields['Old Value'] = String(oldValue)
    if (newValue) fields['New Value'] = String(newValue)
    if (metadata) fields['Metadata'] = JSON.stringify(metadata)

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Audit%20Log`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    )

    if (!response.ok) {
      console.error('Audit log failed:', await response.text())
    }

    return response.ok
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Audit log error:', error)
    return false
  }
}

/**
 * Log a drop status change
 */
export async function logDropStatusChange(dropId, oldStatus, newStatus, operator, source = 'Ops Dashboard', metadata = null) {
  return logAudit({
    entityType: 'Drop',
    entityId: dropId,
    action: 'Status Changed',
    oldValue: oldStatus,
    newValue: newStatus,
    operator,
    source,
    metadata,
  })
}

/**
 * Log a member action
 */
export async function logMemberAction(memberId, action, operator, source = 'System', metadata = null) {
  return logAudit({
    entityType: 'Member',
    entityId: memberId,
    action,
    operator,
    source,
    metadata,
  })
}

/**
 * Log a subscription change
 */
export async function logSubscriptionChange(memberId, action, oldValue, newValue, source = 'Stripe') {
  return logAudit({
    entityType: 'Subscription',
    entityId: memberId,
    action,
    oldValue,
    newValue,
    operator: 'System',
    source,
  })
}

/**
 * Log a bag action
 */
export async function logBagAction(bagId, action, operator, source = 'Ops Dashboard', metadata = null) {
  return logAudit({
    entityType: 'Bag',
    entityId: bagId,
    action,
    operator,
    source,
    metadata,
  })
}

/**
 * Log an issue
 */
export async function logIssue(issueId, action, operator, source = 'System', metadata = null) {
  return logAudit({
    entityType: 'Issue',
    entityId: issueId,
    action,
    operator,
    source,
    metadata,
  })
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(entityType, entityId, limit = 50) {
  try {
    const formula = `AND({Entity Type} = '${entityType}', {Entity ID} = '${entityId}')`
    const params = new URLSearchParams({
      filterByFormula: formula,
      sort: JSON.stringify([{ field: 'Timestamp', direction: 'desc' }]),
      maxRecords: String(limit),
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Audit%20Log?${params}`,
      {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.records?.map(r => ({
      id: r.id,
      timestamp: r.fields['Timestamp'],
      action: r.fields['Action'],
      oldValue: r.fields['Old Value'],
      newValue: r.fields['New Value'],
      operator: r.fields['Operator'],
      source: r.fields['Source'],
      metadata: r.fields['Metadata'] ? JSON.parse(r.fields['Metadata']) : null,
    })) || []
  } catch (error) {
    console.error('Get audit logs error:', error)
    return []
  }
}

/**
 * Get recent audit logs (for dashboard)
 */
export async function getRecentAuditLogs(limit = 100) {
  try {
    const params = new URLSearchParams({
      sort: JSON.stringify([{ field: 'Timestamp', direction: 'desc' }]),
      maxRecords: String(limit),
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Audit%20Log?${params}`,
      {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.records?.map(r => ({
      id: r.id,
      timestamp: r.fields['Timestamp'],
      entityType: r.fields['Entity Type'],
      entityId: r.fields['Entity ID'],
      action: r.fields['Action'],
      oldValue: r.fields['Old Value'],
      newValue: r.fields['New Value'],
      operator: r.fields['Operator'],
      source: r.fields['Source'],
    })) || []
  } catch (error) {
    console.error('Get recent audit logs error:', error)
    return []
  }
}
