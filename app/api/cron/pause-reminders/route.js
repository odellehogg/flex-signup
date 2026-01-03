import { NextResponse } from 'next/server';
import { sendPlainTextMessage } from '@/lib/whatsapp';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
    // Find paused members
    const filterFormula = `{Status} = "Paused"`;

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

    console.log(`Found ${members.length} paused members`);

    let sent = 0;
    let errors = 0;

    for (const member of members) {
      try {
        const subscriptionId = member.fields['Stripe Subscription ID'];
        if (!subscriptionId) continue;

        // Check when pause ends in Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const resumeDate = subscription.pause_collection?.resumes_at;

        if (!resumeDate) continue;

        // Only notify if resuming within 3 days
        const resumeTime = resumeDate * 1000;
        const threeDaysFromNow = Date.now() + (3 * 24 * 60 * 60 * 1000);

        if (resumeTime > Date.now() && resumeTime <= threeDaysFromNow) {
          const phone = member.fields['Phone Number'];
          const firstName = member.fields['First Name'] || 'there';
          const resumeDateStr = new Date(resumeTime).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          });

          await sendPlainTextMessage(phone,
            `Hi ${firstName}! 👋\n\n` +
            `Your FLEX subscription will resume on ${resumeDateStr}. Your card will be charged then.\n\n` +
            `Ready to get back to it? Reply RESUME to start early.\n\n` +
            `Need more time? Reply PAUSE to extend your break.`
          );

          sent++;
        }
      } catch (err) {
        console.error(`Failed to check/notify member ${member.id}:`, err);
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
    console.error('Pause reminder cron error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
