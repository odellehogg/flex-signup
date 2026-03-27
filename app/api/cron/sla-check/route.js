import { NextResponse } from 'next/server';
import { getDropsAtRisk, getTicketsNeedingAttention } from '@/lib/sla';
import { sendEmail } from '@/lib/email';

function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return false;
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

      const alertItems = alerts.map(a => {
        if (a.type === 'drops_at_risk') {
          return `<h3>⚠️ ${a.count} Drop(s) at Risk</h3><ul>${a.items.map(i =>
            `<li>Bag ${i.bagNumber} — ${i.status} (${i.riskLevel})</li>`
          ).join('')}</ul>`;
        }
        if (a.type === 'overdue_tickets') {
          return `<h3>🎫 ${a.count} Overdue Ticket(s)</h3><ul>${a.items.map(i =>
            `<li>${i.type} from ${i.memberName} (${i.urgency})</li>`
          ).join('')}</ul>`;
        }
        return '';
      }).join('');

      const totalIssues = alerts.reduce((sum, a) => sum + a.count, 0);

      try {
        await sendEmail({
          to: opsEmail,
          subject: `⚠️ FLEX SLA Alert: ${totalIssues} issue${totalIssues > 1 ? 's' : ''} need attention`,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0;">SLA Alert — ${totalIssues} Issue${totalIssues > 1 ? 's' : ''}</h2>
            </div>
            ${alertItems}
            <p style="color: #666; margin-top: 20px;">Check the <a href="https://www.flexlaundry.co.uk/ops">ops dashboard</a> for details.</p>
          </div>`,
          text: alerts.map(a => `${a.type}: ${a.count} items`).join('\n'),
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
