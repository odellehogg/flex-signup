// app/api/register-interest/route.js
// Save gym interest leads to Airtable for BD outreach

import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FLEX_TEAM_EMAIL = process.env.FLEX_TEAM_EMAIL || 'hello@flexlaundry.co.uk'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, phone, gymName, location } = body

    if (!email || !gymName) {
      return NextResponse.json({ error: 'Email and gym name are required' }, { status: 400 })
    }

    // Save to Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Gym%20Interest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                'Email': email,
                'First Name': firstName || '',
                'Last Name': lastName || '',
                'Phone Number': phone || '',
                'Gym Name': gymName,
                'Location': location || '',
                'Status': 'New',
                'Source': 'Website Signup',
                'Created': new Date().toISOString(),
              },
            },
          ],
        }),
      }
    )

    if (!airtableResponse.ok) {
      console.error('Airtable error:', await airtableResponse.text())
    }

    // Send confirmation email to user
    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'FLEX <noreply@flexlaundry.co.uk>',
            to: email,
            subject: `We're working on bringing FLEX to ${gymName}!`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a2e;">Thanks for your interest, ${firstName || 'there'}!</h2>
                <p>We've noted that you'd like FLEX at <strong>${gymName}</strong>.</p>
                <p>We're actively expanding and will let you know as soon as we partner with your gym.</p>
                <p>In the meantime, if you know the gym manager, let them know about FLEX! It might speed things up 😊</p>
                <p>They can learn more at <a href="https://flexlaundry.co.uk/partners">flexlaundry.co.uk/partners</a></p>
                <br>
                <p>— The FLEX Team</p>
              </div>
            `,
          }),
        })
      } catch (emailError) {
        console.error('Email error:', emailError)
      }

      // Send notification to FLEX team
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'FLEX System <noreply@flexlaundry.co.uk>',
            to: FLEX_TEAM_EMAIL,
            subject: `New Gym Interest: ${gymName}`,
            html: `
              <div style="font-family: sans-serif;">
                <h2>New Gym Interest Lead</h2>
                <p><strong>Gym:</strong> ${gymName}</p>
                <p><strong>Location:</strong> ${location || 'Not provided'}</p>
                <p><strong>Contact:</strong> ${firstName || ''} ${lastName || ''}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <br>
                <p><a href="https://airtable.com/${AIRTABLE_BASE_ID}">View in Airtable →</a></p>
              </div>
            `,
          }),
        })
      } catch (teamEmailError) {
        console.error('Team email error:', teamEmailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Register interest error:', error)
    return NextResponse.json({ error: 'Failed to register interest' }, { status: 500 })
  }
}
