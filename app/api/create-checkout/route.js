// app/api/create-checkout/route.js
// Dynamic checkout - fetches Stripe Price ID from Airtable Plans table

import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

// Fetch plan details from Airtable
async function getPlanBySlug(slug) {
  try {
    const params = new URLSearchParams({
      filterByFormula: `{Slug} = '${slug}'`,
      maxRecords: '1',
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Plans?${params}`,
      {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    if (!data.records || data.records.length === 0) return null

    const plan = data.records[0]
    return {
      id: plan.id,
      name: plan.fields['Name'],
      slug: plan.fields['Slug'],
      stripePriceId: plan.fields['Stripe Price ID'],
      isSubscription: plan.fields['Is Subscription'] !== false, // Default true
      dropsPerMonth: plan.fields['Drops Per Month'] || 1,
    }
  } catch (error) {
    console.error('Error fetching plan:', error)
    return null
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, gym, plan: planSlug, discountCode } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !gym || !planSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch plan from Airtable
    const plan = await getPlanBySlug(planSlug)
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 })
    }

    if (!plan.stripePriceId) {
      console.error(`Plan ${planSlug} has no Stripe Price ID configured`)
      return NextResponse.json({ error: 'Plan not configured for checkout' }, { status: 400 })
    }

    // Format phone for WhatsApp (ensure +44 format)
    let formattedPhone = phone.replace(/\s/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+44' + formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+44' + formattedPhone
    }

    // Check if customer exists
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    let customer
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      // Update customer metadata
      await stripe.customers.update(customer.id, {
        name: `${firstName} ${lastName}`,
        phone: formattedPhone,
        metadata: {
          gym,
          firstName,
          lastName,
        },
      })
    } else {
      customer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`,
        phone: formattedPhone,
        metadata: {
          gym,
          firstName,
          lastName,
        },
      })
    }

    // Build checkout session params
    const sessionParams = {
      customer: customer.id,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: plan.isSubscription ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://flexlaundry.co.uk'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://flexlaundry.co.uk'}/join?plan=${planSlug}`,
      metadata: {
        firstName,
        lastName,
        phone: formattedPhone,
        gym,
        plan: planSlug,
        planName: plan.name,
        dropsPerMonth: plan.dropsPerMonth,
      },
      customer_update: {
        address: 'auto',
      },
    }

    // Apply discount code if provided
    if (discountCode) {
      try {
        // Check if it's a promotion code
        const promotionCodes = await stripe.promotionCodes.list({
          code: discountCode.toUpperCase(),
          active: true,
          limit: 1,
        })

        if (promotionCodes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promotionCodes.data[0].id }]
        }
      } catch (err) {
        console.log('Discount code not found:', discountCode)
      }
    }

    // Allow promotion codes if none specified
    if (!sessionParams.discounts) {
      sessionParams.allow_promotion_codes = true
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
