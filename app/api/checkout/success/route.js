export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCheckoutSession } from '@/lib/stripe-helpers';
import { getPlan } from '@/lib/plans';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID' }, { status: 400 });
    }

    const session = await getCheckoutSession(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const { planId, gymCode } = session.metadata || {};
    const plan = getPlan(planId);

    return NextResponse.json({
      success: true,
      plan: plan?.name || planId,
      gym: gymCode || 'Your gym',
      email: session.customer_email,
    });
  } catch (err) {
    console.error('Checkout success error:', err);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}
