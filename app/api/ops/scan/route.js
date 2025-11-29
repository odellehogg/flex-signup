// app/api/ops/scan/route.js
// Bag scan checkpoint for ops team
// Tracks: pickup from gym, arrival at laundry, departure from laundry, return to gym

import { NextResponse } from 'next/server'
import {
  getDropByBagNumber,
  updateDropStatus,
  updateDropScanLog,
  getMemberById,
} from '@/lib/airtable'
import {
  sendReadyPickup,
} from '@/lib/whatsapp'
import {
  sendReadyForPickupEmail,
} from '@/lib/email'

// Valid scan types
const SCAN_TYPES = {
  PICKUP_FROM_GYM: 'pickup_from_gym',      // Driver picks up from gym
  ARRIVE_AT_LAUNDRY: 'arrive_at_laundry',  // Bag arrives at laundry partner
  LEAVE_LAUNDRY: 'leave_laundry',          // Bag leaves laundry (cleaned)
  RETURN_TO_GYM: 'return_to_gym',          // Bag returned to gym reception
}

// Status transitions based on scan type
const STATUS_TRANSITIONS = {
  [SCAN_TYPES.PICKUP_FROM_GYM]: 'At Laundry',
  [SCAN_TYPES.ARRIVE_AT_LAUNDRY]: 'At Laundry',
  [SCAN_TYPES.LEAVE_LAUNDRY]: 'At Laundry',  // Still "At Laundry" until back at gym
  [SCAN_TYPES.RETURN_TO_GYM]: 'Ready',
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { bagNumber, scanType, operatorId, notes } = body

    // Validate required fields
    if (!bagNumber || !scanType) {
      return NextResponse.json(
        { error: 'Missing required fields: bagNumber, scanType' },
        { status: 400 }
      )
    }

    // Validate scan type
    if (!Object.values(SCAN_TYPES).includes(scanType)) {
      return NextResponse.json(
        { error: `Invalid scanType. Valid types: ${Object.values(SCAN_TYPES).join(', ')}` },
        { status: 400 }
      )
    }

    // Find the drop by bag number
    const drop = await getDropByBagNumber(bagNumber.toUpperCase())
    
    if (!drop) {
      return NextResponse.json(
        { error: `Bag ${bagNumber} not found` },
        { status: 404 }
      )
    }

    const dropId = drop.id
    const currentStatus = drop.fields['Status']
    const gymName = drop.fields['Gym Name']

    // Determine new status
    const newStatus = STATUS_TRANSITIONS[scanType]

    // Log the scan
    const scanLog = {
      timestamp: new Date().toISOString(),
      scanType,
      operatorId: operatorId || 'unknown',
      notes: notes || '',
      previousStatus: currentStatus,
      newStatus,
    }

    // Update the drop with new status and scan log
    await updateDropScanLog(dropId, scanLog)
    
    // Only update status if it's a forward transition
    const statusOrder = ['Dropped', 'At Laundry', 'Ready', 'Collected']
    const currentIndex = statusOrder.indexOf(currentStatus)
    const newIndex = statusOrder.indexOf(newStatus)
    
    if (newIndex > currentIndex) {
      await updateDropStatus(dropId, newStatus)
    }

    // If bag is now Ready, notify the customer
    if (newStatus === 'Ready' && scanType === SCAN_TYPES.RETURN_TO_GYM) {
      const memberLink = drop.fields['Member']
      
      if (memberLink && memberLink.length > 0) {
        const member = await getMemberById(memberLink[0])
        
        if (member) {
          const phone = member.fields['Phone Number']
          const email = member.fields['Email']
          const firstName = member.fields['First Name'] || 'there'
          
          // Calculate available until (5 days from now)
          const availableUntil = new Date()
          availableUntil.setDate(availableUntil.getDate() + 5)
          const formattedDate = availableUntil.toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short'
          })

          // Try WhatsApp first
          let notified = false
          if (phone) {
            try {
              await sendReadyPickup(phone, bagNumber, gymName, formattedDate)
              notified = true
              console.log(`✅ Ready notification sent via WhatsApp to ${phone}`)
            } catch (whatsappError) {
              console.error(`⚠️ WhatsApp notification failed:`, whatsappError.message)
            }
          }

          // Fallback to email
          if (!notified && email) {
            try {
              await sendReadyForPickupEmail(email, firstName, bagNumber, gymName)
              console.log(`✅ Ready notification sent via email to ${email}`)
            } catch (emailError) {
              console.error(`❌ Email notification also failed:`, emailError.message)
            }
          }
        }
      }
    }

    console.log(`📦 Bag ${bagNumber} scanned: ${scanType} (${currentStatus} → ${newStatus})`)

    return NextResponse.json({
      success: true,
      bagNumber,
      scanType,
      previousStatus: currentStatus,
      newStatus,
      timestamp: scanLog.timestamp,
    })

  } catch (error) {
    console.error('Bag scan error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET endpoint to check bag status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const bagNumber = searchParams.get('bagNumber')

    if (!bagNumber) {
      return NextResponse.json(
        { error: 'Missing bagNumber parameter' },
        { status: 400 }
      )
    }

    const drop = await getDropByBagNumber(bagNumber.toUpperCase())
    
    if (!drop) {
      return NextResponse.json(
        { error: `Bag ${bagNumber} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      bagNumber: drop.fields['Bag Number'],
      status: drop.fields['Status'],
      gymName: drop.fields['Gym Name'],
      dropDate: drop.fields['Drop Date'],
      readyDate: drop.fields['Ready Date'],
      scanLog: drop.fields['Scan Log'] || [],
    })

  } catch (error) {
    console.error('Bag lookup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
