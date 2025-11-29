// app/api/cron/pickup-confirm/route.js
// Runs daily to send pickup confirmation requests
// Sends confirmation request 24 hours after bag is ready
// Sends reminder 48 hours after bag is ready (if not yet confirmed)
// Uses email as fallback if WhatsApp fails

import { NextResponse } from 'next/server'
import {
  getDropsNeedingPickupConfirmation,
  getDropsNeedingPickupReminder,
  getMemberById,
  markPickupConfirmSent,
  markPickupReminderSent,
} from '@/lib/airtable'
import {
  sendPickupConfirmRequest,
  sendPickupReminder,
} from '@/lib/whatsapp'
import {
  sendPickupConfirmEmail,
  sendPickupReminderEmail,
} from '@/lib/email'

export async function GET(request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = {
      confirmationsSent: 0,
      confirmationsViaEmail: 0,
      remindersSent: 0,
      remindersViaEmail: 0,
      errors: [],
    }

    // =========================================================================
    // STEP 1: Send pickup confirmation requests (24 hours after ready)
    // =========================================================================
    
    const dropsNeedingConfirm = await getDropsNeedingPickupConfirmation()
    console.log(`📦 Found ${dropsNeedingConfirm.length} drops needing pickup confirmation`)

    for (const drop of dropsNeedingConfirm) {
      try {
        const memberLink = drop.fields['Member']
        if (!memberLink || memberLink.length === 0) continue

        const member = await getMemberById(memberLink[0])
        if (!member) continue

        const phone = member.fields['Phone Number']
        const email = member.fields['Email']
        const firstName = member.fields['First Name'] || 'there'
        const bagNumber = drop.fields['Bag Number']
        const gymName = drop.fields['Gym Name'] || member.fields['Gym']

        let sent = false

        // Try WhatsApp first
        if (phone) {
          try {
            await sendPickupConfirmRequest(phone, bagNumber, gymName)
            sent = true
            results.confirmationsSent++
            console.log(`✅ Pickup confirmation sent via WhatsApp for bag ${bagNumber}`)
          } catch (whatsappError) {
            console.error(`⚠️ WhatsApp failed for bag ${bagNumber}:`, whatsappError.message)
          }
        }

        // Fallback to email if WhatsApp failed or no phone
        if (!sent && email) {
          try {
            await sendPickupConfirmEmail(email, firstName, bagNumber, gymName)
            sent = true
            results.confirmationsViaEmail++
            console.log(`✅ Pickup confirmation sent via email for bag ${bagNumber}`)
          } catch (emailError) {
            console.error(`❌ Email also failed for bag ${bagNumber}:`, emailError.message)
          }
        }

        // Mark as sent if either channel worked
        if (sent) {
          await markPickupConfirmSent(drop.id)
        } else {
          results.errors.push({ dropId: drop.id, error: 'Both WhatsApp and email failed' })
        }

      } catch (error) {
        console.error(`❌ Error processing drop ${drop.id}:`, error.message)
        results.errors.push({ dropId: drop.id, error: error.message })
      }
    }

    // =========================================================================
    // STEP 2: Send pickup reminders (48 hours after ready, already sent confirm)
    // =========================================================================
    
    const dropsNeedingReminder = await getDropsNeedingPickupReminder()
    console.log(`📦 Found ${dropsNeedingReminder.length} drops needing pickup reminder`)

    for (const drop of dropsNeedingReminder) {
      try {
        const memberLink = drop.fields['Member']
        if (!memberLink || memberLink.length === 0) continue

        const member = await getMemberById(memberLink[0])
        if (!member) continue

        const phone = member.fields['Phone Number']
        const email = member.fields['Email']
        const firstName = member.fields['First Name'] || 'there'
        const bagNumber = drop.fields['Bag Number']
        const gymName = drop.fields['Gym Name'] || member.fields['Gym']

        let sent = false

        // Try WhatsApp first
        if (phone) {
          try {
            await sendPickupReminder(phone, bagNumber, gymName)
            sent = true
            results.remindersSent++
            console.log(`✅ Pickup reminder sent via WhatsApp for bag ${bagNumber}`)
          } catch (whatsappError) {
            console.error(`⚠️ WhatsApp failed for bag ${bagNumber}:`, whatsappError.message)
          }
        }

        // Fallback to email if WhatsApp failed or no phone
        if (!sent && email) {
          try {
            await sendPickupReminderEmail(email, firstName, bagNumber, gymName)
            sent = true
            results.remindersViaEmail++
            console.log(`✅ Pickup reminder sent via email for bag ${bagNumber}`)
          } catch (emailError) {
            console.error(`❌ Email also failed for bag ${bagNumber}:`, emailError.message)
          }
        }

        // Mark as sent if either channel worked
        if (sent) {
          await markPickupReminderSent(drop.id)
        } else {
          results.errors.push({ dropId: drop.id, error: 'Both WhatsApp and email failed' })
        }

      } catch (error) {
        console.error(`❌ Error processing drop ${drop.id}:`, error.message)
        results.errors.push({ dropId: drop.id, error: error.message })
      }
    }

    const totalConfirms = results.confirmationsSent + results.confirmationsViaEmail
    const totalReminders = results.remindersSent + results.remindersViaEmail
    console.log(`📊 Pickup confirm cron complete: ${totalConfirms} confirmations (${results.confirmationsViaEmail} via email), ${totalReminders} reminders (${results.remindersViaEmail} via email)`)

    return NextResponse.json({
      success: true,
      ...results,
    })

  } catch (error) {
    console.error('❌ Pickup confirm cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
