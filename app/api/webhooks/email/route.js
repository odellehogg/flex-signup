import { NextResponse } from 'next/server';
import { updateIssue } from '@/lib/airtable';

export async function POST(request) {
  try {
    const body = await request.json();

    // Resend inbound webhook sends: from, to, subject, text, html
    const { from, subject, text } = body;

    if (!from || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract ticket ID from subject line — format: #XXXXX
    const ticketMatch = subject.match(/#([A-Z0-9]{5,})/i);
    if (!ticketMatch) {
      console.log('[Inbound Email] No ticket ID found in subject:', subject);
      return NextResponse.json({ received: true, matched: false });
    }

    const ticketId = ticketMatch[1].toUpperCase();
    console.log(`[Inbound Email] Processing reply for ticket #${ticketId} from ${from}`);

    // Find the issue in Airtable by searching for the ticket ID
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

    // Strip quoted content from reply
    let cleanReply = text || '';
    cleanReply = cleanReply.split(/\n\s*On .* wrote:\s*\n/)[0];
    cleanReply = cleanReply.split('\n')
      .filter(line => !line.trim().startsWith('>'))
      .join('\n')
      .trim();

    if (!cleanReply) {
      cleanReply = '(Empty reply)';
    }

    // Append customer reply to Internal Notes
    const existingNotes = issue.fields['Internal Notes'] || '';
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Dublin' });
    const senderEmail = typeof from === 'string' ? from : from?.address || from;
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
