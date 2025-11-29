// lib/sla.js
// SLA monitoring and alerting for FLEX operations

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

// SLA Thresholds (in hours)
export const SLA_THRESHOLDS = {
  dropped: {
    warning: 4,    // Warn after 4 hours
    critical: 6,   // Critical after 6 hours
  },
  atLaundry: {
    warning: 18,   // Warn after 18 hours
    critical: 30,  // Critical after 30 hours (breaches 48hr SLA)
  },
  ready: {
    warning: 72,   // Warn after 3 days
    critical: 120, // Critical after 5 days
  },
}

/**
 * Calculate SLA status for a drop
 */
export function calculateSlaStatus(status, statusChangedAt) {
  if (!statusChangedAt) return { status: 'unknown', hoursInStatus: 0 }
  
  const hoursInStatus = Math.floor((Date.now() - new Date(statusChangedAt).getTime()) / (1000 * 60 * 60))
  
  const thresholds = {
    'Dropped': SLA_THRESHOLDS.dropped,
    'At Laundry': SLA_THRESHOLDS.atLaundry,
    'Ready': SLA_THRESHOLDS.ready,
    'Ready for Delivery': SLA_THRESHOLDS.ready,
  }
  
  const statusThresholds = thresholds[status]
  if (!statusThresholds) return { status: 'ok', hoursInStatus }
  
  if (hoursInStatus >= statusThresholds.critical) {
    return { status: 'critical', hoursInStatus }
  } else if (hoursInStatus >= statusThresholds.warning) {
    return { status: 'warning', hoursInStatus }
  }
  
  return { status: 'ok', hoursInStatus }
}

/**
 * Get all SLA breaches and warnings
 */
export async function getSlaIssues() {
  try {
    // Get all drops that could be breaching SLA
    const statuses = ['Dropped', 'At Laundry', 'Ready', 'Ready for Delivery']
    const formula = `OR(${statuses.map(s => `{Status} = '${s}'`).join(', ')})`
    
    const params = new URLSearchParams({
      filterByFormula: formula,
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Drops?${params}`,
      {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      }
    )

    if (!response.ok) return { warnings: [], critical: [] }

    const data = await response.json()
    const warnings = []
    const critical = []

    data.records?.forEach(drop => {
      const status = drop.fields['Status']
      const statusChangedAt = drop.fields['Status Changed'] || drop.fields['Drop Date']
      const slaStatus = calculateSlaStatus(status, statusChangedAt)
      
      if (slaStatus.status === 'critical') {
        critical.push({
          id: drop.id,
          bagNumber: drop.fields['Bag Number'],
          memberName: drop.fields['Member Name'],
          gym: drop.fields['Gym'],
          laundryPartner: drop.fields['Laundry Partner'],
          status,
          hoursInStatus: slaStatus.hoursInStatus,
          statusChangedAt,
        })
      } else if (slaStatus.status === 'warning') {
        warnings.push({
          id: drop.id,
          bagNumber: drop.fields['Bag Number'],
          memberName: drop.fields['Member Name'],
          gym: drop.fields['Gym'],
          laundryPartner: drop.fields['Laundry Partner'],
          status,
          hoursInStatus: slaStatus.hoursInStatus,
          statusChangedAt,
        })
      }
    })

    return { warnings, critical }
  } catch (error) {
    console.error('Error getting SLA issues:', error)
    return { warnings: [], critical: [] }
  }
}

/**
 * Get SLA metrics for dashboard
 */
export async function getSlaMetrics() {
  try {
    // Get completed drops from last 30 days for turnaround calculation
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const params = new URLSearchParams({
      filterByFormula: `AND({Status} = 'Collected', IS_AFTER({Drop Date}, '${thirtyDaysAgo}'))`,
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Drops?${params}`,
      {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      }
    )

    if (!response.ok) {
      return {
        avgTurnaround: 0,
        onTimeRate: 0,
        totalCompleted: 0,
        onTimeCount: 0,
        lateCount: 0,
      }
    }

    const data = await response.json()
    const drops = data.records || []
    
    if (drops.length === 0) {
      return {
        avgTurnaround: 0,
        onTimeRate: 100,
        totalCompleted: 0,
        onTimeCount: 0,
        lateCount: 0,
      }
    }

    let totalTurnaround = 0
    let onTimeCount = 0
    let lateCount = 0

    drops.forEach(drop => {
      const dropDate = new Date(drop.fields['Drop Date'])
      const collectedDate = new Date(drop.fields['Collected Date'] || drop.fields['Status Changed'])
      const turnaroundHours = (collectedDate - dropDate) / (1000 * 60 * 60)
      
      totalTurnaround += turnaroundHours
      
      if (turnaroundHours <= 48) {
        onTimeCount++
      } else {
        lateCount++
      }
    })

    return {
      avgTurnaround: Math.round(totalTurnaround / drops.length),
      onTimeRate: Math.round((onTimeCount / drops.length) * 100 * 10) / 10,
      totalCompleted: drops.length,
      onTimeCount,
      lateCount,
    }
  } catch (error) {
    console.error('Error getting SLA metrics:', error)
    return {
      avgTurnaround: 0,
      onTimeRate: 0,
      totalCompleted: 0,
      onTimeCount: 0,
      lateCount: 0,
    }
  }
}

/**
 * Get SLA metrics by laundry partner
 */
export async function getSlaMetricsByPartner() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const params = new URLSearchParams({
      filterByFormula: `AND({Status} = 'Collected', IS_AFTER({Drop Date}, '${thirtyDaysAgo}'))`,
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Drops?${params}`,
      {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      }
    )

    if (!response.ok) return {}

    const data = await response.json()
    const drops = data.records || []
    
    const byPartner = {}

    drops.forEach(drop => {
      const partner = drop.fields['Laundry Partner'] || 'Unknown'
      
      if (!byPartner[partner]) {
        byPartner[partner] = {
          totalDrops: 0,
          onTime: 0,
          late: 0,
          totalTurnaround: 0,
        }
      }

      const dropDate = new Date(drop.fields['Drop Date'])
      const collectedDate = new Date(drop.fields['Collected Date'] || drop.fields['Status Changed'])
      const turnaroundHours = (collectedDate - dropDate) / (1000 * 60 * 60)

      byPartner[partner].totalDrops++
      byPartner[partner].totalTurnaround += turnaroundHours
      
      if (turnaroundHours <= 48) {
        byPartner[partner].onTime++
      } else {
        byPartner[partner].late++
      }
    })

    // Calculate averages
    const result = {}
    for (const [partner, stats] of Object.entries(byPartner)) {
      result[partner] = {
        totalDrops: stats.totalDrops,
        avgTurnaround: Math.round(stats.totalTurnaround / stats.totalDrops),
        onTimeRate: Math.round((stats.onTime / stats.totalDrops) * 100 * 10) / 10,
        onTime: stats.onTime,
        late: stats.late,
      }
    }

    return result
  } catch (error) {
    console.error('Error getting SLA metrics by partner:', error)
    return {}
  }
}
