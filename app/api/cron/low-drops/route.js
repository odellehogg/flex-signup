export const dynamic = 'force-dynamic';

// app/api/cron/low-drops/route.js
// ============================================================================
// Daily cron (9am) — finds Essential members with 1 drop remaining and
// more than 7 days left in the month, then sends a WhatsApp top-up nudge.
//
// Complements the real-time nudge in the WhatsApp webhook (which fires at the
// moment of drop), catching members who may have been nudged earlier but still
// haven't topped up.
// ============================================================================

import { NextResponse } from 'next/server';
import { COMPANY, MEMBER_STATUSES } from '@/lib/constants';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

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
    // Only run if there are >7 days left in the current month
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();

    if (daysLeft <= 7) {
      return NextResponse.json({
        skipped: true,
        reason: `Only ${daysLeft} days left in month — no nudge needed`,
      });
    }

    // Fetch active Essential members with exactly 1 drop remaining
    // Filter: Subscription Status = Active, Subscription Tier = Essential,
    //         Drops Allowed - Drops Used = 1
    const formula = encodeURIComponent(
      `AND(
        {Subscription Status} = "Active",
        {Subscription Tier} = "Essential",
        ({Drops Allowed} - {Drops Used}) = 1
      )`
    );

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?filterByFormula=${formula}&fields[]=First Name&fields[]=Phone&fields[]=Drops Allowed&fields[]=Drops Used`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!res.ok) {
      console.error('[low-drops cron] Airtable error:', await res.text());
      return NextResponse.json({ error: 'Airtable fetch failed' }, { status: 500 });
    }

    const { records } = await res.json();
    console.log(`[low-drops cron] Found ${records.length} members with 1 drop left (${daysLeft} days remaining)`);

    const { sendPlainTextMessage } = await import('@/lib/whatsapp');
    let sent = 0;
    let failed = 0;

    for (const record of records) {
      const phone = record.fields['Phone'];
      const firstName = record.fields['First Name'] || 'there';
      if (!phone) continue;

      try {
        await sendPlainTextMessage(phone,
          `Hey ${firstName} — just a reminder that you have *1 drop left* this month with *${daysLeft} days* still to go. 💚\n\n` +
          `Top up with an extra drop for *£4* anytime:\n${COMPANY.website}/portal\n\n` +
          `Or reply *EXTRA DROP* and we'll send you a payment link.`
        );
        sent++;
      } catch (e) {
        console.error(`[low-drops cron] Failed to notify ${phone}:`, e);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      daysLeftInMonth: daysLeft,
      membersFound: records.length,
      notificationsSent: sent,
      notificationsFailed: failed,
    });
  } catch (err) {
    console.error('[low-drops cron] Error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
