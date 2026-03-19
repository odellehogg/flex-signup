export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { getMemberById } from '@/lib/airtable';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('flex_auth')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const member = await getMemberById(payload.memberId);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const stripeCustomerId = member.fields['Stripe Customer ID'];
    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_URL}/portal`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Portal /billing] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
