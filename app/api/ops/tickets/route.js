// app/api/ops/tickets/route.js
// Get tickets list for ops dashboard
// ADDITIVE - works with existing ops auth

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

// Use existing ops auth pattern
async function checkOpsAuth() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('flex_ops_auth')
  return authCookie?.value === process.env.OPS_AUTH_TOKEN
}

export async function GET(request) {
  if (!await checkOpsAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'open'

  // Build filter
  let formula = ''
  switch (status) {
    case 'open':
      formula = "{Status} = 'Open'"
      break
    case 'in-progress':
      formula = "{Status} = 'In Progress'"
      break
    case 'resolved':
      formula = "OR({Status} = 'Resolved', {Status} = 'Closed')"
      break
    case 'all':
    default:
      formula = ''
  }

  try {
    const params = new URLSearchParams()
    if (formula) params.append('filterByFormula', formula)
    params.append('sort[0][field]', 'Created At')
    params.append('sort[0][direction]', 'desc')
    params.append('maxRecords', '100')

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Issues?${params}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    })

    const data = await response.json()

    const tickets = (data.records || []).map(t => ({
      id: t.id,
      ticketId: t.fields['Ticket ID'],
      type: t.fields['Type'],
      description: t.fields['Description'],
      status: t.fields['Status'],
      priority: t.fields['Priority'],
      memberName: t.fields['Member Name']?.[0] || 'Unknown',
      memberPhone: t.fields['Member Phone']?.[0] || '',
      createdAt: t.fields['Created At'],
    }))

    return NextResponse.json({ tickets })

  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json({ error: 'Failed to get tickets' }, { status: 500 })
  }
}
