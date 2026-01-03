// app/api/register-interest/route.js
// Handle gym interest registration when user's gym isn't available

import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function POST(request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, gymName, location } = body

    // Validate required fields
    if (!firstName || !email || !gymName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Store in Airtable if configured
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Gym%20Interest`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                'First Name': firstName,
                'Last Name': lastName || '',
                'Email': email,
                'Phone': phone || '',
                'Gym Name': gymName,
                'Location': location || '',
                'Status': 'New',
                'Created At': new Date().toISOString(),
              },
            }),
          }
        )

        if (!response.ok) {
          console.error('Airtable error:', await response.text())
        }
      } catch (airtableError) {
        console.error('Airtable storage error:', airtableError)
        // Continue - we'll still return success to user
      }
    }

    // Log to console for debugging
    console.log('Gym interest registered:', {
      firstName,
      lastName,
      email,
      gymName,
      location,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ 
      success: true,
      message: 'Interest registered successfully'
    })
  } catch (error) {
    console.error('Register interest error:', error)
    return NextResponse.json(
      { error: 'Failed to register interest' },
      { status: 500 }
    )
  }
}
