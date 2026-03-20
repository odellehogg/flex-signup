Re-engagement: only send when no active drops in progressimport { NextResponse } from 'next/server';
import { getActiveDropsByMember } from '@/lib/airtable';
import { sendReengagement } from '@/lib/whatsapp';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Verify cron secret
function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return true; // No secret configured, allow
  return authHeader === `Bearer ${expectedSecret}`;
}

export async function GET(request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find active members who still have drops remaining this month
    const filterFormula = `AND(
      {Subscription Status} = "Active",
      {Drops Allowed} > {Drops Used}
    )`;

    const params = new URLSearchParams({
      filterByFormula: filterFormula,
      pageSize: '50',
    });

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?${params}`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!response.ok) throw new Error(`Airtable error: ${response.status}`);

    const data = await response.json();
    const members = data.records;

    console.log(`Checking ${members.length} active members with drops remaining`);

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of members) {
      try {
        const member = { id: record.id, fields: record.fields };

        // Only message members with NO active drops currently in progress
        // (i.e. nothing sitting at Dropped / In Transit / At Laundry / Ready)
        const activeDrops = await getActiveDropsByMember(member);
        if (activeDrops.length > 0) {
          skipped++;
          continue;
        }

        const phone = record.fields['Phone'];
        if (!phone) { skipped++; continue; }

        const firstName = record.fields['First Name'] || 'there';
        const dropsRemaining = (record.fields['Drops Allowed'] || 0) - (record.fields['Drops Used'] || 0);

        // Approximate billing period end — 30 days from now
        // TODO: replace with actual Stripe billing_cycle_anchor when available
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const expiryStr = expiryDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          timeZone: 'Europe/London',
        });

        await sendReengagement(phone, { firstName, dropsRemaining, expiryDate: expiryStr });
        sent++;
      } catch (err) {
        console.error(`Re-engagement failed for ${record.id}:`, err);
        errors++;
      }
    }

    console.log(`Re-engagement: sent=${sent} skipped=${skipped} errors=${errors}`);
    return NextResponse.json({ success: true, processed: members.length, sent, skipped, errors });
  } catch (err) {
    console.error('Re-engagement cron error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
