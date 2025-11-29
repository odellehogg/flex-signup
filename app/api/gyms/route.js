// app/api/gyms/route.js
// Fetch active gyms from Airtable CMS

import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function GET() {
  try {
    const params = new URLSearchParams({
      filterByFormula: '{Is Active} = TRUE()',
      sort: JSON.stringify([{ field: 'Name', direction: 'asc' }]),
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Gyms?${params}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
        next: { revalidate: 300 },
      }
    )

    if (!response.ok) {
      return NextResponse.json(getDefaultGyms())
    }

    const data = await response.json()

    const gyms = data.records.map(r => ({
      id: r.id,
      name: r.fields['Name'] || '',
      slug: r.fields['Slug'] || '',
      address: r.fields['Address'] || '',
      postcode: r.fields['Postcode'] || '',
      contactEmail: r.fields['Contact Email'] || '',
      pickupHours: r.fields['Pickup Hours'] || 'Mon-Sun 6am-10pm',
    }))

    return NextResponse.json(gyms.length > 0 ? gyms : getDefaultGyms())
  } catch (error) {
    console.error('Error fetching gyms:', error)
    return NextResponse.json(getDefaultGyms())
  }
}

function getDefaultGyms() {
  return [
    {
      name: 'East London Fitness',
      slug: 'east-london-fitness',
      address: '123 Hackney Road',
      postcode: 'E2 8ET',
      pickupHours: 'Mon-Fri 6am-10pm, Sat-Sun 8am-8pm',
    },
    {
      name: 'The Yard',
      slug: 'the-yard',
      address: '45 Mare Street',
      postcode: 'E8 4RG',
      pickupHours: 'Mon-Fri 6am-10pm, Sat-Sun 7am-9pm',
    },
  ]
}
