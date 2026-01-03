import { NextResponse } from 'next/server';
import { getDropsAtRisk, getTicketsNeedingAttention } from '@/lib/sla';
import { sendOpsNewTicketEmail } from '@/lib/email';

function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return true;
  return authHeader === `Bearer ${expectedSecret}`;
}

export async function GET(request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check for drops at risk
    const dropsAtRisk = await getDropsAtRisk();
    const criticalDrops = dropsAtRisk.filter(d => 
      d.riskLevel === 'critical' || d.riskLevel === 'breached'
    );

    // Check for urgent tickets
    const urgentTickets = await getTicketsNeedingAttention();
    const overdueTickets = urgentTickets.filter(t => t.urgency === 'overdue');

    const alerts = [];

    if (criticalDrops.length > 0) {
      alerts.push({
        type: 'drops_at_risk',
        count: criticalDrops.length,
        items: criticalDrops.map(d => ({
          bagNumber: d.bagNumber,
          status: d.status,
          riskLevel: d.riskLevel,
        })),
      });
    }

    if (overdueTickets.length > 0) {
      alerts.push({
        type: 'overdue_tickets',
        count: overdueTickets.length,
        items: overdueTickets.map(t => ({
          type: t.type,
          memberName: t.memberName,
          urgency: t.urgency,
        })),
      });
    }

    // Send ops alert if there are critical issues
    if (alerts.length > 0) {
      const opsEmail = process.env.OPS_EMAIL || 'odellehogg@gmail.com';
      
      const alertSummary = alerts.map(a => 
        `${a.type}: ${a.count} items`
      ).join('\n');

      try {
        await sendOpsNewTicketEmail({
          to: opsEmail,
          subject: `FLEX SLA Alert: ${alerts.reduce((sum, a) => sum + a.count, 0)} issues`,
          summary: alertSummary,
        });
      } catch (err) {
        console.error('Failed to send ops alert:', err);
      }
    }

    return NextResponse.json({
      success: true,
      alerts,
      summary: {
        criticalDrops: criticalDrops.length,
        overdueTickets: overdueTickets.length,
      },
    });
  } catch (err) {
    console.error('SLA check cron error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
