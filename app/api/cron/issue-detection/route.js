// app/api/cron/issue-detection/route.js
// Runs every 2 hours to detect stuck bags and other issues
// Creates tickets in Issues table and alerts ops team

import { NextResponse } from 'next/server'
import {
  getStuckDrops,
  getOverduePickups,
  createIssue,
  getMemberById,
} from '@/lib/airtable'
import {
  sendStuckBagAlertEmail,
} from '@/lib/email'

// Ops team notification (could be WhatsApp or email)
const OPS_EMAIL = process.env.OPS_ALERT_EMAIL || 'ops@flexlaundry.co.uk'

export async function GET(request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = {
      stuckDropsFound: 0,
      overduePickupsFound: 0,
      issuesCreated: 0,
      alertsSent: 0,
      errors: [],
    }

    const now = new Date()

    // =========================================================================
    // DETECT STUCK DROPS
    // =========================================================================
    // Status thresholds:
    // - Dropped: should move to "At Laundry" within 6 hours
    // - At Laundry: should move to "Ready" within 36 hours
    // - Ready: should be collected within 5 days (120 hours)

    console.log('🔍 Checking for stuck drops...')

    const stuckDrops = await getStuckDrops()
    results.stuckDropsFound = stuckDrops.length

    for (const drop of stuckDrops) {
      try {
        const bagNumber = drop.fields['Bag Number']
        const status = drop.fields['Status']
        const gymName = drop.fields['Gym Name']
        const lastUpdated = new Date(drop.fields['Last Modified'] || drop.fields['Drop Date'])
        const hoursSince = Math.round((now - lastUpdated) / (1000 * 60 * 60))

        // Determine if this needs an alert
        let needsAlert = false
        let issueType = 'Late Delivery'
        let priority = 'Medium'

        if (status === 'Dropped' && hoursSince > 6) {
          needsAlert = true
          issueType = 'Late Delivery'
          priority = hoursSince > 12 ? 'High' : 'Medium'
        } else if (status === 'At Laundry' && hoursSince > 36) {
          needsAlert = true
          issueType = 'Late Delivery'
          priority = hoursSince > 48 ? 'Urgent' : 'High'
        } else if (status === 'Ready' && hoursSince > 120) {
          needsAlert = true
          issueType = 'Missing Bag'
          priority = 'Low' // Not urgent but needs follow-up
        }

        if (needsAlert) {
          // Check if issue already exists for this drop
          const existingIssue = drop.fields['Has Open Issue']
          
          if (!existingIssue) {
            // Get member details
            const memberLink = drop.fields['Member']
            let memberName = 'Unknown'
            let memberPhone = ''
            
            if (memberLink && memberLink.length > 0) {
              const member = await getMemberById(memberLink[0])
              if (member) {
                memberName = member.fields['First Name'] || 'Unknown'
                memberPhone = member.fields['Phone Number'] || ''
              }
            }

            // Create issue ticket
            const description = `Bag ${bagNumber} stuck in "${status}" for ${hoursSince} hours.\n` +
              `Gym: ${gymName}\n` +
              `Customer: ${memberName}\n` +
              `Phone: ${memberPhone}\n` +
              `Auto-detected by system.`

            await createIssue(
              memberLink?.[0] || null,
              issueType,
              description,
              null, // no photo
              priority,
              drop.id // link to drop
            )
            
            results.issuesCreated++
            console.log(`🎫 Created ${issueType} ticket for bag ${bagNumber}`)

            // Send alert email to ops
            await sendStuckBagAlertEmail(OPS_EMAIL, bagNumber, gymName, status, hoursSince, memberName)
            results.alertsSent++
          }
        }

      } catch (error) {
        console.error(`❌ Error processing drop ${drop.id}:`, error.message)
        results.errors.push({ dropId: drop.id, error: error.message })
      }
    }

    // =========================================================================
    // DETECT OVERDUE PICKUPS (Ready > 5 days, no confirmation)
    // =========================================================================

    console.log('🔍 Checking for overdue pickups...')

    const overduePickups = await getOverduePickups()
    results.overduePickupsFound = overduePickups.length

    for (const drop of overduePickups) {
      try {
        const bagNumber = drop.fields['Bag Number']
        const gymName = drop.fields['Gym Name']
        const readyDate = new Date(drop.fields['Ready Date'])
        const daysSinceReady = Math.round((now - readyDate) / (1000 * 60 * 60 * 24))

        // Only alert if no issue already exists
        const existingIssue = drop.fields['Has Open Issue']
        
        if (!existingIssue && daysSinceReady > 5) {
          const memberLink = drop.fields['Member']
          let memberName = 'Unknown'
          
          if (memberLink && memberLink.length > 0) {
            const member = await getMemberById(memberLink[0])
            if (member) {
              memberName = member.fields['First Name'] || 'Unknown'
            }
          }

          const description = `Bag ${bagNumber} ready for pickup for ${daysSinceReady} days.\n` +
            `Gym: ${gymName}\n` +
            `Customer: ${memberName}\n` +
            `Customer may have forgotten or there may be an issue.\n` +
            `Auto-detected by system.`

          await createIssue(
            memberLink?.[0] || null,
            'Missing Bag',
            description,
            null,
            'Low',
            drop.id
          )
          
          results.issuesCreated++
          console.log(`🎫 Created overdue pickup ticket for bag ${bagNumber}`)
        }

      } catch (error) {
        console.error(`❌ Error processing overdue pickup ${drop.id}:`, error.message)
        results.errors.push({ dropId: drop.id, error: error.message })
      }
    }

    console.log(`📊 Issue detection complete: ${results.stuckDropsFound} stuck, ${results.overduePickupsFound} overdue, ${results.issuesCreated} tickets created`)

    return NextResponse.json({
      success: true,
      ...results,
    })

  } catch (error) {
    console.error('❌ Issue detection cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
