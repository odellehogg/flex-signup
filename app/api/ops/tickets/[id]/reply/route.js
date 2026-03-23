import { NextResponse } from 'next/server';
import { getIssueById, updateIssue } from '@/lib/airtable';
import { sendMessage } from '@/lib/whatsapp';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { message, newStatus } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const ticket = await getIssueById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Append reply to Internal Notes with timestamp
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const existingNotes = ticket.fields['Internal Notes'] || '';
    const newNote = `[${now}] FLEX: ${message}`;
    const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

    const updates = { 'Internal Notes': updatedNotes };
    if (newStatus) updates['Status'] = newStatus;

    await updateIssue(id, updates);

    // Send WhatsApp notification to the member
    const memberPhone = ticket.fields['Member Phone']?.[0] || ticket.fields['Phone'];
    if (memberPhone) {
      try {
        await sendMessage(memberPhone,
          `You have a new update on your FLEX support ticket:\n\n${message}\n\nReply HELP to continue the conversation.`
        );
      } catch (err) {
        console.error('[Ops /tickets/reply] WhatsApp send failed:', err.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Ops /tickets/reply] Error:', err.message);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
