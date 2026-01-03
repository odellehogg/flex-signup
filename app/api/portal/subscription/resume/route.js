import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMemberById, updateMember } from '@/lib/airtable';
import { resumeSubscription } from '@/lib/stripe-helpers';
import { logSubscriptionChange } from '@/lib/audit';

export async function POST() {
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

    const subscriptionId = member.fields['Stripe Subscription ID'];
    if (!subscriptionId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    // Resume in Stripe
    await resumeSubscription(subscriptionId);

    // Update member status
    await updateMember(member.id, { 'Status': 'Active' });

    // Log audit
    await logSubscriptionChange(member.id, 'resumed', { source: 'portal' });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Resume subscription error:', err);
    return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 });
  }
}
