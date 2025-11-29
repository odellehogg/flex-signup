// app/api/cron/reengagement/route.js
// Daily cron job to send re-engagement messages to inactive members
// Schedule: Daily at 10:00 AM
// Vercel Cron: 0 10 * * *

import { NextResponse } from 'next/server'
import { getInactiveMembers, getMemberDropsThisMonth } from '@/lib/airtable'
import { sendReengagement } from '@/lib/whatsapp'

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🔄 Starting re-engagement cron job...')

    // Get members inactive for 14+ days
    const inactiveMembers = await getInactiveMembers(14)
    console.log(`Found ${inactiveMembers.length} inactive members`)

    let sent = 0
    let errors = 0

    for (const member of inactiveMembers) {
      try {
        const phone = member.fields['Phone Number']
        const firstName = member.fields['First Name'] || 'there'
        const plan = member.fields['Subscription Tier'] || 'Essential'

        if (!phone) continue

        // Calculate drops remaining
        const dropsUsed = await getMemberDropsThisMonth(member.id)
        const totalDrops = plan === 'Unlimited' ? 16 : (plan === 'Essential' ? 10 : 0)
        const dropsRemaining = Math.max(0, totalDrops - dropsUsed)

        // Calculate expiry date (end of current billing period)
        const signupDate = member.fields['Signup Date']
        const expiryDate = getNextBillingDate(signupDate)

        await sendReengagement(phone, firstName, dropsRemaining, expiryDate)
        sent++

        // Rate limit: 500ms between messages
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`Error for member ${member.id}:`, error.message)
        errors++
      }
    }

    console.log(`✅ Re-engagement complete: ${sent} sent, ${errors} errors`)

    return NextResponse.json({
      success: true,
      processed: inactiveMembers.length,
      sent,
      errors,
    })

  } catch (error) {
    console.error('❌ Cron job failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getNextBillingDate(signupDate) {
  if (!signupDate) return 'your next billing date'

  const signup = new Date(signupDate)
  const now = new Date()
  const dayOfMonth = signup.getDate()

  let billing = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
  if (billing <= now) {
    billing.setMonth(billing.getMonth() + 1)
  }

  return billing.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
