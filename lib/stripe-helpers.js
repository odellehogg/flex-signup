// lib/stripe-helpers.js
// Stripe subscription management functions

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export async function pauseSubscription(subscriptionId, days) {
  const resumeAt = Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60)
  
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: 'void',
      resumes_at: resumeAt,
    },
  })

  console.log(`✅ Subscription ${subscriptionId} paused until ${new Date(resumeAt * 1000)}`)
  return subscription
}

export async function resumeSubscription(subscriptionId) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    pause_collection: '',
  })

  console.log(`✅ Subscription ${subscriptionId} resumed`)
  return subscription
}

export async function cancelSubscription(subscriptionId) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  console.log(`✅ Subscription ${subscriptionId} will cancel at period end`)
  return subscription
}

export async function cancelSubscriptionImmediately(subscriptionId) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  console.log(`✅ Subscription ${subscriptionId} cancelled immediately`)
  return subscription
}

export async function applyDiscount(subscriptionId, percentOff, durationMonths) {
  // Create a coupon
  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'repeating',
    duration_in_months: durationMonths,
    name: `Retention ${percentOff}% off for ${durationMonths} months`,
  })

  // Apply to subscription
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    coupon: coupon.id,
  })

  console.log(`✅ Applied ${percentOff}% discount to subscription ${subscriptionId}`)
  return subscription
}

export async function getSubscription(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId)
}

export async function getCustomer(customerId) {
  return stripe.customers.retrieve(customerId)
}

export async function createPortalSession(customerId, returnUrl) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || 'https://flexlaundry.co.uk/member',
  })

  return session.url
}

export async function changeSubscriptionPlan(subscriptionId, newPriceId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations',
  })

  console.log(`✅ Subscription ${subscriptionId} changed to ${newPriceId}`)
  return updatedSubscription
}

// ============================================================================
// DISCOUNT CODES
// ============================================================================

export async function createPromotionCode(couponId, code, maxRedemptions = null) {
  const promotionCode = await stripe.promotionCodes.create({
    coupon: couponId,
    code: code.toUpperCase(),
    max_redemptions: maxRedemptions,
  })

  return promotionCode
}

export async function validatePromotionCode(code) {
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code: code.toUpperCase(),
      active: true,
      limit: 1,
    })

    if (promotionCodes.data.length === 0) {
      return { valid: false, error: 'Code not found' }
    }

    const promo = promotionCodes.data[0]
    
    // Check if expired
    if (promo.expires_at && promo.expires_at < Date.now() / 1000) {
      return { valid: false, error: 'Code expired' }
    }

    // Check max redemptions
    if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) {
      return { valid: false, error: 'Code fully redeemed' }
    }

    // Get coupon details
    const coupon = await stripe.coupons.retrieve(promo.coupon.id)

    return {
      valid: true,
      promoId: promo.id,
      percentOff: coupon.percent_off,
      amountOff: coupon.amount_off,
      name: coupon.name,
    }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}
