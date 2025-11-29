// app/api/cron/sla-check/route.js
// Automated SLA monitoring - runs every hour
// Alerts ops team when bags breach SLA thresholds

import { NextResponse } from 'next/server'
import { getSlaIssues } from '@/lib/sla'
import { sendEmail } from '@/lib/email'

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { warnings, critical } = await getSlaIssues()

    // If we have critical issues, send alert email
    if (critical.length > 0) {
      const opsEmail = process.env.OPS_ALERT_EMAIL || 'ops@flexlaundry.co.uk'
      
      const criticalList = critical.map(c => 
        `• ${c.bagNumber} - ${c.status} for ${c.hoursInStatus}hrs at ${c.gym || c.laundryPartner || 'Unknown location'}`
      ).join('\n')

      const warningList = warnings.length > 0 
        ? warnings.map(w => 
            `• ${w.bagNumber} - ${w.status} for ${w.hoursInStatus}hrs`
          ).join('\n')
        : 'None'

      await sendEmail({
        to: opsEmail,
        subject: `🚨 FLEX SLA Alert: ${critical.length} Critical Issue${critical.length > 1 ? 's' : ''}`,
        html: `
          <h2>FLEX SLA Alert</h2>
          
          <h3 style="color: #dc2626;">Critical Issues (${critical.length})</h3>
          <p>These bags have breached SLA thresholds and need immediate attention:</p>
          <pre style="background: #fef2f2; padding: 15px; border-radius: 8px; color: #991b1b;">${criticalList}</pre>
          
          <h3 style="color: #d97706;">Warnings (${warnings.length})</h3>
          <pre style="background: #fffbeb; padding: 15px; border-radius: 8px; color: #92400e;">${warningList}</pre>
          
          <p><a href="https://flexlaundry.co.uk/ops/pickups" style="background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 15px;">View in Ops Dashboard</a></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated alert from FLEX. Review and resolve issues promptly to maintain service quality.</p>
        `,
      })

      console.log(`SLA Alert sent: ${critical.length} critical, ${warnings.length} warnings`)
    }

    return NextResponse.json({
      success: true,
      critical: critical.length,
      warnings: warnings.length,
      alertSent: critical.length > 0,
    })
  } catch (error) {
    console.error('SLA check error:', error)
    return NextResponse.json({ error: 'SLA check failed' }, { status: 500 })
  }
}
