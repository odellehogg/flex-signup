// app/api/webhooks/stripe/route.js
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createMember, updateMember, getMemberByStripeId } from '@/lib/airtable'
import { sendWelcome } from '@/lib/whatsapp'
import { sendWelcomeEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`🔔 Stripe webhook: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session) {
  const { firstName, lastName, phone, gym, plan } = session.metadata
  const customerId = session.customer
  const subscriptionId = session.subscription

  console.log(`✅ Checkout completed for ${firstName} ${lastName}`)

  // Get customer email
  const customer = await stripe.customers.retrieve(customerId)

  // Create member in Airtable
  try {
    const member = await createMember({
      firstName,
      lastName,
      email: customer.email,
      phone,
      gym,
      plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    })

    console.log(`✅ Member created: ${member.id}`)

    // Send WhatsApp welcome
    const gymName = formatGymName(gym)
    await sendWelcome(phone, firstName, plan, gymName)
    console.log(`✅ Welcome WhatsApp sent to ${phone}`)

    // Send welcome email
    await sendWelcomeEmail(customer.email, firstName, plan)
    console.log(`✅ Welcome email sent to ${customer.email}`)

  } catch (error) {
    console.error('Error creating member:', error)
  }
}

async function handleSubscriptionUpdated(subscription) {
  const member = await getMemberByStripeId(subscription.customer)
  if (!member) {
    console.log('Member not found for subscription update')
    return
  }

  let status = 'Active'
  if (subscription.status === 'past_due') status = 'Past Due'
  if (subscription.status === 'canceled') status = 'Cancelled'
  if (subscription.pause_collection) status = 'Paused'
  if (subscription.cancel_at_period_end) status = 'Cancelling'

  await updateMember(member.id, { Status: status })
  console.log(`✅ Member ${member.id} status updated to ${status}`)
}

async function handleSubscriptionDeleted(subscription) {
  const member = await getMemberByStripeId(subscription.customer)
  if (!member) return

  await updateMember(member.id, { Status: 'Cancelled' })
  console.log(`✅ Member ${member.id} cancelled`)
}

async function handlePaymentSucceeded(invoice) {
  // Reset monthly drops on subscription renewal
  if (invoice.billing_reason === 'subscription_cycle') {
    const member = await getMemberByStripeId(invoice.customer)
    if (member) {
      await updateMember(member.id, { 
        'Drops Used This Month': 0,
        'Status': 'Active'
      })
      console.log(`✅ Drops reset for member ${member.id}`)
    }
  }
}

async function handlePaymentFailed(invoice) {
  const member = await getMemberByStripeId(invoice.customer)
  if (!member) return

  await updateMember(member.id, { Status: 'Past Due' })
  
  // Send payment failed email
  const { sendPaymentFailedEmail } = require('@/lib/email')
  await sendPaymentFailedEmail(
    member.fields.Email,
    member.fields['First Name'],
    invoice.hosted_invoice_url
  )
  console.log(`⚠️ Payment failed for member ${member.id}`)
}

function formatGymName(slug) {
  const names = {
    'east-london-fitness': 'East London Fitness',
    'the-yard': 'The Yard',
    'crossfit-hackney': 'CrossFit Hackney',
  }
  return names[slug] || slug
}
