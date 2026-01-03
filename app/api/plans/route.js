// app/api/plans/route.js
// Fetch active plans from Airtable CMS or use defaults

import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function GET() {
  try {
    // Try to fetch from Airtable CMS if configured
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      const params = new URLSearchParams({
        filterByFormula: '{Is Active} = TRUE()',
        'sort[0][field]': 'Sort Order',
        'sort[0][direction]': 'asc',
      })

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Plans?${params}`,
        {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          },
          next: { revalidate: 300 },
        }
      )

      if (response.ok) {
        const data = await response.json()

        if (data.records && data.records.length > 0) {
          const plans = data.records.map(r => ({
            id: r.id,
            name: r.fields['Name'] || '',
            slug: r.fields['Slug'] || '',
            price: r.fields['Price'] || 0,
            drops: r.fields['Drops Per Month'] || 1,
            description: r.fields['Description'] || '',
            stripePriceId: r.fields['Stripe Price ID'] || '',
            isPopular: r.fields['Is Popular'] || false,
            features: r.fields['Features'] ? r.fields['Features'].split('\n') : [],
          }))

          return NextResponse.json(plans)
        }
      }
    }

    // Return default plans if Airtable not configured or fails
    return NextResponse.json(getDefaultPlans())
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(getDefaultPlans())
  }
}

function getDefaultPlans() {
  return [
    {
      name: 'Single Drop',
      slug: 'single',
      price: 5,
      drops: 1,
      description: 'Try it out, no commitment',
      isPopular: false,
      features: [
        'Pay per drop',
        '48-hour turnaround',
        'WhatsApp notifications',
        'Activewear-safe cleaning',
      ],
    },
    {
      name: 'Essential',
      slug: 'essential',
      price: 35,
      drops: 10,
      description: 'Perfect for 2-3 workouts per week',
      isPopular: true,
      features: [
        '10 drops per month',
        '48-hour turnaround',
        'WhatsApp notifications',
        'Activewear-safe cleaning',
        'Pause or cancel anytime',
      ],
    },
    {
      name: 'Unlimited',
      slug: 'unlimited',
      price: 48,
      drops: 16,
      description: 'For fitness fanatics',
      isPopular: false,
      features: [
        'Up to 16 drops per month',
        '48-hour turnaround',
        'WhatsApp notifications',
        'Priority support',
        'Activewear-safe cleaning',
        'Pause or cancel anytime',
      ],
    },
  ]
}
