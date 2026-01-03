// lib/sla.js
// ============================================================================
// SLA TRACKING & MONITORING
// Tracks service level compliance for drops, tickets, and responses
// ============================================================================

import { TABLES, DROP_STATUSES, OPERATIONS } from './constants.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appkU13tG14ZLVZZ9';

// ============================================================================
// SLA DEFINITIONS
// ============================================================================

export const SLA_TARGETS = {
  // Drop turnaround: 48 hours from drop to ready
  DROP_TURNAROUND_HOURS: OPERATIONS.turnaroundHours,
  
  // Pickup window: 7 days from ready to must collect
  PICKUP_WINDOW_DAYS: OPERATIONS.pickupDeadlineDays,
  
  // Support response: 24 hours for first response
  TICKET_RESPONSE_HOURS: 24,
  
  // Support resolution: 72 hours for resolution
  TICKET_RESOLUTION_HOURS: 72,
  
  // Collection from gym: same day if before cutoff
  COLLECTION_CUTOFF: OPERATIONS.collectionTime,
};

// ============================================================================
// DROP SLA TRACKING
// ============================================================================

/**
 * Get all drops currently at risk of breaching SLA
 */
export async function getDropsAtRisk() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.DROPS)}?` +
      new URLSearchParams({
        filterByFormula: `NOT(OR({Status} = 'Collected', {Status} = 'Cancelled'))`,
        sort: JSON.stringify([{ field: 'Drop Date', direction: 'asc' }]),
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    const now = new Date();
    const atRisk = [];

    data.records.forEach(record => {
      const dropDate = new Date(record.fields['Drop Date']);
      const status = record.fields.Status;
      const hoursSinceDrop = (now - dropDate) / (1000 * 60 * 60);

      // Calculate SLA breach risk
      let riskLevel = 'ok';
      let hoursRemaining = SLA_TARGETS.DROP_TURNAROUND_HOURS - hoursSinceDrop;

      if (status !== DROP_STATUSES.READY && status !== DROP_STATUSES.COLLECTED) {
        if (hoursSinceDrop > SLA_TARGETS.DROP_TURNAROUND_HOURS) {
          riskLevel = 'breached';
          hoursRemaining = 0;
        } else if (hoursSinceDrop > SLA_TARGETS.DROP_TURNAROUND_HOURS - 6) {
          riskLevel = 'critical'; // Within 6 hours
        } else if (hoursSinceDrop > SLA_TARGETS.DROP_TURNAROUND_HOURS - 12) {
          riskLevel = 'warning'; // Within 12 hours
        }
      }

      // Check ready drops past pickup window
      if (status === DROP_STATUSES.READY) {
        const readyDate = record.fields['Ready Date'] ? new Date(record.fields['Ready Date']) : dropDate;
        const daysSinceReady = (now - readyDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceReady > SLA_TARGETS.PICKUP_WINDOW_DAYS) {
          riskLevel = 'overdue_pickup';
          hoursRemaining = 0;
        } else if (daysSinceReady > SLA_TARGETS.PICKUP_WINDOW_DAYS - 2) {
          riskLevel = 'pickup_reminder';
        }
      }

      if (riskLevel !== 'ok') {
        atRisk.push({
          id: record.id,
          bagNumber: record.fields['Bag Number'],
          status: record.fields.Status,
          dropDate: record.fields['Drop Date'],
          riskLevel,
          hoursRemaining: Math.max(0, hoursRemaining),
          memberId: record.fields.Member?.[0],
        });
      }
    });

    return atRisk.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
  } catch (error) {
    console.error('Error getting drops at risk:', error);
    return [];
  }
}

/**
 * Calculate SLA compliance stats for a period
 */
export async function getDropSlaStats(startDate, endDate) {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.DROPS)}?` +
      new URLSearchParams({
        filterByFormula: `AND(
          IS_AFTER({Drop Date}, '${startDate}'),
          IS_BEFORE({Drop Date}, '${endDate}'),
          {Status} = 'Collected'
        )`,
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    let total = 0;
    let withinSla = 0;
    let breached = 0;
    let totalTurnaroundHours = 0;

    data.records.forEach(record => {
      const dropDate = new Date(record.fields['Drop Date']);
      const readyDate = record.fields['Ready Date'] ? new Date(record.fields['Ready Date']) : null;
      
      if (readyDate) {
        const turnaroundHours = (readyDate - dropDate) / (1000 * 60 * 60);
        totalTurnaroundHours += turnaroundHours;
        total++;

        if (turnaroundHours <= SLA_TARGETS.DROP_TURNAROUND_HOURS) {
          withinSla++;
        } else {
          breached++;
        }
      }
    });

    return {
      total,
      withinSla,
      breached,
      complianceRate: total > 0 ? (withinSla / total * 100).toFixed(1) : 100,
      avgTurnaroundHours: total > 0 ? (totalTurnaroundHours / total).toFixed(1) : 0,
    };
  } catch (error) {
    console.error('Error getting drop SLA stats:', error);
    return { total: 0, withinSla: 0, breached: 0, complianceRate: '100', avgTurnaroundHours: '0' };
  }
}

