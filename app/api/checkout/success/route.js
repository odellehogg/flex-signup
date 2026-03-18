// app/api/checkout/success/route.js
// ============================================================================
// CHECKOUT SUCCESS VERIFICATION
// NEW FILE - was completely missing, causing success page to always show error
// Called by app/success/page.js after Stripe redirect
// ============================================================================

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const metadata = session.metadata || {};

    return NextResponse.json({
      success: true,
      plan: metadata.planName || 'Essential',
      gym: metadata.gymCode || 'your gym',
      email: session.customer_email || metadata.email || '',
      firstName: metadata.firstName || '',
    });
  } catch (err) {
    console.error('Checkout success verification error:', err);
    return NextResponse.json(
      { error: 'Failed to verify payment session' },
      { status: 500 }
    );
  }
}
