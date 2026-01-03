// app/api/portal/billing/route.js
// Creates Stripe Customer Portal session and returns URL

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMemberById } from '@/lib/airtable'
import { createPortalSession } from '@/lib/stripe-helpers'

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const member = await getMemberById(session.memberId)
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    
    const stripeCustomerId = member.fields['Stripe Customer ID']
    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }
    
    // Get return URL from request or use default
    const { returnUrl } = await request.json().catch(() => ({}))
    const finalReturnUrl = returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://flexlaundry.co.uk'}/portal/dashboard`
    
    // Create Stripe portal session
    const portalUrl = await createPortalSession(stripeCustomerId, finalReturnUrl)
    
    return NextResponse.json({
      success: true,
      url: portalUrl,
    })
    
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json({ error: 'Failed to access billing portal' }, { status: 500 })
  }
}
