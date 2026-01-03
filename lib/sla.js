// lib/sla.js
// ============================================================================
// SLA TRACKING AND OPS HEALTH METRICS
// Functions for ops dashboard health monitoring and SLA compliance
// ============================================================================

import { TABLES, DROP_STATUSES } from './constants.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appkU13tG14ZLVZZ9';

async function airtableFetch(endpoint, options = {}) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(endpoint)}`;
  
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
    throw new Error(`Airtable API error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// OPS HEALTH METRICS
// ============================================================================

/**
 * Get overall operations health metrics
 * Returns a health score and status
 */
export async function getOpsHealthMetrics() {
  try {
    const [slaStats, dropStats, issueStats] = await Promise.all([
      getSLACompliance(),
      getDropStatusCounts(),
      getOpenIssueCount(),
    ]);

    // Calculate health score (0-100)
    let score = 100;
    
    // Deduct for overdue drops
    const overdueDrops = dropStats.overdue || 0;
    score -= overdueDrops * 5; // -5 points per overdue drop
    
    // Deduct for SLA violations
    const slaViolationRate = 100 - (slaStats.onTimeRate || 100);
    score -= slaViolationRate * 0.5; // Proportional to violation rate
    
    // Deduct for open issues
    const openIssues = issueStats.open || 0;
    score -= openIssues * 2; // -2 points per open issue

    score = Math.max(0, Math.min(100, Math.round(score)));

    let status = 'healthy';
    if (score < 70) status = 'critical';
    else if (score < 85) status = 'warning';

    return {
      score,
      status,
      details: {
        overdueDrops,
        slaOnTimeRate: slaStats.onTimeRate,
        openIssues,
      },
    };
  } catch (error) {
    console.error('Error getting ops health metrics:', error);
    return { score: 0, status: 'unknown', details: {} };
  }
}

// ============================================================================
// DROP STATUS TRACKING
// ============================================================================

/**
 * Get today's drop summary by status
 */
export async function getTodaySummary() {
  try {
    // Get all active drops (not collected/cancelled)
    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `NOT(OR({Status} = 'Collected', {Status} = 'Cancelled'))`,
      },
    });

    const summary = {
      dropped: 0,
      inTransit: 0,
      atLaundry: 0,
      ready: 0,
      collected: 0,
    };

    (data.records || []).forEach(record => {
      const status = record.fields.Status;
      switch (status) {
        case 'Dropped':
          summary.dropped++;
          break;
        case 'In Transit':
          summary.inTransit++;
          break;
        case 'At Laundry':
          summary.atLaundry++;
          break;
        case 'Ready':
          summary.ready++;
          break;
        case 'Collected':
          summary.collected++;
          break;
      }
    });

    return summary;
  } catch (error) {
    console.error('Error getting today summary:', error);
    return { dropped: 0, inTransit: 0, atLaundry: 0, ready: 0, collected: 0 };
  }
}

/**
 * Get drops that are at risk of missing SLA (48-hour turnaround)
 */
export async function getDropsAtRisk() {
  try {
    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `NOT(OR({Status} = 'Collected', {Status} = 'Cancelled', {Status} = 'Ready'))`,
        sort: [{ field: 'Drop Date', direction: 'asc' }],
      },
    });

    const now = new Date();
    const atRisk = [];

    (data.records || []).forEach(record => {
      const dropDate = new Date(record.fields['Drop Date']);
      const hoursElapsed = (now - dropDate) / (1000 * 60 * 60);
      
      let riskLevel = 'ok';
      if (hoursElapsed > 48) {
        riskLevel = 'critical'; // Already overdue
      } else if (hoursElapsed > 36) {
        riskLevel = 'warning'; // Less than 12 hours remaining
      } else if (hoursElapsed > 24) {
        riskLevel = 'attention'; // Less than 24 hours remaining
      }

      atRisk.push({
        id: record.id,
        bagNumber: record.fields['Bag Number'],
        status: record.fields.Status,
        dropDate: record.fields['Drop Date'],
        hoursElapsed: Math.round(hoursElapsed),
        riskLevel,
        gym: record.fields['Gym Name'] || 'Unknown',
        member: record.fields['Member Name'] || 'Unknown',
      });
    });

    // Sort by risk level (critical first)
    const riskOrder = { critical: 0, warning: 1, attention: 2, ok: 3 };
    atRisk.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

    return atRisk;
  } catch (error) {
    console.error('Error getting drops at risk:', error);
    return [];
  }
}

/**
 * Get drop status counts
 */
