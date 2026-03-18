// app/api/checkout/route.js
// ============================================================================
// STRIPE CHECKOUT — FETCHES PRICE ID FROM AIRTABLE (SOURCE OF TRUTH)
//
// FIXES:
//   - Form sends { plan, gym } but code was destructuring { planId, gymCode }
//   - One-off slug is "payg" not "oneoff" — now fetches from Airtable directly
//   - Falls back to lib/plans.js if Airtable unavailable
//   - Stripe session created directly (stripe-helpers had wrong param signature)
// ============================================================================

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPlan } from '@/lib/plans';
import { getGymByCode, normalizePhone } from '@/lib/airtable';
import { checkoutRateLimit } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Fetch plan directly from Airtable Plans table (authoritative source of truth)
async function getPlanFromAirtable(slug) {
  try {
    const params = new URLSearchParams({
      filterByFormula: `LOWER({Slug}) = '${slug.toLowerCase()}'`,
      maxRecords: '1',
    });
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Plans?${params}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.records?.length) return null;
    const r = data.records[0].fields;
    return {
      name: r['Name'],
      slug: r['Slug'],
      price: r['Price'],
      drops: r['Drops Allowed'],
      stripePriceId: r['Stripe Price ID'],
      isSubscription: r['Name'] !== 'Pay As You Go',
      isActive: r['Is Active'] || false,
    };
  } catch (e) {
    console.error('Airtable plan lookup failed:', e);
    return null;
  }
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { limited } = checkoutRateLimit(`checkout:${ip}`);
    if (limited) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();

    // FIX: form sends { plan, gym } — was destructuring { planId, gymCode }
    const { plan: planSlug, gym: gymCode, email, firstName, lastName, phone } = body;

    if (!planSlug || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields: plan, email, phone' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (phone.length < 7 || phone.length > 25) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Try Airtable first (authoritative), fall back to lib/plans.js
    let plan = await getPlanFromAirtable(planSlug);
    if (!plan) {
      console.warn(`Airtable plan lookup failed for "${planSlug}", trying lib/plans.js fallback`);
      const fallback = getPlan(planSlug);
      if (fallback) {
        plan = {
          name: fallback.name,
          slug: fallback.id,
          price: fallback.price,
          drops: fallback.drops,
          stripePriceId: fallback.stripePriceId,
          isSubscription: fallback.isSubscription,
          isActive: true,
        };
      }
    }

    if (!plan) {
      return NextResponse.json({ error: `Invalid plan: "${planSlug}"` }, { status: 400 });
    }

    if (!plan.stripePriceId) {
      console.error(`No Stripe price ID for plan: ${plan.name}`);
      return NextResponse.json({ error: 'Payment configuration error — contact support' }, { status: 500 });
    }

    // Validate gym
    let gym = null;
    if (gymCode && gymCode !== 'undefined' && gymCode !== '') {
      gym = await getGymByCode(gymCode);
      if (!gym) {
        return NextResponse.json({ error: `Invalid gym code: "${gymCode}"` }, { status: 400 });
      }
    }

    const normalizedPhone = normalizePhone(phone);
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://flexlaundry.co.uk';

    const session = await stripe.checkout.sessions.create({
      mode: plan.isSubscription ? 'subscription' : 'payment',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer_email: email,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/join?plan=${planSlug}`,
      metadata: {
        planId: plan.slug,
        planName: plan.name,
        gymCode: gymCode || '',
        gymId: gym?.id || '',
        firstName: firstName || '',
        lastName: lastName || '',
        phone: normalizedPhone,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
