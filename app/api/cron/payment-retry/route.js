// app/api/cron/payment-retry/route.js
// Runs daily to send payment retry reminders
// Day 3: First reminder after payment failure
// Day 7: Final warning before service pause

import { NextResponse } from 'next/server'
import {
  getMembersWithPaymentIssues,
  updateMember,
} from '@/lib/airtable'
import {
  sendPaymentRetryDay3,
  sendPaymentRetryDay7,
} from '@/lib/whatsapp'
import {
  sendPaymentRetryDay3Email,
  sendPaymentRetryDay7Email,
} from '@/lib/email'
import { pauseSubscription } from '@/lib/stripe-helpers'

export async function GET(request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = {
      day3RemindersSent: 0,
      day7RemindersSent: 0,
      subscriptionsPaused: 0,
      errors: [],
    }

    const now = new Date()

    // Get all members with payment issues
    const membersWithIssues = await getMembersWithPaymentIssues()
    
    console.log(`💳 Found ${membersWithIssues.length} members with payment issues`)

    for (const member of membersWithIssues) {
      try {
        const memberId = member.id
        const firstName = member.fields['First Name'] || 'there'
        const phone = member.fields['Phone Number']
        const email = member.fields['Email']
        const stripeSubId = member.fields['Stripe Subscription ID']
        const paymentFailedDate = member.fields['Payment Failed Date']
        const day3Sent = member.fields['Day 3 Reminder Sent']
        const day7Sent = member.fields['Day 7 Reminder Sent']
        
        if (!paymentFailedDate) continue

        const failedDate = new Date(paymentFailedDate)
        const daysSinceFailed = Math.round((now - failedDate) / (1000 * 60 * 60 * 24))

        // Construct payment update URL
        const updateUrl = `https://flexlaundry.co.uk/member/billing?id=${memberId}`

        // Day 3 reminder
        if (daysSinceFailed >= 3 && daysSinceFailed < 7 && !day3Sent) {
          let sent = false
          
          // Try WhatsApp first
          if (phone) {
            try {
              await sendPaymentRetryDay3(phone, firstName, updateUrl)
              sent = true
            } catch (whatsappError) {
              console.error(`⚠️ WhatsApp Day 3 failed for ${memberId}:`, whatsappError.message)
            }
          }

          // Fallback to email
          if (!sent && email) {
            try {
              await sendPaymentRetryDay3Email(email, firstName, updateUrl)
              sent = true
            } catch (emailError) {
              console.error(`❌ Email Day 3 also failed for ${memberId}:`, emailError.message)
            }
          }

          if (sent) {
            await updateMember(memberId, { 'Day 3 Reminder Sent': true })
            results.day3RemindersSent++
            console.log(`📨 Day 3 reminder sent to ${firstName}`)
          }
        }

        // Day 7 reminder (final warning)
        if (daysSinceFailed >= 7 && daysSinceFailed < 10 && !day7Sent) {
          let sent = false
          
          // Try WhatsApp first
          if (phone) {
            try {
              await sendPaymentRetryDay7(phone, firstName, updateUrl)
              sent = true
            } catch (whatsappError) {
              console.error(`⚠️ WhatsApp Day 7 failed for ${memberId}:`, whatsappError.message)
            }
          }

          // Fallback to email
          if (!sent && email) {
            try {
              await sendPaymentRetryDay7Email(email, firstName, updateUrl)
              sent = true
            } catch (emailError) {
              console.error(`❌ Email Day 7 also failed for ${memberId}:`, emailError.message)
            }
          }

          if (sent) {
            await updateMember(memberId, { 'Day 7 Reminder Sent': true })
            results.day7RemindersSent++
            console.log(`📨 Day 7 final warning sent to ${firstName}`)
          }
        }

        // Day 10: Auto-pause subscription
        if (daysSinceFailed >= 10 && stripeSubId) {
          const status = member.fields['Status']
          
          // Only pause if still in "Past Due" status (not already paused/cancelled)
          if (status === 'Past Due') {
            try {
              // Pause for 30 days (they can resume when payment is fixed)
              await pauseSubscription(stripeSubId, 30)
              await updateMember(memberId, { 
                'Status': 'Paused',
                'Pause Reason': 'Payment failure - auto-paused after 10 days'
              })
              results.subscriptionsPaused++
              console.log(`⏸️ Subscription paused for ${firstName} due to payment failure`)
            } catch (pauseError) {
              console.error(`❌ Failed to pause subscription for ${memberId}:`, pauseError.message)
              results.errors.push({ memberId, error: pauseError.message })
            }
          }
        }

      } catch (error) {
        console.error(`❌ Error processing member ${member.id}:`, error.message)
        results.errors.push({ memberId: member.id, error: error.message })
      }
    }

    console.log(`📊 Payment retry cron complete: ${results.day3RemindersSent} Day 3, ${results.day7RemindersSent} Day 7, ${results.subscriptionsPaused} paused`)

    return NextResponse.json({
      success: true,
      ...results,
    })

  } catch (error) {
    console.error('❌ Payment retry cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
