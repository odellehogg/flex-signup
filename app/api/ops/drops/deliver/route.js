// app/api/ops/drops/deliver/route.js
// Mark drops as delivered and notify customers

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { updateDropStatus, updateDropScanLog, getMemberById } from '@/lib/airtable'
import { sendReadyPickup } from '@/lib/whatsapp'
import { sendReadyForPickupEmail } from '@/lib/email'

export async function POST(request) {
  // Verify auth
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('flex_ops_auth')
  if (!authCookie || authCookie.value !== process.env.OPS_AUTH_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { dropIds, gymName } = await request.json()

    if (!dropIds || !Array.isArray(dropIds) || dropIds.length === 0) {
      return NextResponse.json({ error: 'No drops specified' }, { status: 400 })
    }

    const results = []
    const errors = []
    let notificationsSent = 0

    for (const dropId of dropIds) {
      try {
        // Get drop details first to get member info
        const drop = await fetch(
          `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Drops/${dropId}`,
          {
            headers: { 'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}` }
          }
        ).then(r => r.json())

        const memberId = drop.fields?.['Member']?.[0]
        const bagNumber = drop.fields?.['Bag Number']
        const dropGym = drop.fields?.['Gym'] || gymName

        // Update status to Ready
        await updateDropStatus(dropId, 'Ready')

        // Add scan log entry
        const scanEntry = {
          timestamp: new Date().toISOString(),
          action: 'return_to_gym',
          newStatus: 'Ready',
          operator: 'ops_dashboard',
          gym: dropGym,
        }
        await updateDropScanLog(dropId, scanEntry)

        // Notify customer
        if (memberId) {
          try {
            const member = await getMemberById(memberId)
            const phone = member.fields?.['Phone']
            const firstName = member.fields?.['First Name'] || 'there'
            const email = member.fields?.['Email']

            // Try WhatsApp first
            try {
              await sendReadyPickup(phone, firstName, bagNumber, dropGym)
              notificationsSent++
            } catch (waError) {
              console.log(`WhatsApp failed for ${phone}, trying email`)
              // Fallback to email
              if (email) {
                await sendReadyForPickupEmail(email, firstName, bagNumber, dropGym)
                notificationsSent++
              }
            }
          } catch (notifyError) {
            console.error(`Failed to notify member ${memberId}:`, notifyError)
          }
        }

        results.push({ dropId, success: true })
      } catch (error) {
        console.error(`Failed to deliver drop ${dropId}:`, error)
        errors.push({ dropId, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      delivered: results.length,
      notificationsSent,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Delivery error:', error)
    return NextResponse.json({ error: 'Failed to mark as delivered' }, { status: 500 })
  }
}
