// app/api/member/plan/route.js
// Change subscription plan (Essential ↔ Unlimited)
// Self-contained - uses same token auth pattern as existing member portal

import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

// ============================================================================
// Helper: Get member by token
// ============================================================================

async function getMemberByToken(token) {
  const formula = encodeURIComponent(`{Login Token} = '${token}'`)
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?filterByFormula=${formula}&maxRecords=1`
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
  })
  
  const data = await response.json()
  
  if (!data.records || data.records.length === 0) return null
  
  const member = data.records[0]
  const expiry = member.fields['Token Expiry']
  if (expiry && new Date(expiry) < new Date()) return null
  
  return member
}

// ============================================================================
// Helper: Send WhatsApp
// ============================================================================

async function sendWhatsApp(phone, message) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
  const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+447366907286'

  const formData = new URLSearchParams({
    To: phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`,
    From: TWILIO_WHATSAPP_NUMBER,
    Body: message,
  })

  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    }
  )
}

// ============================================================================
// POST - Change plan
// ============================================================================

export async function POST(request) {
  try {
    const { token, newPlan } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 })
    }

    if (!newPlan || !['Essential', 'Unlimited'].includes(newPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const member = await getMemberByToken(token)
    if (!member) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const stripeSubId = member.fields['Stripe Subscription ID']
    if (!stripeSubId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    // Get price IDs from env
    const priceIds = {
      'Essential': process.env.STRIPE_PRICE_ESSENTIAL,
      'Unlimited': process.env.STRIPE_PRICE_UNLIMITED,
    }

    const newPriceId = priceIds[newPlan]
    if (!newPriceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(stripeSubId)
    const item = subscription.items.data[0]

    // Update subscription with proration
    await stripe.subscriptions.update(stripeSubId, {
      items: [{ id: item.id, price: newPriceId }],
      proration_behavior: 'create_prorations',
    })

    // Update Airtable
    const dropsAllowed = newPlan === 'Unlimited' ? 16 : 10
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${member.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Subscription Tier': newPlan,
            'Drops Allowed': dropsAllowed,
          },
        }),
      }
    )

    // Send notification
    const phone = member.fields['Phone']
    const firstName = member.fields['First Name'] || 'there'
    const planDetails = {
      'Essential': { price: 35, drops: 10 },
      'Unlimited': { price: 48, drops: 16 },
    }

    try {
      await sendWhatsApp(phone,
        `Plan updated! ✅\n\n` +
        `You're now on the ${newPlan} plan:\n` +
        `• £${planDetails[newPlan].price}/month\n` +
        `• ${planDetails[newPlan].drops} drops/month\n\n` +
        `Reply MENU for options.`
      )
    } catch (e) { console.error('Notification failed:', e) }

    return NextResponse.json({
      success: true,
      message: `Changed to ${newPlan} plan`,
      newPlan,
      dropsAllowed,
    })
  } catch (error) {
    console.error('Change plan error:', error)
    return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 })
  }
}
