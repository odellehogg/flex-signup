// app/api/member/gym/route.js
// Change gym location
// Self-contained - uses same token auth pattern as existing member portal

import { NextResponse } from 'next/server'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

// ============================================================================
// Helper: Get member by token
// ============================================================================

async function getMemberByToken(token) {
  const formula = encodeURIComponent(`{Login Token} = '${token}'`)
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?filterByFormula=${formula}&maxRecords=1`
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
  })
  
  const data = await response.json()
  
  if (!data.records || data.records.length === 0) return null
  
  const member = data.records[0]
  const expiry = member.fields['Token Expiry']
  if (expiry && new Date(expiry) < new Date()) return null
  
  return member
}

// ============================================================================
// Helper: Send WhatsApp
// ============================================================================

async function sendWhatsApp(phone, message) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
  const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+447366907286'

  const formData = new URLSearchParams({
    To: phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`,
    From: TWILIO_WHATSAPP_NUMBER,
    Body: message,
  })

  await fetch(
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
}

// ============================================================================
// GET - Get available gyms
// ============================================================================

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 })
  }

  const member = await getMemberByToken(token)
  if (!member) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  try {
    // Get all active gyms
    const gymsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Gyms?filterByFormula=${encodeURIComponent("{Status} = 'Active'")}`
    const gymsResponse = await fetch(gymsUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    })
    const gymsData = await gymsResponse.json()

    const currentGymId = member.fields['Gym']?.[0] || member.fields['Gym']
    const currentGymName = member.fields['Gym Name']?.[0] || member.fields['Gym']

    return NextResponse.json({
      currentGym: {
        id: currentGymId,
        name: currentGymName,
      },
      availableGyms: (gymsData.records || []).map(g => ({
        id: g.id,
        name: g.fields['Name'],
        address: g.fields['Address'],
        area: g.fields['Area'],
      })),
    })
  } catch (error) {
    console.error('Get gyms error:', error)
    return NextResponse.json({ error: 'Failed to get gyms' }, { status: 500 })
  }
}

// ============================================================================
// POST - Change gym
// ============================================================================

export async function POST(request) {
  try {
    const { token, gymId } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 })
    }
    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID required' }, { status: 400 })
    }

    const member = await getMemberByToken(token)
    if (!member) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Get gym details
    const gymResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Gyms/${gymId}`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } }
    )

    if (!gymResponse.ok) {
      return NextResponse.json({ error: 'Invalid gym' }, { status: 400 })
    }

    const gym = await gymResponse.json()
    const newGymName = gym.fields['Name']

    // Update member's gym
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${member.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: { 'Gym': [gymId] } }),
      }
    )

    // Send notification
    const phone = member.fields['Phone']
    try {
      await sendWhatsApp(phone,
        `Gym updated! ✅\n\nYour new gym: ${newGymName}\n\nYour next drop will be at this location.\n\nReply DROP to start, or MENU for options.`
      )
    } catch (e) { console.error('Notification failed:', e) }

    return NextResponse.json({
      success: true,
      message: `Gym changed to ${newGymName}`,
      newGym: { id: gymId, name: newGymName },
    })
  } catch (error) {
    console.error('Change gym error:', error)
    return NextResponse.json({ error: 'Failed to change gym' }, { status: 500 })
  }
}
