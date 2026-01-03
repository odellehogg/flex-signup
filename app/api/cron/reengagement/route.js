import { NextResponse } from 'next/server';
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
  // Verify this is a legitimate cron request
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find members who:
    // - Are active
    // - Haven't dropped in 14+ days
    // - Have drops remaining
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const dateStr = fourteenDaysAgo.toISOString().split('T')[0];

    const filterFormula = `AND(
      {Status} = "Active",
      {Drops Remaining} > 0,
      OR(
        {Last Drop Date} = "",
        {Last Drop Date} < "${dateStr}"
      )
    )`;

    const params = new URLSearchParams({
      filterByFormula: filterFormula,
      pageSize: '50',
    });

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable error: ${response.status}`);
    }

    const data = await response.json();
    const members = data.records;

    console.log(`Found ${members.length} members for re-engagement`);

    let sent = 0;
    let errors = 0;

    for (const member of members) {
      try {
        const phone = member.fields['Phone Number'];
        const firstName = member.fields['First Name'] || 'there';
        const dropsRemaining = member.fields['Drops Remaining'];
        
        // Get subscription end date (approximate - end of billing period)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const expiryStr = expiryDate.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short' 
        });

        await sendReengagement(phone, {
          firstName,
          dropsRemaining,
          expiryDate: expiryStr,
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send re-engagement to ${member.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: members.length,
      sent,
      errors,
    });
  } catch (err) {
    console.error('Re-engagement cron error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
