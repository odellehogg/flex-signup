import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMemberById, getActiveDropsByMember } from '@/lib/airtable';
import { getSubscription } from '@/lib/stripe-helpers';

export async function GET() {
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

    // Fetch member
    const member = await getMemberById(payload.memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Fetch subscription
    let subscription = null;
    if (member.fields['Stripe Subscription ID']) {
      try {
        const sub = await getSubscription(member.fields['Stripe Subscription ID']);
        subscription = {
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      }
    }

    // Fetch active drops
    let drops = [];
    try {
      const activeDrops = await getActiveDropsByMember(member.id);
      drops = activeDrops.map(d => ({
        id: d.id,
        bagNumber: d.fields['Bag Number'],
        status: d.fields['Status'],
        dropDate: d.fields['Drop Date'],
        expectedReady: d.fields['Expected Ready'],
      }));
    } catch (err) {
      console.error('Failed to fetch drops:', err);
    }

    return NextResponse.json({
      member: {
        id: member.id,
        firstName: member.fields['First Name'],
        lastName: member.fields['Last Name'],
        email: member.fields['Email'],
        phone: member.fields['Phone Number'],
        gym: member.fields['Gym Name'] || null,
        plan: member.fields['Subscription Tier'],
        status: member.fields['Status'],
        dropsRemaining: member.fields['Drops Remaining'] || 0,
        totalDrops: member.fields['Total Drops'] || 0,
      },
      subscription,
      drops,
    });
  } catch (err) {
    console.error('Me API error:', err);
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
  }
}
