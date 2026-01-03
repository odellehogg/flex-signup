// app/api/portal/verify-code/route.js
// Verifies code and creates session

import { NextResponse } from 'next/server'
import { 
  verifyCode, 
  createSession, 
  setSessionCookie,
  findMemberByPhone,
  normalizePhone,
} from '@/lib/auth'

export async function POST(request) {
  try {
    const { phone, code } = await request.json()
    
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone and code are required' },
        { status: 400 }
      )
    }
    
    const normalizedPhone = normalizePhone(phone)
    
    // Verify the code
    const result = await verifyCode(normalizedPhone, code)
    
    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    // Get member ID for session
    const member = await findMemberByPhone(normalizedPhone)
    
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }
    
    // Create session token
    const token = await createSession(member.id, normalizedPhone)
    
    // Set session cookie
    await setSessionCookie(token)
    
    console.log(`✅ Session created for member ${member.id}`)
    
    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      redirect: '/portal/dashboard',
    })
    
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
