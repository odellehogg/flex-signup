// lib/plans.js
// ============================================================================
// UPDATED March 2026 — New pricing per financial model
//
// Airtable Plans (verified from actual schema):
//   - Pay As You Go  slug:payg       £5   price_1SUQob0SM7QXp7SkTxkOxcM4
//   - Essential      slug:essential  £42  STRIPE_PRICE_ESSENTIAL (env var)
//   - Unlimited      slug:unlimited  RETIRED — hidden from all public surfaces
// ============================================================================

export const PLANS = {
  'Pay As You Go': {
    id: 'payg',
    name: 'Pay As You Go',
    price: 5,
    pricePerDrop: 5,
    drops: 1,
    interval: null,
    description: 'Try it once, no commitment',
    shortDescription: '£5 per drop',
    billingNote: null,
    addonNote: null,
    features: ['1 bag of gym clothes', '48-hour turnaround', 'No commitment'],
    stripePriceId: process.env.STRIPE_PRICE_PAYG || 'price_1SUQob0SM7QXp7SkTxkOxcM4',
    isSubscription: false,
    isPopular: false,
    showOnPricing: true,
  },
  'Essential': {
    id: 'essential',
    name: 'Essential',
    price: 42,
    pricePerDrop: '3.50',
    drops: 12,
    interval: 'month',
    description: 'Up to 12 drops per month',
    shortDescription: '£3.50 per drop',
    billingNote: 'Up to 12 drops, billed at £42/month',
    addonNote: 'Add-on: Extra drops for £4',
    features: ['Up to 12 drops per month', '£3.50 per drop', '48-hour turnaround', 'WhatsApp tracking', 'Top up for £4 a drop anytime', 'Cancel anytime'],
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIAL || 'price_1TDxFo0SM7QXp7SkEiqNJVzZ',
    isSubscription: true,
    isPopular: true,
    showOnPricing: true,
  },
  'Addon Drop': {
    id: 'addon',
    name: 'Addon Drop',
    price: 4,
    pricePerDrop: 4,
    drops: 1,
    interval: null,
    description: 'Extra drop — Essential members only',
    shortDescription: '£4 per drop',
    billingNote: null,
    addonNote: null,
    features: ['1 extra bag of gym clothes', '48-hour turnaround', 'Essential members only'],
    stripePriceId: process.env.STRIPE_PRICE_ADDON || 'price_1TDxxj0SM7QXp7SkY1jgoUsx',
    isSubscription: false,
    isPopular: false,
    showOnPricing: false, // Not shown publicly — available post-signup only
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
    showOnPricing: false, // Retired — replaced by Essential + Add-On model
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
