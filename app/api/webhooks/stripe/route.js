import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createMember, getMemberByPhone, updateMember, getMemberByStripeCustomerId } from '@/lib/airtable';
import { getPlanByStripePrice, getDropsForPlan } from '@/lib/plans';
import { sendWelcomeTemplate } from '@/lib/whatsapp';
import { sendWelcomeEmail } from '@/lib/email';
import { logMemberCreated, logSubscriptionChange, logPaymentEvent } from '@/lib/audit';
import { normalizePhone } from '@/lib/airtable';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session) {
  console.log('Processing checkout.session.completed:', session.id);

  // Extract metadata
  const { planId, gymCode, firstName, lastName } = session.metadata || {};
  const email = session.customer_email || session.customer_details?.email;
  const phone = normalizePhone(session.metadata?.phone || session.customer_details?.phone);
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!phone) {
    console.error('No phone number in checkout session');
    return;
  }

  // Check if member already exists
  let member = await getMemberByPhone(phone);

  if (member) {
    // Update existing member
    await updateMember(member.id, {
      'Stripe Customer ID': customerId,
      'Stripe Subscription ID': subscriptionId,
      'Subscription Tier': planId,
      'Status': 'Active',
      'Drops Remaining': getDropsForPlan(planId),
    });
    console.log(`Updated existing member: ${member.id}`);
  } else {
    // Create new member
    member = await createMember({
      'Phone Number': phone,
      'Email': email,
      'First Name': firstName,
      'Last Name': lastName,
      'Gym Code': gymCode,
      'Subscription Tier': planId,
      'Status': 'Active',
      'Stripe Customer ID': customerId,
      'Stripe Subscription ID': subscriptionId,
      'Drops Remaining': getDropsForPlan(planId),
      'Conversation State': 'ACTIVE',
    });
    console.log(`Created new member: ${member.id}`);

    // Log audit event
    await logMemberCreated(member.id, { planId, gymCode, source: 'stripe_checkout' });
  }

  // Get gym name for welcome message
  const gymName = member.fields?.['Gym Name'] || 'your gym';
  const plan = getPlanByStripePrice(planId) || { name: planId };

  // Send welcome WhatsApp
  try {
    await sendWelcomeTemplate(phone, {
      firstName: firstName || 'there',
      planName: plan.name,
      gymName: gymName,
    });
    console.log(`Sent welcome WhatsApp to ${phone}`);
  } catch (err) {
    console.error('Failed to send welcome WhatsApp:', err);
  }

  // Send welcome email
  try {
    await sendWelcomeEmail({
      to: email,
      firstName: firstName || 'there',
      planName: plan.name,
      gymName: gymName,
    });
    console.log(`Sent welcome email to ${email}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription.updated:', subscription.id);

  const member = await getMemberByStripeCustomerId(subscription.customer);
  if (!member) {
    console.log('No member found for subscription update');
    return;
  }

  const updates = {};

  // Check for pause/resume
  if (subscription.pause_collection) {
    updates['Status'] = 'Paused';
  } else if (member.fields['Status'] === 'Paused') {
    updates['Status'] = 'Active';
  }

  // Check for plan change
  const priceId = subscription.items?.data[0]?.price?.id;
  if (priceId) {
    const plan = getPlanByStripePrice(priceId);
    if (plan && plan.id !== member.fields['Subscription Tier']) {
      updates['Subscription Tier'] = plan.id;
      updates['Drops Remaining'] = plan.drops;
    }
  }

  // Check for cancellation scheduled
  if (subscription.cancel_at_period_end) {
    updates['Cancel At Period End'] = true;
  }

  if (Object.keys(updates).length > 0) {
    await updateMember(member.id, updates);
    await logSubscriptionChange(member.id, 'updated', { updates });
    console.log(`Updated member ${member.id}:`, updates);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription.deleted:', subscription.id);

  const member = await getMemberByStripeCustomerId(subscription.customer);
  if (!member) {
    console.log('No member found for subscription deletion');
    return;
  }

  await updateMember(member.id, {
    'Status': 'Cancelled',
    'Stripe Subscription ID': '',
  });

  await logSubscriptionChange(member.id, 'cancelled', { reason: 'subscription_deleted' });
  console.log(`Cancelled member: ${member.id}`);
}

async function handlePaymentSucceeded(invoice) {
  console.log('Processing payment_succeeded:', invoice.id);

  if (invoice.billing_reason === 'subscription_cycle') {
    const member = await getMemberByStripeCustomerId(invoice.customer);
    if (!member) return;

    // Reset drops on renewal
    const plan = getPlanByStripePrice(member.fields['Subscription Tier']);
    if (plan) {
      await updateMember(member.id, {
        'Drops Remaining': plan.drops,
      });
      console.log(`Reset drops for member ${member.id} to ${plan.drops}`);
    }

    await logPaymentEvent(member.id, 'succeeded', { 
      amount: invoice.amount_paid,
      invoiceId: invoice.id 
    });
  }
}

async function handlePaymentFailed(invoice) {
  console.log('Processing payment_failed:', invoice.id);

  const member = await getMemberByStripeCustomerId(invoice.customer);
  if (!member) return;

  await logPaymentEvent(member.id, 'failed', { 
    amount: invoice.amount_due,
    invoiceId: invoice.id 
  });

  // Could send payment failed notification here
  console.log(`Payment failed for member ${member.id}`);
}
