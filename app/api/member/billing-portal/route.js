// app/api/member/billing-portal/route.js
// Create Stripe billing portal session for member self-service

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getMemberByToken } from '@/lib/airtable'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Get member by token
    const member = await getMemberByToken(token)

    if (!member) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const stripeCustomerId = member.fields['Stripe Customer ID']

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://flexlaundry.co.uk'}/member/dashboard?token=${token}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
