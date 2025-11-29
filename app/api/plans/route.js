// app/api/plans/route.js
// Fetch active plans from Airtable CMS

import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function GET() {
  try {
    const params = new URLSearchParams({
      filterByFormula: '{Is Active} = TRUE()',
      sort: JSON.stringify([{ field: 'Sort Order', direction: 'asc' }]),
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

    if (!response.ok) {
      return NextResponse.json(getDefaultPlans())
    }

    const data = await response.json()

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

    return NextResponse.json(plans.length > 0 ? plans : getDefaultPlans())
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
      features: ['Pay per drop', '48-hour turnaround', 'WhatsApp notifications', 'Activewear-safe cleaning'],
    },
    {
      name: 'Essential',
      slug: 'essential',
      price: 30,
      drops: 10,
      description: 'Perfect for 2-3 workouts per week',
      isPopular: true,
      features: ['10 drops per month', '48-hour turnaround', 'WhatsApp notifications', 'Activewear-safe cleaning', 'Pause or cancel anytime'],
    },
  ]
}
