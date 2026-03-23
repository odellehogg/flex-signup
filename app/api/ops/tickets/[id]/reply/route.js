import { NextResponse } from 'next/server';
import { getIssueById, updateIssue, getMemberById } from '@/lib/airtable';
import { sendMessage } from '@/lib/whatsapp';
import { sendTicketReplyEmail } from '@/lib/email';

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

    // Auto-set status to "Waiting on Customer" unless explicitly overridden
    const resolvedStatus = newStatus || 'Waiting on Customer';

    await updateIssue(id, {
      'Internal Notes': updatedNotes,
      'Status': resolvedStatus,
    });

    // Get the linked member for email and phone
    const memberId = ticket.fields['Member']?.[0];
    let memberEmail = null;
    let memberPhone = null;
    let firstName = 'there';
    if (memberId) {
      const member = await getMemberById(memberId);
      if (member) {
        memberEmail = member.fields['Email'];
        memberPhone = member.fields['Phone'];
        firstName = member.fields['First Name'] || 'there';
      }
    }

    // Generate ticket ID
    const ticketId = id.slice(-5).toUpperCase();

    // Send email reply to the member
    if (memberEmail) {
      try {
        await sendTicketReplyEmail({
          to: memberEmail,
          firstName,
          ticketId,
          replyMessage: message,
          conversationHistory: existingNotes,
        });
      } catch (err) {
        console.error('[Ops /tickets/reply] Email send failed:', err.message);
      }
    }

    // WhatsApp nudge only when status changes to "Waiting on Customer"
    if (resolvedStatus === 'Waiting on Customer' && memberPhone) {
      try {
        await sendMessage(memberPhone,
          `Hi ${firstName}, your FLEX support ticket #${ticketId} has been updated. Please check your email for details. Reply HELP if you need anything.`
        );
      } catch (err) {
        console.error('[Ops /tickets/reply] WhatsApp nudge failed:', err.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Ops /tickets/reply] Error:', err.message);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
