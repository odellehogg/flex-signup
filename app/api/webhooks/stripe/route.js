// app/api/webhooks/stripe/route.js
// ============================================================================
// STRIPE WEBHOOK HANDLER — NEW FILE + CORRECT FIELD NAMES
// FIXES:
//   - Was completely missing from codebase
//   - Uses actual Airtable field names: 'Phone', 'Subscription Status',
//     'Drops Allowed'/'Drops Used' (not 'Drops Remaining'/'Total Drops')
// ============================================================================

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createMember, getMemberById, getMemberByStripeCustomerId, updateMember } from '@/lib/airtable';
import { getPlan, getDropsForPlan } from '@/lib/plans';
import { sendWelcome } from '@/lib/whatsapp';
import { sendWelcomeEmail } from '@/lib/email';
import { getGymByCode } from '@/lib/airtable';
import { MEMBER_STATUSES } from '@/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !WEBHOOK_SECRET) {
      console.error('[Stripe] Missing signature or webhook secret');
      return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      console.error('[Stripe] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`[Stripe] Event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`[Stripe] Unhandled: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Stripe] Webhook error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

// ============================================================================
// CHECKOUT COMPLETED → Create Airtable member
// ============================================================================
async function handleCheckoutCompleted(session) {
  console.log('[Stripe] checkout.session.completed:', session.id);

  const metadata = session.metadata || {};

  // ── Addon drop purchase ──────────────────────────────────────────────────
  if (metadata.type === 'addon_drop') {
    await handleAddonDropCompleted(session);
    return;
  }

  // ── New subscription signup ──────────────────────────────────────────────
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const email = session.customer_email || session.customer_details?.email;
  const { planId, planName, gymCode, gymId, firstName = '', lastName = '', phone } = metadata;

  if (!phone) { console.error('[Stripe] No phone in metadata'); return; }
  if (!email) { console.error('[Stripe] No email in session'); return; }

  const plan = getPlan(planId) || getPlan(planName);
  if (!plan) { console.error(`[Stripe] Unknown plan: ${planId}`); return; }

  let gymRecord = null;
  if (gymCode) gymRecord = await getGymByCode(gymCode).catch(() => null);

  const dropsAllowed = getDropsForPlan(plan.name);
  const gymName = gymRecord?.fields?.Name || gymCode || 'your gym';

  try {
    // ✅ createMember uses correct field names internally
    const member = await createMember({
      phone,
      email,
      firstName,
      lastName,
      plan: plan.name,
      gymId: gymRecord?.id || gymId || null,
      status: MEMBER_STATUSES.ACTIVE,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId || '',
      dropsAllowed, // ✅ maps to 'Drops Allowed' field
    });

    console.log(`[Stripe] Created member: ${member.id}`);

    if (phone) {
      await sendWelcome(phone, { firstName: firstName || 'there', planName: plan.name, gymName })
        .catch(err => console.error('[Stripe] WhatsApp welcome failed:', err));
    }

    if (email) {
      await sendWelcomeEmail({ to: email, firstName: firstName || 'there', planName: plan.name, gymName })
        .catch(err => console.error('[Stripe] Email welcome failed:', err));
    }
  } catch (err) {
    console.error('[Stripe] Member creation failed:', err);
  }
}

// ============================================================================
// ADDON DROP COMPLETED → Increment Drops Allowed by 1 + notify member
// ============================================================================
async function handleAddonDropCompleted(session) {
  const { memberId, phone, firstName = 'there' } = session.metadata || {};
  if (!memberId) { console.error('[Stripe] Addon drop: no memberId in metadata'); return; }

  try {
    const member = await getMemberById(memberId);
    if (!member) { console.error('[Stripe] Addon drop: member not found:', memberId); return; }

    const currentAllowed = member.fields['Drops Allowed'] || 0;
    await updateMember(memberId, { 'Drops Allowed': currentAllowed + 1 });
    console.log(`[Stripe] Addon drop: incremented Drops Allowed for ${memberId} to ${currentAllowed + 1}`);

    if (phone) {
      const { sendPlainTextMessage } = await import('@/lib/whatsapp');
      await sendPlainTextMessage(phone,
        `Your extra drop has been added, ${firstName}! 🎉\n\n` +
        `You now have ${currentAllowed + 1 - (member.fields['Drops Used'] || 0)} drop(s) remaining this month.\n\n` +
        `Ready to use it? Reply 1 or type DROP.`
      ).catch(e => console.error('[Stripe] Addon WhatsApp notify failed:', e));
    }
  } catch (err) {
    console.error('[Stripe] handleAddonDropCompleted error:', err);
  }
}

// ============================================================================
// PAYMENT SUCCEEDED → Reset drops on renewal
// ============================================================================
async function handlePaymentSucceeded(invoice) {
  if (!invoice.subscription || invoice.billing_reason === 'subscription_create') return;

  console.log('[Stripe] Renewal payment:', invoice.id);
  const member = await getMemberByStripeCustomerId(invoice.customer);
  if (!member) return;

  const planName = member.fields['Subscription Tier'];
  const dropsAllowed = getDropsForPlan(planName);

  if (dropsAllowed > 0) {
    // ✅ Reset 'Drops Used' to 0 (effectively restoring all drops)
    await updateMember(member.id, {
      'Drops Used': 0,
      'Subscription Status': MEMBER_STATUSES.ACTIVE,
    }).catch(err => console.error('[Stripe] Reset drops failed:', err));

    console.log(`[Stripe] Reset drops for member: ${member.id}`);

    // Send drop reset notification via WhatsApp
    const phone = member.fields['Phone'];
    const firstName = member.fields['First Name'] || 'there';
    if (phone) {
      const { sendPlainTextMessage } = await import('@/lib/whatsapp');
      await sendPlainTextMessage(phone,
        `Hey ${firstName}! Your ${dropsAllowed} drops have been refreshed for this month. 🎉\n\nReady to make a drop? Reply 1 or text DROP!`
      ).catch(e => console.error('[Stripe] Drop reset notification failed:', e));
    }
  }
}

// ============================================================================
// PAYMENT FAILED
// ============================================================================
async function handlePaymentFailed(invoice) {
  if (!invoice.subscription) return;
  const member = await getMemberByStripeCustomerId(invoice.customer);
  if (!member) return;

  const phone = member.fields['Phone']; // ✅ 'Phone' not 'Phone Number'
  const firstName = member.fields['First Name'] || 'there';

  if (phone) {
    const { sendPlainTextMessage } = await import('@/lib/whatsapp');
    await sendPlainTextMessage(phone,
      `Hi ${firstName}, your FLEX payment failed. Update your payment method to keep your subscription:\n\nhttps://flexlaundry.co.uk/portal`
    ).catch(e => console.error('[Stripe] Payment failed message error:', e));
  }
}

// ============================================================================
// SUBSCRIPTION UPDATED
// ============================================================================
async function handleSubscriptionUpdated(subscription) {
  const member = await getMemberByStripeCustomerId(subscription.customer);
  if (!member) return;

  let newStatus = MEMBER_STATUSES.ACTIVE;
  if (subscription.status === 'canceled') newStatus = MEMBER_STATUSES.CANCELLED;
  else if (subscription.pause_collection) newStatus = MEMBER_STATUSES.PAUSED;
  else if (subscription.status === 'active') newStatus = MEMBER_STATUSES.ACTIVE;

  // ✅ 'Subscription Status' not 'Status'
  await updateMember(member.id, {
    'Subscription Status': newStatus,
    'Stripe Subscription ID': subscription.id,
  }).catch(e => console.error('[Stripe] Status update failed:', e));
}

// ============================================================================
// SUBSCRIPTION DELETED
// ============================================================================
async function handleSubscriptionDeleted(subscription) {
  const member = await getMemberByStripeCustomerId(subscription.customer);
  if (!member) return;

  await updateMember(member.id, {
    'Subscription Status': MEMBER_STATUSES.CANCELLED,
    'Drops Used': member.fields['Drops Allowed'] || 0, // Zero out remaining drops
  }).catch(e => console.error('[Stripe] Cancellation update failed:', e));

  const phone = member.fields['Phone']; // ✅ 'Phone'
  const firstName = member.fields['First Name'] || 'there';

  if (phone) {
    const { sendPlainTextMessage } = await import('@/lib/whatsapp');
    await sendPlainTextMessage(phone,
      `Hi ${firstName}, your FLEX subscription has ended. Hope to see you again!\n\nRejoin at https://flexlaundry.co.uk`
    ).catch(e => console.error('[Stripe] Cancellation message error:', e));
  }
}
