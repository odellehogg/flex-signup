// lib/stripe-helpers.js
// Stripe subscription management for FLEX Portal

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ============================================================================
// SUBSCRIPTION RETRIEVAL
// ============================================================================

export async function getSubscription(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId)
}

export async function getCustomer(customerId) {
  return stripe.customers.retrieve(customerId)
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Pause subscription for specified number of days
 */
export async function pauseSubscription(subscriptionId, days = 14) {
  const resumeAt = Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60)
  
  return stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: 'void',
      resumes_at: resumeAt,
    },
  })
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(subscriptionId) {
  // First check if subscription is paused or cancelled at period end
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  const updates = {}
  
  // Remove pause if paused
  if (subscription.pause_collection) {
    updates.pause_collection = ''
  }
  
  // Remove cancellation if cancelling at period end
  if (subscription.cancel_at_period_end) {
    updates.cancel_at_period_end = false
  }
  
  if (Object.keys(updates).length === 0) {
    return subscription // Nothing to update
  }
  
  return stripe.subscriptions.update(subscriptionId, updates)
}

/**
 * Cancel subscription at end of billing period
 */
export async function cancelSubscription(subscriptionId) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

/**
 * Cancel subscription immediately
 */
export async function cancelSubscriptionImmediately(subscriptionId) {
  return stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Change subscription plan
 */
export async function changeSubscriptionPlan(subscriptionId, newPriceId) {
  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  // Find the subscription item
  const item = subscription.items.data[0]
  
  // Update to new price
  return stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: item.id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations', // Charge difference immediately
  })
}

// ============================================================================
// DISCOUNTS
// ============================================================================

/**
 * Apply percentage discount for a number of months
 */
export async function applyDiscount(subscriptionId, percentOff, durationMonths) {
  // Create a coupon
  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'repeating',
    duration_in_months: durationMonths,
    name: `${percentOff}% off for ${durationMonths} months`,
  })
  
  // Apply to subscription
  return stripe.subscriptions.update(subscriptionId, {
    coupon: coupon.id,
  })
}

/**
 * Apply existing coupon by ID
 */
export async function applyCoupon(subscriptionId, couponId) {
  return stripe.subscriptions.update(subscriptionId, {
    coupon: couponId,
  })
}

// ============================================================================
// CUSTOMER PORTAL
// ============================================================================

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(customerId, returnUrl) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  
  return session.url
}

// ============================================================================
// CHECKOUT
// ============================================================================

/**
 * Create a checkout session for new subscription
 */
export async function createCheckoutSession({
  priceId,
  customerEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  })
  
  return session
}

/**
 * Create a checkout session for one-time payment
 */
export async function createOneTimeCheckout({
  priceId,
  customerEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  })
  
  return session
}

// ============================================================================
// WEBHOOKS
// ============================================================================

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(payload, signature) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )
}

// ============================================================================
// INVOICES
// ============================================================================

/**
 * Get customer's invoices
 */
export async function getCustomerInvoices(customerId, limit = 10) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  })
  
  return invoices.data
}

/**
 * Get upcoming invoice (for preview)
 */
export async function getUpcomingInvoice(customerId) {
  try {
    return await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    })
  } catch (error) {
    // No upcoming invoice (cancelled or paused)
    return null
  }
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(customerId) {
  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  })
  
  return methods.data
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(customerId, paymentMethodId) {
  return stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  })
}

export { stripe }
