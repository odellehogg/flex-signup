import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMemberById, updateMember } from '@/lib/airtable';
import { pauseSubscription } from '@/lib/stripe-helpers';
import { logSubscriptionChange } from '@/lib/audit';
import { sendPauseConfirmationEmail } from '@/lib/email';

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('flex_auth')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const member = await getMemberById(payload.memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const subscriptionId = member.fields['Stripe Subscription ID'];
    if (!subscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    // Pause in Stripe
    await pauseSubscription(subscriptionId);

    // Update member status
    await updateMember(member.id, { 'Status': 'Paused' });

    // Log audit
    await logSubscriptionChange(member.id, 'paused', { source: 'portal' });

    // Send confirmation email
    try {
      await sendPauseConfirmationEmail({
        to: member.fields['Email'],
        firstName: member.fields['First Name'],
      });
    } catch (err) {
      console.error('Failed to send pause email:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Pause subscription error:', err);
    return NextResponse.json({ error: 'Failed to pause subscription' }, { status: 500 });
  }
}
