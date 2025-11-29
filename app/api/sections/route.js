// app/api/sections/route.js
// Fetch page sections from Airtable CMS
// Allows showing/hiding entire sections of a page

import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page')
  
  try {
    const filterFormula = page 
      ? `{Page} = '${page}'`
      : 'TRUE()'
    
    const params = new URLSearchParams({
      filterByFormula: filterFormula,
      sort: JSON.stringify([{ field: 'Sort Order', direction: 'asc' }]),
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Page%20Sections?${params}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      return NextResponse.json(null)
    }

    const data = await response.json()

    const sections = data.records.map(r => ({
      id: r.fields['Section ID'],
      title: r.fields['Title'] || '',
      isActive: r.fields['Is Active'] !== false,
      sortOrder: r.fields['Sort Order'] || 0,
    }))

    return NextResponse.json(sections)
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json(null)
  }
}
