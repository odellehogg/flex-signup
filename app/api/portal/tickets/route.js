// app/api/portal/tickets/route.js
// Get member's support tickets

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMemberTickets } from '@/lib/airtable'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const tickets = await getMemberTickets(session.memberId)

    return NextResponse.json({
      tickets: tickets.map(t => ({
        id: t.id,
        ticketId: t.fields['Ticket ID'],
        type: t.fields['Type'],
        description: t.fields['Description'],
        status: t.fields['Status'],
        priority: t.fields['Priority'],
        createdAt: t.fields['Created At'],
        updatedAt: t.fields['Updated At'],
        hasAttachment: t.fields['Attachments']?.length > 0,
      })),
    })

  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json({ error: 'Failed to get tickets' }, { status: 500 })
  }
}
