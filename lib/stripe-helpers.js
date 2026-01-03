// lib/stripe-helpers.js
// ============================================================================
// STRIPE SUBSCRIPTION MANAGEMENT
// Handles subscriptions, pausing, cancellation, billing portal
// ============================================================================

import Stripe from 'stripe';
import { getPlan } from './plans.js';
import { updateMember, getMemberByStripeCustomerId } from './airtable.js';
import { MEMBER_STATUSES } from './constants.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// ============================================================================
// CHECKOUT & PAYMENT
// ============================================================================

/**
 * Create Stripe checkout session for new subscription
 */
export async function createCheckoutSession({ 
  planName, 
  gymId, 
  email, 
  phone,
  successUrl,
  cancelUrl,
}) {
  const plan = getPlan(planName);
  
  if (!plan) {
    throw new Error(`Invalid plan: ${planName}`);
  }

  const sessionParams = {
    mode: plan.isSubscription ? 'subscription' : 'payment',
    line_items: [{
      price: plan.stripePriceId,
      quantity: 1,
    }],
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      planName,
      gymId: gymId || '',
      phone: phone || '',
    },
    allow_promotion_codes: true,
  };

  // Add phone collection if not provided
  if (!phone) {
    sessionParams.phone_number_collection = { enabled: true };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  
  return session;
}

/**
 * Retrieve checkout session details
 */
export async function getCheckoutSession(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['customer', 'subscription', 'line_items'],
  });
  return session;
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId) {
  if (!subscriptionId) return null;
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

/**
 * Pause subscription (sets to cancel at period end)
 */
export async function pauseSubscription(subscriptionId, memberId) {
  try {
    // Pause by setting to cancel at period end
    // This way they keep access until the end of the current period
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'void', // Don't invoice during pause
      },
    });

    // Update Airtable
    await updateMember(memberId, {
      'Status': MEMBER_STATUSES.PAUSED,
    });

    return {
      success: true,
      resumeDate: new Date(subscription.current_period_end * 1000).toLocaleDateString('en-GB'),
    };
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
}

/**
 * Resume paused subscription
 */
export async function resumeSubscription(subscriptionId, memberId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: '', // Clear pause
    });

    // Update Airtable
    await updateMember(memberId, {
      'Status': MEMBER_STATUSES.ACTIVE,
    });

    return { success: true };
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId, memberId, immediately = false) {
  try {
    let subscription;
    
    if (immediately) {
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update Airtable
    await updateMember(memberId, {
      'Status': immediately ? MEMBER_STATUSES.CANCELLED : MEMBER_STATUSES.ACTIVE,
      'Cancellation Date': immediately ? new Date().toISOString() : null,
    });

    return { 
      success: true,
      cancelsAt: new Date(subscription.current_period_end * 1000).toLocaleDateString('en-GB'),
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Undo cancellation (if set to cancel at period end)
 */
export async function undoCancellation(subscriptionId, memberId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    await updateMember(memberId, {
      'Status': MEMBER_STATUSES.ACTIVE,
    });

    return { success: true };
  } catch (error) {
    console.error('Error undoing cancellation:', error);
    throw error;
  }
}

/**
 * Change subscription plan
 */
export async function changePlan(subscriptionId, memberId, newPlanName) {
  const newPlan = getPlan(newPlanName);
  
  if (!newPlan || !newPlan.isSubscription) {
    throw new Error(`Invalid subscription plan: ${newPlanName}`);
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPlan.stripePriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    // Update Airtable
    await updateMember(memberId, {
      'Subscription Tier': newPlanName,
    });

    return { 
      success: true,
      effectiveDate: 'immediately',
    };
  } catch (error) {
    console.error('Error changing plan:', error);
    throw error;
  }
}

/**
 * Apply discount coupon
 */
export async function applyCoupon(subscriptionId, couponId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      coupon: couponId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error applying coupon:', error);
    throw error;
  }
}

// ============================================================================
// CUSTOMER PORTAL
// ============================================================================

/**
 * Create Stripe billing portal session
 */
export async function createPortalSession(customerId, returnUrl) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(payload, signature) {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Handle checkout.session.completed
 */
export async function handleCheckoutCompleted(session) {
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const email = session.customer_email || session.customer_details?.email;
  const phone = session.metadata?.phone || session.customer_details?.phone;
  const planName = session.metadata?.planName;
  const gymId = session.metadata?.gymId;

  return {
    customerId,
    subscriptionId,
    email,
    phone,
    planName,
    gymId,
  };
}

/**
 * Handle invoice.payment_failed
 */
export async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const attemptCount = invoice.attempt_count;

  // Get member
  const member = await getMemberByStripeCustomerId(customerId);
  
  if (member) {
    // Could update status or send notification
    return {
      memberId: member.id,
      memberEmail: member.Email,
      memberPhone: member['Phone Number'],
      firstName: member['First Name'],
      attemptCount,
    };
  }

  return null;
}

/**
 * Handle customer.subscription.updated
 */
export async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;
  const status = subscription.status;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  const pauseCollection = subscription.pause_collection;

  const member = await getMemberByStripeCustomerId(customerId);
  
  if (member) {
    let newStatus = MEMBER_STATUSES.ACTIVE;
    
    if (status === 'canceled') {
      newStatus = MEMBER_STATUSES.CANCELLED;
    } else if (pauseCollection) {
      newStatus = MEMBER_STATUSES.PAUSED;
    } else if (cancelAtPeriodEnd) {
      // Still active but scheduled to cancel
      newStatus = MEMBER_STATUSES.ACTIVE;
    }

    await updateMember(member.id, {
      'Status': newStatus,
    });

    return {
      memberId: member.id,
      newStatus,
    };
  }

  return null;
}

/**
 * Handle customer.subscription.deleted
 */
export async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const member = await getMemberByStripeCustomerId(customerId);
  
  if (member) {
    await updateMember(member.id, {
      'Status': MEMBER_STATUSES.CANCELLED,
    });

    return {
      memberId: member.id,
      memberEmail: member.Email,
      firstName: member['First Name'],
    };
  }

  return null;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get customer by ID
 */
export async function getCustomer(customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}

/**
 * Update customer details
 */
export async function updateCustomer(customerId, updates) {
  try {
    const customer = await stripe.customers.update(customerId, updates);
    return customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

/**
 * Get upcoming invoice
 */
export async function getUpcomingInvoice(customerId) {
  try {
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
    return invoice;
  } catch (error) {
    // No upcoming invoice (e.g., cancelled)
    return null;
  }
}

/**
 * List customer invoices
 */
export async function getInvoices(customerId, limit = 10) {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });
    return invoices.data;
  } catch (error) {
    console.error('Error getting invoices:', error);
    return [];
  }
}

// Export stripe instance for direct use if needed
export { stripe };
