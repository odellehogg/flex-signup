import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMemberById, updateMember } from '@/lib/airtable';
import { cancelSubscription } from '@/lib/stripe-helpers';
import { logSubscriptionChange } from '@/lib/audit';
import { sendCancellationEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
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

    const { reason, immediate = false } = await request.json().catch(() => ({}));

    const subscriptionId = member.fields['Stripe Subscription ID'];
    if (!subscriptionId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    // Cancel in Stripe (at period end by default)
    await cancelSubscription(subscriptionId, { immediate });

    // Update member
    if (immediate) {
      await updateMember(member.id, { 
        'Status': 'Cancelled',
        'Cancellation Reason': reason,
      });
    } else {
      await updateMember(member.id, { 
        'Cancel At Period End': true,
        'Cancellation Reason': reason,
      });
    }

    // Log audit
    await logSubscriptionChange(member.id, 'cancelled', { 
      reason, 
      immediate, 
      source: 'portal' 
    });

    // Send confirmation email
    try {
      await sendCancellationEmail({
        to: member.fields['Email'],
        firstName: member.fields['First Name'],
        immediate,
      });
    } catch (err) {
      console.error('Failed to send cancellation email:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
