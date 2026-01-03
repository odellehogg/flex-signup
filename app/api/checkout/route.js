import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe-helpers';
import { getPlan } from '@/lib/plans';
import { getGymByCode, normalizePhone } from '@/lib/airtable';

export async function POST(request) {
  try {
    const { planId, gymCode, email, firstName, lastName, phone } = await request.json();

    // Validate required fields
    if (!planId || !email || !phone) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate plan
    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ 
        error: 'Invalid plan' 
      }, { status: 400 });
    }

    // Validate gym if provided
    if (gymCode) {
      const gym = await getGymByCode(gymCode);
      if (!gym) {
        return NextResponse.json({ 
          error: 'Invalid gym code' 
        }, { status: 400 });
      }
    }

    const normalizedPhone = normalizePhone(phone);
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://flexlaundry.co.uk';

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      priceId: plan.stripePriceId,
      mode: plan.isSubscription ? 'subscription' : 'payment',
      customerEmail: email,
      successUrl: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/join?plan=${planId}`,
      metadata: {
        planId,
        gymCode: gymCode || '',
        firstName: firstName || '',
        lastName: lastName || '',
        phone: normalizedPhone,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Create checkout error:', err);
    return NextResponse.json({ 
      error: 'Failed to create checkout session' 
    }, { status: 500 });
  }
}