export async function getDropStatusCounts() {
  try {
    const data = await airtableFetch(TABLES.DROPS, {
      params: {
        filterByFormula: `NOT({Status} = 'Collected')`,
      },
    });

    const now = new Date();
    const counts = {
      total: data.records?.length || 0,
      dropped: 0,
      inTransit: 0,
      atLaundry: 0,
      ready: 0,
      overdue: 0,
    };

    (data.records || []).forEach(record => {
      const status = record.fields.Status;
      const dropDate = new Date(record.fields['Drop Date']);
      const hoursElapsed = (now - dropDate) / (1000 * 60 * 60);

      // Count by status
      if (status === 'Dropped') counts.dropped++;
      else if (status === 'In Transit') counts.inTransit++;
      else if (status === 'At Laundry') counts.atLaundry++;
      else if (status === 'Ready') counts.ready++;

      // Check if overdue (not ready within 48 hours)
      if (status !== 'Ready' && hoursElapsed > 48) {
        counts.overdue++;
      }
    });

    return counts;
  } catch (error) {
    console.error('Error getting drop status counts:', error);
    return { total: 0, dropped: 0, inTransit: 0, atLaundry: 0, ready: 0, overdue: 0 };
  }
}

// ============================================================================
// SLA COMPLIANCE
// ============================================================================

/**
 * Get SLA compliance metrics
 */
export async function getSLACompliance() {
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
    let validDrops = 0;

    drops.forEach(drop => {
      const dropDate = new Date(drop.fields['Drop Date']);
      const readyDate = drop.fields['Ready Date'] ? new Date(drop.fields['Ready Date']) : null;
      
      if (readyDate) {
        const hours = (readyDate - dropDate) / (1000 * 60 * 60);
        totalHours += hours;
        validDrops++;
        if (hours <= 48) onTimeCount++;
      }
    });

    const avgTurnaround = validDrops > 0 ? Math.round(totalHours / validDrops) : 0;
    const onTimeRate = validDrops > 0 ? Math.round((onTimeCount / validDrops) * 100) : 100;

    return {
      avgTurnaround,
      onTimeRate,
      totalCompleted: drops.length,
      validDrops,
    };
  } catch (error) {
    console.error('Error getting SLA compliance:', error);
    return { avgTurnaround: 0, onTimeRate: 100, totalCompleted: 0, validDrops: 0 };
  }
}

// ============================================================================
// TICKETS / ISSUES
// ============================================================================

/**
 * Get open issue count
 */
export async function getOpenIssueCount() {
  try {
    const data = await airtableFetch(TABLES.ISSUES, {
      params: {
        filterByFormula: `{Status} = 'Open'`,
      },
    });

    return {
      open: data.records?.length || 0,
    };
  } catch (error) {
    console.error('Error getting open issue count:', error);
    return { open: 0 };
  }
}

/**
 * Get tickets needing attention (open or urgent)
 */
export async function getTicketsNeedingAttention() {
  try {
    const data = await airtableFetch(TABLES.ISSUES, {
      params: {
        filterByFormula: `{Status} = 'Open'`,
        sort: [{ field: 'Created', direction: 'asc' }],
      },
    });

    const now = new Date();
    const tickets = (data.records || []).map(record => {
      const created = new Date(record.createdTime);
      const hoursOpen = (now - created) / (1000 * 60 * 60);
      
      let urgency = 'new';
      if (hoursOpen > 48) urgency = 'overdue';
      else if (hoursOpen > 24) urgency = 'needs_response';

      // Override based on priority
      if (record.fields.Priority === 'Urgent') urgency = 'overdue';
      else if (record.fields.Priority === 'High' && hoursOpen > 12) urgency = 'needs_response';

      return {
        id: record.id,
        type: record.fields['Issue Type'],
        description: record.fields.Description,
        status: record.fields.Status,
        priority: record.fields.Priority || 'Normal',
        memberName: record.fields['Member Name'],
        memberPhone: record.fields['Member Phone'],
        created: record.createdTime,
        hoursOpen: Math.round(hoursOpen),
        urgency,
      };
    });

    // Sort by urgency
    const urgencyOrder = { overdue: 0, needs_response: 1, new: 2 };
    tickets.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return tickets;
  } catch (error) {
    console.error('Error getting tickets needing attention:', error);
    return [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getOpsHealthMetrics,
  getTodaySummary,
  getDropsAtRisk,
  getDropStatusCounts,
  getSLACompliance,
  getOpenIssueCount,
  getTicketsNeedingAttention,
};
