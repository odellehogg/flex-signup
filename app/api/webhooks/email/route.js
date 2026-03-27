import { NextResponse } from 'next/server';
import { updateIssue } from '@/lib/airtable';

async function getEmailContent(emailId) {
  try {
    const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
    });
    if (!res.ok) {
      console.error(`[Inbound Email] Resend API ${res.status} fetching email ${emailId}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[Inbound Email] Failed to fetch email ${emailId}:`, err.message);
    return null;
  }
}

function stripQuotedContent(text) {
  if (!text) return '';
  // Remove everything after "On ... wrote:" lines
  let clean = text.split(/\n\s*On .* wrote:\s*\n/)[0];
  // Remove lines starting with >
  clean = clean.split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .join('\n')
    .trim();
  return clean;
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Resend email.received webhook format: { type, data: { email_id, from, to, subject, ... } }
    if (body.type !== 'email.received') {
      return NextResponse.json({ received: true, ignored: true });
    }

    const { email_id, from, subject } = body.data || {};

    if (!email_id || !subject) {
      return NextResponse.json({ error: 'Missing email_id or subject' }, { status: 400 });
    }

    // Extract ticket ID from subject line — format: #XXXXX
    const ticketMatch = subject.match(/#([A-Z0-9]{5,})/i);
    if (!ticketMatch) {
      console.log('[Inbound Email] No ticket ID found in subject:', subject);
      return NextResponse.json({ received: true, matched: false });
    }

    const ticketId = ticketMatch[1].toUpperCase();
    const senderEmail = typeof from === 'string' ? from : from?.address || from;
    console.log(`[Inbound Email] Processing reply for ticket #${ticketId} from ${senderEmail}`);

    // Find the issue in Airtable
    const { airtableFetch, TABLES } = await import('@/lib/airtable');
    const data = await airtableFetch(TABLES.ISSUES, {
      params: {
        filterByFormula: `{Ticket ID}="${ticketId}"`,
        maxRecords: 1,
      },
    });

    if (!data.records || data.records.length === 0) {
      console.log(`[Inbound Email] No ticket found for #${ticketId}`);
      return NextResponse.json({ received: true, matched: false });
    }

    const issue = data.records[0];

    // Fetch the full email body from Resend API
    const emailData = await getEmailContent(email_id);
    let cleanReply;
    if (emailData?.text) {
      cleanReply = stripQuotedContent(emailData.text);
    }
    if (!cleanReply) {
      cleanReply = '(Could not retrieve email body)';
    }

    // Append customer reply to Internal Notes
    const existingNotes = issue.fields['Internal Notes'] || '';
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Dublin' });
    const newNote = `\n\n--- Customer Reply (${timestamp}) ---\nFrom: ${senderEmail}\n${cleanReply}`;
    const updatedNotes = existingNotes + newNote;

    // Update the issue: append note and set status to Open
    await updateIssue(issue.id, {
      'Internal Notes': updatedNotes,
      'Status': 'Open',
    });

    console.log(`[Inbound Email] Updated ticket #${ticketId} with customer reply`);

    return NextResponse.json({ received: true, matched: true, ticketId });
  } catch (err) {
    console.error('[Inbound Email] Webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
