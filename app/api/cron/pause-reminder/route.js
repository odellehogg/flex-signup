// app/api/cron/pause-reminder/route.js
// Daily cron job to remind members their pause is ending soon
// Schedule: Daily at 10:00 AM
// Vercel Cron: 0 10 * * *

import { NextResponse } from 'next/server'
import { sendPauseReminder } from '@/lib/whatsapp'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🔄 Starting pause reminder cron job...')

    // Get members with pause ending in 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const targetDate = threeDaysFromNow.toISOString().split('T')[0]

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?filterByFormula=AND({Status}='Paused', {Pause Resume Date}='${targetDate}')`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    )

    const data = await response.json()
    const members = data.records || []
    console.log(`Found ${members.length} members with pause ending in 3 days`)

    let sent = 0
    let errors = 0

    for (const member of members) {
      try {
        const phone = member.fields['Phone Number']
        const firstName = member.fields['First Name'] || 'there'
        const resumeDate = member.fields['Pause Resume Date']

        if (!phone) continue

        const formattedDate = new Date(resumeDate).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })

        await sendPauseReminder(phone, firstName, formattedDate)
        sent++

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`Error for member ${member.id}:`, error.message)
        errors++
      }
    }

    console.log(`✅ Pause reminder complete: ${sent} sent, ${errors} errors`)

    return NextResponse.json({
      success: true,
      processed: members.length,
      sent,
      errors,
    })

  } catch (error) {
    console.error('❌ Cron job failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
