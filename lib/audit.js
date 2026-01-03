// lib/audit.js
// ============================================================================
// AUDIT LOGGING
// Tracks all significant system actions for compliance and debugging
// ============================================================================

import { TABLES } from './constants.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appkU13tG14ZLVZZ9';

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export const AUDIT_ACTIONS = {
  // Member actions
  MEMBER_CREATED: 'member_created',
  MEMBER_UPDATED: 'member_updated',
  MEMBER_LOGIN: 'member_login',
  
  // Subscription actions
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_PAUSED: 'subscription_paused',
  SUBSCRIPTION_RESUMED: 'subscription_resumed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_CHANGED: 'subscription_changed',
  
  // Drop actions
  DROP_CREATED: 'drop_created',
  DROP_STATUS_CHANGED: 'drop_status_changed',
  DROP_COLLECTED: 'drop_collected',
  
  // Support actions
  TICKET_CREATED: 'ticket_created',
  TICKET_RESOLVED: 'ticket_resolved',
  
  // Payment actions
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_ISSUED: 'refund_issued',
  
  // System actions
  NOTIFICATION_SENT: 'notification_sent',
  ERROR_OCCURRED: 'error_occurred',
  
  // Ops actions
  OPS_LOGIN: 'ops_login',
  OPS_ACTION: 'ops_action',
};

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log an audit event
 */
export async function logAuditEvent({
  action,
  actor,
  actorType = 'system',
  targetType,
  targetId,
  details = {},
  metadata = {},
}) {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.AUDIT_LOG)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{
            fields: {
              'Action': action,
              'Actor': actor || 'system',
              'Actor Type': actorType, // 'system', 'member', 'ops', 'stripe'
              'Target Type': targetType, // 'member', 'drop', 'subscription', etc.
              'Target ID': targetId,
              'Details': JSON.stringify(details),
              'Metadata': JSON.stringify(metadata),
              'Timestamp': new Date().toISOString(),
              'IP Address': metadata.ip || '',
              'User Agent': metadata.userAgent || '',
            },
          }],
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to log audit event:', await response.text());
    }

    return response.ok;
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Audit logging error:', error);
    return false;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export async function logMemberCreated(memberId, memberData, metadata = {}) {
  return logAuditEvent({
    action: AUDIT_ACTIONS.MEMBER_CREATED,
    actor: 'stripe_webhook',
    actorType: 'system',
    targetType: 'member',
    targetId: memberId,
    details: {
      email: memberData.email,
      plan: memberData.plan,
      gym: memberData.gymName,
    },
    metadata,
  });
}

export async function logSubscriptionChange(memberId, changeType, details, metadata = {}) {
  const actionMap = {
    'paused': AUDIT_ACTIONS.SUBSCRIPTION_PAUSED,
    'resumed': AUDIT_ACTIONS.SUBSCRIPTION_RESUMED,
    'cancelled': AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED,
    'changed': AUDIT_ACTIONS.SUBSCRIPTION_CHANGED,
  };

  return logAuditEvent({
    action: actionMap[changeType] || AUDIT_ACTIONS.SUBSCRIPTION_CHANGED,
    actor: details.actor || 'member',
    actorType: details.actorType || 'member',
    targetType: 'subscription',
    targetId: memberId,
    details,
    metadata,
  });
}

export async function logDropStatusChange(dropId, memberId, oldStatus, newStatus, metadata = {}) {
  return logAuditEvent({
    action: AUDIT_ACTIONS.DROP_STATUS_CHANGED,
    actor: metadata.actor || 'system',
    actorType: metadata.actorType || 'system',
    targetType: 'drop',
    targetId: dropId,
    details: {
      memberId,
      oldStatus,
      newStatus,
    },
    metadata,
  });
}

export async function logTicketCreated(ticketId, memberId, ticketType, metadata = {}) {
  return logAuditEvent({
    action: AUDIT_ACTIONS.TICKET_CREATED,
    actor: memberId,
    actorType: 'member',
    targetType: 'ticket',
    targetId: ticketId,
    details: {
      type: ticketType,
    },
    metadata,
  });
}

export async function logPaymentEvent(memberId, eventType, amount, metadata = {}) {
  const action = eventType === 'succeeded' 
    ? AUDIT_ACTIONS.PAYMENT_SUCCEEDED 
    : AUDIT_ACTIONS.PAYMENT_FAILED;

  return logAuditEvent({
    action,
    actor: 'stripe',
    actorType: 'stripe',
    targetType: 'payment',
    targetId: memberId,
    details: {
      amount,
      currency: 'gbp',
    },
    metadata,
  });
}

export async function logOpsAction(opsUser, action, targetType, targetId, details = {}, metadata = {}) {
  return logAuditEvent({
    action: AUDIT_ACTIONS.OPS_ACTION,
    actor: opsUser,
    actorType: 'ops',
    targetType,
    targetId,
    details: {
      action,
      ...details,
    },
    metadata,
  });
}

export async function logError(context, error, metadata = {}) {
  return logAuditEvent({
    action: AUDIT_ACTIONS.ERROR_OCCURRED,
    actor: 'system',
    actorType: 'system',
    targetType: 'error',
    targetId: context,
    details: {
      message: error.message,
      stack: error.stack?.substring(0, 500),
    },
    metadata,
  });
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export async function getAuditLogs(filters = {}, limit = 50) {
  try {
    const params = new URLSearchParams({
      maxRecords: limit.toString(),
      sort: JSON.stringify([{ field: 'Timestamp', direction: 'desc' }]),
    });

    // Build filter formula
    const filterClauses = [];
    
    if (filters.action) {
      filterClauses.push(`{Action} = '${filters.action}'`);
    }
    if (filters.targetId) {
      filterClauses.push(`{Target ID} = '${filters.targetId}'`);
    }
    if (filters.targetType) {
      filterClauses.push(`{Target Type} = '${filters.targetType}'`);
    }
    if (filters.actor) {
      filterClauses.push(`{Actor} = '${filters.actor}'`);
    }

    if (filterClauses.length > 0) {
      params.set('filterByFormula', `AND(${filterClauses.join(', ')})`);
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.AUDIT_LOG)}?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    
    return data.records.map(record => ({
      id: record.id,
      ...record.fields,
      Details: record.fields.Details ? JSON.parse(record.fields.Details) : {},
      Metadata: record.fields.Metadata ? JSON.parse(record.fields.Metadata) : {},
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

export default {
  AUDIT_ACTIONS,
  logAuditEvent,
  logMemberCreated,
  logSubscriptionChange,
  logDropStatusChange,
  logTicketCreated,
  logPaymentEvent,
  logOpsAction,
  logError,
  getAuditLogs,
};
