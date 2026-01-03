// app/api/portal/gym/route.js
// Change member's gym location

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMemberById, updateMember, getGyms } from '@/lib/airtable'

// ============================================================================
// GET - Get available gyms
// ============================================================================

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const member = await getMemberById(session.memberId)
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    
    // Get all active gyms
    const gyms = await getGyms()
    
    const currentGymId = member.fields['Gym']?.[0]
    const currentGymName = member.fields['Gym Name']?.[0] || member.fields['Gym Name']
    
    return NextResponse.json({
      currentGym: {
        id: currentGymId,
        name: currentGymName,
      },
      availableGyms: gyms.map(g => ({
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
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const { gymId } = await request.json()
    
    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID is required' }, { status: 400 })
    }
    
    const member = await getMemberById(session.memberId)
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    
    // Verify gym exists
    const gyms = await getGyms()
    const newGym = gyms.find(g => g.id === gymId)
    
    if (!newGym) {
      return NextResponse.json({ error: 'Invalid gym' }, { status: 400 })
    }
    
    // Update member's gym
    await updateMember(session.memberId, {
      'Gym': [gymId],
    })
    
    // Send WhatsApp notification
    const { sendPlainText } = await import('@/lib/whatsapp')
    const phone = member.fields['Phone']
    const firstName = member.fields['First Name'] || 'there'
    const newGymName = newGym.fields['Name']
    
    await sendPlainText(phone,
      `Gym updated! ✅\n\n` +
      `Your new gym: ${newGymName}\n\n` +
      `Your next drop will be at this location.\n\n` +
      `Reply DROP to start, or MENU for options.`
    )
    
    return NextResponse.json({
      success: true,
      message: `Gym changed to ${newGymName}`,
      newGym: {
        id: gymId,
        name: newGymName,
      },
    })
    
  } catch (error) {
    console.error('Change gym error:', error)
    return NextResponse.json({ error: 'Failed to change gym' }, { status: 500 })
  }
}
