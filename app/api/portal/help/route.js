export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMemberById, createIssue, updateIssue } from '@/lib/airtable';
import { sendCustomerSupportConfirmationEmail, sendOpsNewTicketEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('flex_auth')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const member = await getMemberById(payload.memberId);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const { topic, message } = await request.json();
    if (!topic || !message) {
      return NextResponse.json({ error: 'Topic and message are required' }, { status: 400 });
    }

    const issue = await createIssue({
      memberId: member.id,
      type: 'Other',
      description: `Topic: ${topic}\n\n${message}`,
      source: 'Email',
    });

    // Generate short ticket ID from Airtable record ID
    const ticketId = issue.id.slice(-5).toUpperCase();

    // Set ticket ID on the record
    try {
      await updateIssue(issue.id, { 'Ticket ID': ticketId });
    } catch (err) {
      console.error('[Portal /help] Failed to set Ticket ID:', err.message);
    }

    // Send confirmation email
    const email = member.fields['Email'];
    const firstName = member.fields['First Name'] || 'there';
    if (email) {
      try {
        await sendCustomerSupportConfirmationEmail({
          to: email,
          firstName,
          ticketId,
          description: `Topic: ${topic}\n\n${message}`,
        });
      } catch (err) {
        console.error('[Portal /help] Confirmation email failed:', err.message);
      }
    }

    // Send ops notification email
    await sendOpsNewTicketEmail({
      memberName: `${member.fields['First Name'] || ''} ${member.fields['Last Name'] || ''}`.trim(),
      memberEmail: email,
      memberPhone: member.fields['Phone'],
      ticketId,
      description: `[${topic}] ${message}`,
    }).catch(err => console.error('[Portal /help] Ops notification email failed:', err.message));

    return NextResponse.json({ success: true, ticketId });
  } catch (err) {
    console.error('[Portal /help] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
