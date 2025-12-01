// app/api/notify-drop-status/route.js
// Called by Airtable automation when drop status changes
// Sends WhatsApp notification to customer

import { NextResponse } from 'next/server'
import { getMemberById } from '@/lib/airtable'
import twilio from 'twilio'

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

// ============================================================================
// POST Handler - Receives status change from Airtable
// ============================================================================

export async function POST(request) {
  try {
    const { bagNumber, status, memberId } = await request.json()
    
    console.log(`📦 Status change: ${bagNumber} → ${status}`)
    
    if (!memberId || !status) {
      return NextResponse.json({ error: 'Missing memberId or status' }, { status: 400 })
    }
    
    // Get member details
    const member = await getMemberById(memberId)
    if (!member) {
      console.log(`❌ Member not found: ${memberId}`)
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    
    const phone = member.fields['Phone']
    const firstName = member.fields['First Name'] || 'there'
    const gymName = member.fields['Gym Name'] || 'your gym'
    
    if (!phone) {
      console.log(`❌ No phone for member: ${memberId}`)
      return NextResponse.json({ error: 'No phone number' }, { status: 400 })
    }
    
    // Format phone for WhatsApp
    const whatsappNumber = formatWhatsAppNumber(phone)
    
    // Get message template based on status
    const message = getStatusMessage(status, bagNumber, firstName, gymName)
    
    if (!message) {
      console.log(`⏭️ No notification for status: ${status}`)
      return NextResponse.json({ skipped: true, reason: `No notification for ${status}` })
    }
    
    // Send WhatsApp message
    await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: whatsappNumber,
      body: message
    })
    
    console.log(`✅ Notification sent: ${bagNumber} → ${status} → ${phone}`)
    
    return NextResponse.json({ success: true, status, bagNumber })
    
  } catch (error) {
    console.error('❌ Notify error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatWhatsAppNumber(phone) {
  // Remove any existing whatsapp: prefix
  let cleaned = phone.replace('whatsapp:', '').replace(/\D/g, '')
  
  // Ensure UK format
  if (cleaned.startsWith('0')) {
    cleaned = '44' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('44')) {
    cleaned = '44' + cleaned
  }
  
  return `whatsapp:+${cleaned}`
}

function getStatusMessage(status, bagNumber, firstName, gymName) {
  const messages = {
    'Dropped': null, // Customer knows they dropped it
    
    'In Transit': `🚚 Hey ${firstName}! Your FLEX bag (${bagNumber}) has been collected from ${gymName} and is on its way to our laundry facility.`,
    
    'At Laundry': `🧺 ${firstName}, your bag (${bagNumber}) is now being professionally cleaned. We'll let you know when it's ready!`,
    
    'Ready': `✨ Great news ${firstName}! Your fresh, clean clothes (${bagNumber}) are ready for pickup at ${gymName}. 

Just grab your bag from reception next time you're in!

Reply COLLECTED when you've picked it up.`,
    
    'Collected': null, // They confirmed it themselves
    
    'Cancelled': `❌ ${firstName}, your drop (${bagNumber}) has been cancelled. If this wasn't expected, please reply HELP.`
  }
  
  return messages[status] || null
}

// ============================================================================
// GET Handler - Health check
// ============================================================================

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: 'notify-drop-status',
    description: 'Receives drop status changes from Airtable automation'
  })
}
