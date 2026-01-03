// lib/plans.js
// ============================================================================
// SINGLE SOURCE OF TRUTH FOR ALL PLAN CONFIGURATION
// Update this file when plan details change - all other files import from here
// ============================================================================

// ✅ MVP: Only show One-Off and Essential initially
// Unlimited tier is defined but hidden from public pages

export const PLANS = {
  'One-Off': {
    id: 'oneoff',
    name: 'One-Off',
    price: 5,
    drops: 1,
    interval: null,
    description: 'Try it once',
    shortDescription: 'Single drop',
    features: [
      '1 bag of gym clothes',
      '48-hour turnaround',
      'No commitment',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ONEOFF,
    isSubscription: false,
    isPopular: false,
    showOnPricing: true,  // ✅ Show on pricing page
  },
  'Essential': {
    id: 'essential',
    name: 'Essential',
    price: 35,
    drops: 10,  // ✅ CORRECT: 10 drops per month
    interval: 'month',
    description: '10 drops per month',
    shortDescription: '£3.50 per drop',
    features: [
      '10 drops per month',
      '48-hour turnaround',
      'WhatsApp tracking',
      'Cancel anytime',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIAL,
    isSubscription: true,
    isPopular: true,
    showOnPricing: true,  // ✅ Show on pricing page
  },
  'Unlimited': {
    id: 'unlimited',
    name: 'Unlimited',
    price: 48,
    drops: 16,  // Soft cap at 16
    interval: 'month',
    description: 'Up to 16 drops per month',
    shortDescription: '£3.00 per drop',
    features: [
      'Up to 16 drops per month',
      '48-hour turnaround',
      'WhatsApp tracking',
      'Priority support',
      'Cancel anytime',
    ],
    stripePriceId: process.env.STRIPE_PRICE_UNLIMITED,
    isSubscription: true,
    isPopular: false,
    showOnPricing: false,  // ✅ HIDDEN for MVP - enable later
  },
};

// Helper functions
export function getPlan(planName) {
  return PLANS[planName] || null;
}

export function getPlanByStripePrice(priceId) {
  return Object.values(PLANS).find(plan => plan.stripePriceId === priceId) || null;
}

export function getDropsForPlan(planName) {
  return PLANS[planName]?.drops || 0;
}

export function getAllPlans() {
  return Object.values(PLANS);
}

// ✅ FIX: New function to get only public plans for pricing page
export function getPublicPlans() {
  return Object.values(PLANS).filter(plan => plan.showOnPricing !== false);
}

export function getSubscriptionPlans() {
  return Object.values(PLANS).filter(plan => plan.isSubscription);
}

// ✅ FIX: New function to get visible subscription plans
export function getPublicSubscriptionPlans() {
  return Object.values(PLANS).filter(plan => plan.isSubscription && plan.showOnPricing !== false);
}

// For display purposes
export function formatPlanPrice(planName) {
  const plan = PLANS[planName];
  if (!plan) return '';
  return plan.isSubscription ? `£${plan.price}/month` : `£${plan.price}`;
}

export default PLANS;
