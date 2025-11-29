// app/api/member/send-login-link/route.js
// Send WhatsApp login link to member

import { NextResponse } from 'next/server'
import { getMemberByPhone, updateMember } from '@/lib/airtable'
import crypto from 'crypto'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+447366907286'

export async function POST(request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    }

    // Normalize phone
    let normalizedPhone = phone.replace(/\s/g, '')
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+44' + normalizedPhone.slice(1)
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+44' + normalizedPhone
    }

    // Find member
    const member = await getMemberByPhone(normalizedPhone)

    if (!member) {
      return NextResponse.json({ error: 'No account found with this number' }, { status: 404 })
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    // Save token to member record
    await updateMember(member.id, {
      'Login Token': token,
      'Token Expiry': tokenExpiry,
    })

    // Build login URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://flexlaundry.co.uk'
    const loginUrl = `${baseUrl}/member/dashboard?token=${token}`

    // Send WhatsApp message
    const firstName = member.fields['First Name'] || 'there'
    const message = `Hey ${firstName}! 👋\n\nHere's your FLEX login link:\n\n${loginUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, just ignore it.`

    const formData = new URLSearchParams({
      To: `whatsapp:${normalizedPhone}`,
      From: TWILIO_WHATSAPP_NUMBER,
      Body: message,
    })

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    )

    if (!twilioRes.ok) {
      console.error('WhatsApp send failed:', await twilioRes.text())
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send login link error:', error)
    return NextResponse.json({ error: 'Failed to send login link' }, { status: 500 })
  }
}
