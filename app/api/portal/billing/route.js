import { NextResponse } from 'next/server';

import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getMemberById } from '@/lib/airtable';
import { createPortalSession } from '@/lib/stripe-helpers';


export const dynamic = 'force-dynamic';

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

    const customerId = member.fields['Stripe Customer ID'];
    if (!customerId) {
      return NextResponse.json({ error: 'No billing account' }, { status: 400 });
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_URL || 'https://flexlaundry.co.uk'}/portal`;
    const session = await createPortalSession(customerId, returnUrl);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Billing portal error:', err);
    return NextResponse.json({ error: 'Failed to access billing' }, { status: 500 });
  }
}
