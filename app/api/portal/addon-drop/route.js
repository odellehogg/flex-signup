export const dynamic = 'force-dynamic';

// app/api/portal/addon-drop/route.js
// Creates a Stripe Checkout session for an Essential member to buy 1 extra drop at £4.
// On successful payment, the Stripe webhook increments their Drops Allowed by 1.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { getMemberById } from '@/lib/airtable';
import { PLANS } from '@/lib/plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('flex_auth')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const member = await getMemberById(payload.memberId);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // Only Essential members can buy add-on drops
    const tier = member.fields['Subscription Tier'] || '';
    if (!tier.toLowerCase().includes('essential')) {
      return NextResponse.json(
        { error: 'Add-on drops are only available to Essential plan members.' },
        { status: 403 }
      );
    }

    const stripeCustomerId = member.fields['Stripe Customer ID'];
    const addonPlan = PLANS['Addon Drop'];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId || undefined,
      customer_email: stripeCustomerId ? undefined : member.fields['Email'],
      line_items: [
        {
          price: addonPlan.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        type: 'addon_drop',
        memberId: member.id,
        phone: member.fields['Phone'] || '',
        firstName: member.fields['First Name'] || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/portal?addon=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/portal`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Portal /addon-drop] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
