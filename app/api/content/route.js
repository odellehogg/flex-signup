// app/api/content/route.js
// Fetch page content from Airtable CMS

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
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Page%20Content?${params}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      return NextResponse.json({})
    }

    const data = await response.json()

    const content = {}
    for (const record of data.records) {
      const key = record.fields['Key']
      const value = record.fields['Value']
      const isActive = record.fields['Is Active'] !== false
      
      if (key && isActive) {
        content[key] = value
      }
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json({})
  }
}
