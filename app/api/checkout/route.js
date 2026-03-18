import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe-helpers';
import { getPlan } from '@/lib/plans';
import { getGymByCode, normalizePhone } from '@/lib/airtable';
import { checkoutRateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { limited } = checkoutRateLimit(`checkout:${ip}`);
    if (limited) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { planId, gymCode, email, firstName, lastName, phone } = await request.json();

    // Validate required fields
    if (!planId || !email || !phone) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json({
        error: 'Invalid email address'
      }, { status: 400 });
    }

    // Validate phone length
    if (phone.length < 7 || phone.length > 20) {
      return NextResponse.json({
        error: 'Invalid phone number'
      }, { status: 400 });
    }

    // Validate name lengths if provided
    if (firstName && firstName.length > 100) {
      return NextResponse.json({ error: 'First name too long' }, { status: 400 });
    }
    if (lastName && lastName.length > 100) {
      return NextResponse.json({ error: 'Last name too long' }, { status: 400 });
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
