// app/api/member/subscription/route.js
// Subscription management - pause, resume, cancel
// Self-contained - uses same token auth pattern as existing member portal

import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

// ============================================================================
// Helper: Get member by token (same pattern as existing getMemberByToken)
// ============================================================================

async function getMemberByToken(token) {
  const formula = encodeURIComponent(`{Login Token} = '${token}'`)
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?filterByFormula=${formula}&maxRecords=1`
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
  })
  
  const data = await response.json()
  
  if (!data.records || data.records.length === 0) {
    return null
  }
  
  const member = data.records[0]
  
  // Check token expiry
  const expiry = member.fields['Token Expiry']
  if (expiry && new Date(expiry) < new Date()) {
    return null
  }
  
  return member
}

// ============================================================================
// Helper: Update member
// ============================================================================

async function updateMember(memberId, fields) {
  await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${memberId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  )
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
// GET - Get subscription status
// ============================================================================

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 })
  }

  const member = await getMemberByToken(token)
  if (!member) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const stripeSubId = member.fields['Stripe Subscription ID']
  if (!stripeSubId) {
    return NextResponse.json({
      status: 'no_subscription',
      plan: member.fields['Subscription Tier'] || 'None',
    })
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(stripeSubId)

    return NextResponse.json({
      status: subscription.status,
      plan: member.fields['Subscription Tier'],
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      pauseCollection: subscription.pause_collection,
      pauseResumesAt: subscription.pause_collection?.resumes_at
        ? new Date(subscription.pause_collection.resumes_at * 1000).toISOString()
        : null,
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 })
  }
}

// ============================================================================
// POST - Subscription actions (pause, resume, cancel, apply_discount)
// ============================================================================

export async function POST(request) {
  try {
    const { token, action, days, reason } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 })
    }

    const member = await getMemberByToken(token)
    if (!member) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const stripeSubId = member.fields['Stripe Subscription ID']
    if (!stripeSubId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const phone = member.fields['Phone']
    const firstName = member.fields['First Name'] || 'there'

    switch (action) {
      case 'pause': {
        const pauseDays = Math.min(days || 14, 30)
        const resumeAt = Math.floor(Date.now() / 1000) + (pauseDays * 24 * 60 * 60)

        await stripe.subscriptions.update(stripeSubId, {
          pause_collection: { behavior: 'void', resumes_at: resumeAt },
        })

        const resumeDate = new Date(resumeAt * 1000)
        await updateMember(member.id, { 'Status': 'Paused' })

        try {
          await sendWhatsApp(phone,
            `Hey ${firstName}! Your FLEX subscription is now paused. ⏸️\n\n` +
            `It will automatically resume on ${resumeDate.toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}.\n\nReply MENU for options.`
          )
        } catch (e) { console.error('Notification failed:', e) }

        return NextResponse.json({
          success: true,
          message: `Paused until ${resumeDate.toLocaleDateString()}`,
          resumeDate: resumeDate.toISOString(),
        })
      }

      case 'resume': {
        const subscription = await stripe.subscriptions.retrieve(stripeSubId)
        const updates = {}
        if (subscription.pause_collection) updates.pause_collection = ''
        if (subscription.cancel_at_period_end) updates.cancel_at_period_end = false

        if (Object.keys(updates).length > 0) {
          await stripe.subscriptions.update(stripeSubId, updates)
        }

        await updateMember(member.id, { 'Status': 'Active' })

        try {
          await sendWhatsApp(phone,
            `Welcome back, ${firstName}! 🎉\n\nYour FLEX subscription is active again.\n\nReply DROP to start, or MENU for options.`
          )
        } catch (e) { console.error('Notification failed:', e) }

        return NextResponse.json({ success: true, message: 'Subscription resumed' })
      }

      case 'cancel': {
        await stripe.subscriptions.update(stripeSubId, { cancel_at_period_end: true })
        const subscription = await stripe.subscriptions.retrieve(stripeSubId)
        const endDate = new Date(subscription.current_period_end * 1000)

        await updateMember(member.id, { 'Status': 'Cancelling' })

        try {
          await sendWhatsApp(phone,
            `We're sorry to see you go, ${firstName}. 😢\n\n` +
            `Your subscription will end on ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.\n\n` +
            `You can still use your remaining drops until then.`
          )
        } catch (e) { console.error('Notification failed:', e) }

        return NextResponse.json({
          success: true,
          message: `Will end on ${endDate.toLocaleDateString()}`,
          endDate: endDate.toISOString(),
        })
      }

      case 'apply_discount': {
        const coupon = await stripe.coupons.create({
          percent_off: 20,
          duration: 'repeating',
          duration_in_months: 2,
          name: '20% off 2 months - Retention',
        })

        await stripe.subscriptions.update(stripeSubId, {
          coupon: coupon.id,
          cancel_at_period_end: false,
        })

        await updateMember(member.id, { 'Status': 'Active' })

        try {
          await sendWhatsApp(phone,
            `Great news, ${firstName}! 🎉\n\nWe've applied 20% off to your next 2 months.\n\nThanks for staying with FLEX!`
          )
        } catch (e) { console.error('Notification failed:', e) }

        return NextResponse.json({ success: true, message: '20% discount applied for 2 months' })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Subscription action error:', error)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}
