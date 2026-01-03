// app/api/member/tickets/route.js
// Get member's support tickets
// Self-contained - uses same token auth pattern as existing member portal

import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

// ============================================================================
// Helper: Get member by token
// ============================================================================

async function getMemberByToken(token) {
  const formula = encodeURIComponent(`{Login Token} = '${token}'`)
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?filterByFormula=${formula}&maxRecords=1`
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
  })
  
  const data = await response.json()
  
  if (!data.records || data.records.length === 0) return null
  
  const member = data.records[0]
  const expiry = member.fields['Token Expiry']
  if (expiry && new Date(expiry) < new Date()) return null
  
  return member
}

// ============================================================================
// GET - Get member's tickets
// ============================================================================

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 })
  }

  const member = await getMemberByToken(token)
  if (!member) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  try {
    // Get tickets linked to this member
    const formula = encodeURIComponent(`FIND('${member.id}', ARRAYJOIN({Member}))`)
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Issues?filterByFormula=${formula}&sort%5B0%5D%5Bfield%5D=Created%20At&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=20`

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    })

    const data = await response.json()

    const tickets = (data.records || []).map(t => ({
      id: t.id,
      ticketId: t.fields['Ticket ID'],
      type: t.fields['Type'],
      description: t.fields['Description'],
      status: t.fields['Status'],
      createdAt: t.fields['Created At'],
      updatedAt: t.fields['Updated At'],
    }))

    // Count open tickets
    const openCount = tickets.filter(t => 
      t.status === 'Open' || t.status === 'In Progress'
    ).length

    return NextResponse.json({ 
      tickets,
      openCount,
    })
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json({ error: 'Failed to get tickets' }, { status: 500 })
  }
}
