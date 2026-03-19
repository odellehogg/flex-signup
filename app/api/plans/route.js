// app/api/plans/route.js
// Uses lib/plans.js as single source of truth for plan data
// This ensures prices and Stripe IDs are always in sync with env vars
// Airtable Plans table is used for operational data only (drops, members, etc.)

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { getPublicPlans } from '@/lib/plans'

export async function GET() {
  try {
    const plans = getPublicPlans().map(plan => ({
      id: plan.id,
      name: plan.name,
      slug: plan.id,
      price: plan.price,
      drops: plan.drops,
      description: plan.description,
      stripePriceId: plan.stripePriceId,
      isPopular: plan.isPopular || false,
      isSubscription: plan.isSubscription || false,
      features: plan.features || [],
    }))

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json([])
  }
}
