// lib/plans.js
// ============================================================================
// CORRECTED TO MATCH ACTUAL AIRTABLE PLANS TABLE AND STRIPE PRICES
//
// Airtable Plans (verified from actual schema):
//   - Pay As You Go  slug:payg       £5   price_1SUQob0SM7QXp7SkTxkOxcM4
//   - Essential      slug:essential  £35  price_1TCe9X0SM7QXp7SkduBiHLtA
//   - Unlimited      slug:unlimited  £48  price_1SUQnm0SM7QXp7Skdd4xWjFJ
// ============================================================================

export const PLANS = {
  'Pay As You Go': {
    id: 'payg',
    name: 'Pay As You Go',
    price: 5,
    drops: 1,
    interval: null,
    description: 'Try it once, no commitment',
    shortDescription: 'Single drop',
    features: ['1 bag of gym clothes', '48-hour turnaround', 'No commitment'],
    stripePriceId: process.env.STRIPE_PRICE_PAYG || 'price_1SUQob0SM7QXp7SkTxkOxcM4',
    isSubscription: false,
    isPopular: false,
    showOnPricing: true,
  },
  'Essential': {
    id: 'essential',
    name: 'Essential',
    price: 35,
    drops: 10,
    interval: 'month',
    description: '10 drops per month',
    shortDescription: '£3.50 per drop',
    features: ['10 drops per month', '48-hour turnaround', 'WhatsApp tracking', 'Cancel anytime'],
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIAL || 'price_1TCe9X0SM7QXp7SkduBiHLtA',
    isSubscription: true,
    isPopular: true,
    showOnPricing: true,
  },
  'Unlimited': {
    id: 'unlimited',
    name: 'Unlimited',
    price: 48,
    drops: 16,
    interval: 'month',
    description: 'Up to 16 drops per month',
    shortDescription: '£3.00 per drop',
    features: ['Up to 16 drops per month', '48-hour turnaround', 'WhatsApp tracking', 'Priority support', 'Cancel anytime'],
    stripePriceId: process.env.STRIPE_PRICE_UNLIMITED || 'price_1SUQnm0SM7QXp7Skdd4xWjFJ',
    isSubscription: true,
    isPopular: false,
    showOnPricing: false,
  },
};

export function getPlan(planNameOrId) {
  if (!planNameOrId) return null;
  if (PLANS[planNameOrId]) return PLANS[planNameOrId];
  const byId = Object.values(PLANS).find(p => p.id === planNameOrId);
  if (byId) return byId;
  // Legacy fallbacks
  if (['oneoff', 'single', 'one-off'].includes(planNameOrId)) return PLANS['Pay As You Go'];
  return null;
}

export function getPlanByStripePrice(priceId) {
  return Object.values(PLANS).find(p => p.stripePriceId === priceId) || null;
}

export function getDropsForPlan(planName) {
  return getPlan(planName)?.drops || 0;
}

export function getAllPlans() { return Object.values(PLANS); }
export function getPublicPlans() { return Object.values(PLANS).filter(p => p.showOnPricing !== false); }
export function getSubscriptionPlans() { return Object.values(PLANS).filter(p => p.isSubscription); }
export function getPublicSubscriptionPlans() { return Object.values(PLANS).filter(p => p.isSubscription && p.showOnPricing !== false); }
export function formatPlanPrice(planName) {
  const plan = getPlan(planName);
  return plan ? (plan.isSubscription ? `£${plan.price}/month` : `£${plan.price}`) : '';
}

export default PLANS;
