// lib/sla.js
// ============================================================================
// SLA MONITORING (Stub for MVP)
// Tracks drops at risk and tickets needing attention
// ============================================================================

import { TABLES, DROP_STATUSES } from './constants.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appkU13tG14ZLVZZ9';

/**
 * Get drops that are at risk of missing SLA (48 hour turnaround)
 * Returns drops that have been in non-collected status for >36 hours
 */
export async function getDropsAtRisk() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.DROPS)}?` +
      new URLSearchParams({
        filterByFormula: `AND(
          NOT({Status} = '${DROP_STATUSES.COLLECTED}'),
          IS_BEFORE({Drop Date}, DATEADD(NOW(), -36, 'hours'))
        )`,
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch drops at risk');
      return [];
    }

    const data = await response.json();
    
    return data.records.map(record => {
      const dropDate = new Date(record.fields['Drop Date']);
      const hoursElapsed = (Date.now() - dropDate.getTime()) / (1000 * 60 * 60);
      
      return {
        id: record.id,
        bagNumber: record.fields['Bag Number'],
        status: record.fields['Status'],
        dropDate: record.fields['Drop Date'],
        hoursElapsed: Math.round(hoursElapsed),
        urgency: hoursElapsed > 48 ? 'overdue' : hoursElapsed > 36 ? 'at_risk' : 'ok',
      };
    });
  } catch (error) {
    console.error('Error getting drops at risk:', error);
    return [];
  }
}

/**
 * Get support tickets that need attention
 * Returns open tickets older than 24 hours
 */
export async function getTicketsNeedingAttention() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.ISSUES)}?` +
      new URLSearchParams({
        filterByFormula: `AND(
          {Status} = 'Open',
          IS_BEFORE({Created}, DATEADD(NOW(), -24, 'hours'))
        )`,
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch tickets needing attention');
      return [];
    }

    const data = await response.json();
    
    return data.records.map(record => {
      const created = new Date(record.fields['Created']);
      const hoursOpen = (Date.now() - created.getTime()) / (1000 * 60 * 60);
      
      return {
        id: record.id,
        type: record.fields['Type'],
        description: record.fields['Description'],
        created: record.fields['Created'],
        hoursOpen: Math.round(hoursOpen),
        urgency: hoursOpen > 48 ? 'overdue' : hoursOpen > 24 ? 'needs_attention' : 'ok',
      };
    });
  } catch (error) {
    console.error('Error getting tickets needing attention:', error);
    return [];
  }
}

export default {
  getDropsAtRisk,
  getTicketsNeedingAttention,
  getOpsHealthMetrics,
  getTodaySummary,
};

/**
 * Get overall ops health metrics for dashboard
 */
export async function getOpsHealthMetrics() {
  const dropsAtRisk = await getDropsAtRisk();
  const tickets = await getTicketsNeedingAttention();
  
  return {
    dropsAtRisk: dropsAtRisk.length,
    overdueDrops: dropsAtRisk.filter(d => d.urgency === 'overdue').length,
    openTickets: tickets.length,
    overdueTickets: tickets.filter(t => t.urgency === 'overdue').length,
    status: dropsAtRisk.some(d => d.urgency === 'overdue') || tickets.some(t => t.urgency === 'overdue') 
      ? 'critical' 
      : dropsAtRisk.length > 0 || tickets.length > 0 
        ? 'warning' 
        : 'healthy',
  };
}

/**
 * Get summary of today's activity
 */
export async function getTodaySummary() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's drops
    const dropsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.DROPS)}?` +
      new URLSearchParams({
        filterByFormula: `IS_SAME({Drop Date}, TODAY(), 'day')`,
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const dropsData = dropsResponse.ok ? await dropsResponse.json() : { records: [] };
    
    return {
      date: today,
      newDrops: dropsData.records.length,
      completedDrops: dropsData.records.filter(r => r.fields['Status'] === 'Collected').length,
      readyDrops: dropsData.records.filter(r => r.fields['Status'] === 'Ready').length,
    };
  } catch (error) {
    console.error('Error getting today summary:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      newDrops: 0,
      completedDrops: 0,
      readyDrops: 0,
    };
  }
}
