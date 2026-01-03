// app/api/portal/request-code/route.js
// Sends verification code to phone number via WhatsApp

import { NextResponse } from 'next/server'
import { 
  generateCode, 
  storeVerificationCode, 
  sendVerificationCode,
  findMemberByPhone,
  normalizePhone,
} from '@/lib/auth'

export async function POST(request) {
  try {
    const { phone } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }
    
    const normalizedPhone = normalizePhone(phone)
    
    // Check if member exists
    const member = await findMemberByPhone(normalizedPhone)
    
    if (!member) {
      return NextResponse.json(
        { error: 'No account found with this phone number. Please sign up first.' },
        { status: 404 }
      )
    }
    
    // Generate and store code
    const code = generateCode()
    await storeVerificationCode(normalizedPhone, code)
    
    // Send via WhatsApp
    await sendVerificationCode(normalizedPhone, code)
    
    console.log(`✅ Verification code sent to ${normalizedPhone}`)
    
    // Return success (don't include code in response!)
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your WhatsApp',
      phone: normalizedPhone, // Return normalized for verify step
    })
    
  } catch (error) {
    console.error('Request code error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    )
  }
}
