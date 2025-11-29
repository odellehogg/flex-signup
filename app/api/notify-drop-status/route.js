// app/api/notify-drop-status/route.js
// Called by Airtable automation when drop status changes

import { NextResponse } from 'next/server'
import { getMemberById } from '@/lib/airtable'
import { sendDropConfirmed, sendReadyPickup, sendPickupConfirmed } from '@/lib/whatsapp'
import { sendDropConfirmationEmail, sendReadyForPickupEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { bagNumber, status, memberId } = await request.json()

    console.log(`📦 Status update: ${bagNumber} → ${status}`)

    if (!bagNumber || !status) {
      return NextResponse.json({ error: 'Missing bagNumber or status' }, { status: 400 })
    }

    // Get member details
    const member = await getMemberById(memberId)
    if (!member) {
      console.log(`Member not found: ${memberId}`)
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const phone = member.fields['Phone Number']
    const email = member.fields['Email']
    const firstName = member.fields['First Name'] || 'there'
    const gymName = member.fields['Gym'] || 'your gym'

    if (!phone) {
      console.log(`No phone number for member: ${memberId}`)
      return NextResponse.json({ error: 'No phone number' }, { status: 400 })
    }

    // Format gym name for display
    const formattedGymName = formatGymName(gymName)

    // Send appropriate message based on status
    switch (status) {
      case 'Dropped': {
        const expectedDate = new Date()
        expectedDate.setHours(expectedDate.getHours() + 48)
        const formatted = expectedDate.toLocaleDateString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short'
        })
        
        // WhatsApp notification
        await sendDropConfirmed(phone, bagNumber, formattedGymName, formatted)
        
        // Email backup
        if (email) {
          await sendDropConfirmationEmail(email, firstName, bagNumber, formattedGymName, formatted)
        }
        
        console.log(`✅ Drop confirmed notifications sent for ${bagNumber}`)
        break
      }

      case 'At Laundry': {
        // Silent status - no notification needed
        console.log(`📦 ${bagNumber} now at laundry - no notification`)
        break
      }

      case 'Ready': {
        const availableUntil = new Date()
        availableUntil.setDate(availableUntil.getDate() + 7)
        const formatted = availableUntil.toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long'
        })
        
        // WhatsApp notification
        await sendReadyPickup(phone, bagNumber, formattedGymName, formatted)
        
        // Email backup
        if (email) {
          await sendReadyForPickupEmail(email, firstName, bagNumber, formattedGymName)
        }
        
        console.log(`✅ Ready for pickup notifications sent for ${bagNumber}`)
        break
      }

      case 'Picked Up': {
        // Send feedback request
        await sendPickupConfirmed(phone)
        console.log(`✅ Pickup confirmed & feedback request sent for ${bagNumber}`)
        break
      }

      case 'Cancelled': {
        // Silent status
        console.log(`🚫 ${bagNumber} cancelled - no notification`)
        break
      }

      default:
        console.log(`Unknown status: ${status}`)
    }

    return NextResponse.json({ success: true, status })

  } catch (error) {
    console.error('❌ Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function formatGymName(slug) {
  const names = {
    'east-london-fitness': 'East London Fitness',
    'the-yard': 'The Yard',
    'crossfit-hackney': 'CrossFit Hackney',
  }
  return names[slug] || slug
}