// ============================================================================
// TICKET SLA TRACKING
// ============================================================================

/**
 * Get tickets needing attention
 */
export async function getTicketsNeedingAttention() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.ISSUES)}?` +
      new URLSearchParams({
        filterByFormula: `NOT(OR({Status} = 'Resolved', {Status} = 'Closed'))`,
        sort: JSON.stringify([{ field: 'Created Date', direction: 'asc' }]),
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    const now = new Date();
    const needsAttention = [];

    data.records.forEach(record => {
      const createdDate = new Date(record.fields['Created Date']);
      const status = record.fields.Status;
      const hoursSinceCreated = (now - createdDate) / (1000 * 60 * 60);

      let urgency = 'normal';
      
      if (hoursSinceCreated > SLA_TARGETS.TICKET_RESOLUTION_HOURS) {
        urgency = 'overdue';
      } else if (hoursSinceCreated > SLA_TARGETS.TICKET_RESPONSE_HOURS && status === 'Open') {
        urgency = 'needs_response';
      } else if (hoursSinceCreated > SLA_TARGETS.TICKET_RESOLUTION_HOURS - 24) {
        urgency = 'approaching_deadline';
      }

      needsAttention.push({
        id: record.id,
        type: record.fields.Type,
        status: record.fields.Status,
        createdDate: record.fields['Created Date'],
        urgency,
        hoursOpen: Math.round(hoursSinceCreated),
        memberId: record.fields.Member?.[0],
      });
    });

    // Sort by urgency then age
    const urgencyOrder = { overdue: 0, needs_response: 1, approaching_deadline: 2, normal: 3 };
    return needsAttention.sort((a, b) => 
      (urgencyOrder[a.urgency] - urgencyOrder[b.urgency]) || (b.hoursOpen - a.hoursOpen)
    );
  } catch (error) {
    console.error('Error getting tickets needing attention:', error);
    return [];
  }
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Get overall operational health metrics
 */
export async function getOpsHealthMetrics() {
  const [dropsAtRisk, ticketsNeedingAttention] = await Promise.all([
    getDropsAtRisk(),
    getTicketsNeedingAttention(),
  ]);

  const criticalDrops = dropsAtRisk.filter(d => d.riskLevel === 'breached' || d.riskLevel === 'critical');
  const overdueTickets = ticketsNeedingAttention.filter(t => t.urgency === 'overdue' || t.urgency === 'needs_response');

  // Calculate health score (0-100)
  let healthScore = 100;
  
  // Deduct for critical drops
  healthScore -= criticalDrops.length * 10;
  
  // Deduct for overdue tickets
  healthScore -= overdueTickets.length * 5;

  return {
    healthScore: Math.max(0, healthScore),
    dropsAtRisk: dropsAtRisk.length,
    criticalDrops: criticalDrops.length,
    openTickets: ticketsNeedingAttention.length,
    overdueTickets: overdueTickets.length,
    status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical',
  };
}

/**
 * Get today's operational summary
 */
export async function getTodaySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // Get today's drops
    const dropsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.DROPS)}?` +
      new URLSearchParams({
        filterByFormula: `IS_AFTER({Drop Date}, '${today.toISOString().split('T')[0]}')`,
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const dropsData = await dropsResponse.json();
    const todayDrops = dropsData.records.filter(r => {
      const dropDate = new Date(r.fields['Drop Date']);
      return dropDate >= today && dropDate < tomorrow;
    });

    // Count by status
    const statusCounts = {};
    todayDrops.forEach(record => {
      const status = record.fields.Status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      date: today.toISOString().split('T')[0],
      totalDrops: todayDrops.length,
      byStatus: statusCounts,
      needsCollection: todayDrops.filter(r => r.fields.Status === DROP_STATUSES.DROPPED).length,
      atLaundry: todayDrops.filter(r => r.fields.Status === DROP_STATUSES.AT_LAUNDRY).length,
      readyForPickup: todayDrops.filter(r => r.fields.Status === DROP_STATUSES.READY).length,
    };
  } catch (error) {
    console.error('Error getting today summary:', error);
    return {
      date: today.toISOString().split('T')[0],
      totalDrops: 0,
      byStatus: {},
      needsCollection: 0,
      atLaundry: 0,
      readyForPickup: 0,
    };
  }
}

export default {
  SLA_TARGETS,
  getDropsAtRisk,
  getDropSlaStats,
  getTicketsNeedingAttention,
  getOpsHealthMetrics,
  getTodaySummary,
};
