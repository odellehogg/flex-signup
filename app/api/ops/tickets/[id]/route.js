// app/api/ops/tickets/[id]/route.js
// Get and update individual ticket with WhatsApp notification
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

// ============================================================================
// GET - Get ticket details
// ============================================================================

export async function GET(request, { params }) {
  if (!await checkOpsAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get ticket
    const ticketResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Issues/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    )

    if (!ticketResponse.ok) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ticket = await ticketResponse.json()
    const fields = ticket.fields

    // Get member details if linked
    let memberDetails = {}
    const memberId = fields['Member']?.[0]
    
    if (memberId) {
      const memberResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${memberId}`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      )
      
      if (memberResponse.ok) {
        const member = await memberResponse.json()
        memberDetails = {
          memberId: memberId,
          memberName: `${member.fields['First Name'] || ''} ${member.fields['Last Name'] || ''}`.trim() || 'Unknown',
          memberPhone: member.fields['Phone'] || member.fields['Phone Number'] || '',
          memberEmail: member.fields['Email'] || '',
          memberPlan: member.fields['Subscription Tier'] || member.fields['Plan'] || 'Unknown',
          memberGym: member.fields['Gym Name']?.[0] || member.fields['Gym'] || 'Unknown',
        }
      }
    }

    return NextResponse.json({
      id: ticket.id,
      ticketId: fields['Ticket ID'],
      type: fields['Type'],
      description: fields['Description'],
      status: fields['Status'],
      priority: fields['Priority'],
      source: fields['Source'],
      createdAt: fields['Created At'],
      updatedAt: fields['Updated At'],
      internalNotes: fields['Internal Notes'],
      attachments: fields['Attachments'] || [],
      ...memberDetails,
    })

  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json({ error: 'Failed to get ticket' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update ticket status (triggers WhatsApp notification)
// ============================================================================

export async function PATCH(request, { params }) {
  if (!await checkOpsAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { status, internalNote, priority } = await request.json()

  try {
    // Get current ticket to find member
    const ticketResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Issues/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    )

    if (!ticketResponse.ok) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ticket = await ticketResponse.json()
    const oldStatus = ticket.fields['Status']
    const memberId = ticket.fields['Member']?.[0]
    const ticketIdStr = ticket.fields['Ticket ID']

    // Build update fields
    const updateFields = {
      'Updated At': new Date().toISOString(),
    }

    if (status) {
      updateFields['Status'] = status
    }

    if (priority) {
      updateFields['Priority'] = priority
    }

    if (internalNote) {
      const existingNotes = ticket.fields['Internal Notes'] || ''
      const timestamp = new Date().toLocaleString('en-GB')
      updateFields['Internal Notes'] = existingNotes 
        ? `${existingNotes}\n\n[${timestamp}]\n${internalNote}`
        : `[${timestamp}]\n${internalNote}`
    }

    // Update ticket
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Issues/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: updateFields }),
      }
    )

    if (!updateResponse.ok) {
      throw new Error('Failed to update ticket')
    }

    // Send WhatsApp notification if status changed to certain states
    let notificationSent = false
    
    if (status && status !== oldStatus && memberId) {
      const shouldNotify = ['In Progress', 'Awaiting Info', 'Resolved'].includes(status)
      
      if (shouldNotify) {
        notificationSent = await sendStatusNotification(memberId, ticketIdStr, status)
      }
    }

    return NextResponse.json({
      success: true,
      notificationSent,
    })

  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}

// ============================================================================
// SEND WHATSAPP NOTIFICATION
// ============================================================================

async function sendStatusNotification(memberId, ticketId, newStatus) {
  try {
    // Get member phone
    const memberResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${memberId}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    )

    if (!memberResponse.ok) return false

    const member = await memberResponse.json()
    const phone = member.fields['Phone'] || member.fields['Phone Number']
    const firstName = member.fields['First Name'] || 'there'

    if (!phone) return false

    // Build message based on status
    let message = ''
    
    switch (newStatus) {
      case 'In Progress':
        message = 
          `Hey ${firstName}! 👋\n\n` +
          `Update on your ticket ${ticketId}:\n\n` +
          `We're now working on this. We'll get back to you soon.\n\n` +
          `Reply MENU for options.`
        break
        
      case 'Awaiting Info':
        message = 
          `Hey ${firstName}! 📬\n\n` +
          `We need more info on ticket ${ticketId}.\n\n` +
          `Please check your email and reply there, or message us here with more details.\n\n` +
          `Reply MENU for options.`
        break
        
      case 'Resolved':
        message = 
          `Hey ${firstName}! ✅\n\n` +
          `Good news - ticket ${ticketId} has been resolved!\n\n` +
          `If you have any other issues, reply HELP.\n\n` +
          `Reply MENU for options.`
        break
        
      default:
        return false
    }

    // Send via Twilio
    const { sendPlainText } = await import('@/lib/whatsapp')
    await sendPlainText(phone, message)
    
    console.log(`✅ Ticket notification sent to ${phone} for ${ticketId} → ${newStatus}`)
    return true
    
  } catch (error) {
    console.error('Failed to send status notification:', error)
    return false
  }
}
