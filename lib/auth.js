// lib/auth.js
// FLEX Portal Authentication - Magic Link via WhatsApp
// No passwords - just phone verification

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'flex-portal-secret-change-in-production'
)

// Store verification codes temporarily (in production, use Redis)
// For now, we'll store in Airtable Members table
const VERIFICATION_CODES = new Map()

// ============================================================================
// CODE GENERATION & VERIFICATION
// ============================================================================

/**
 * Generate a 6-digit verification code
 */
export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store verification code for a phone number
 * Expires in 10 minutes
 */
export async function storeVerificationCode(phone, code) {
  const normalizedPhone = normalizePhone(phone)
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes
  
  // Store in memory (for MVP - in production use Redis or database)
  VERIFICATION_CODES.set(normalizedPhone, {
    code,
    expiresAt,
    attempts: 0,
  })
  
  // Also store in Airtable for persistence across serverless invocations
  await updateMemberVerification(normalizedPhone, code, expiresAt)
  
  return { code, expiresAt }
}

/**
 * Verify a code for a phone number
 */
export async function verifyCode(phone, inputCode) {
  const normalizedPhone = normalizePhone(phone)
  
  // Check memory first
  let stored = VERIFICATION_CODES.get(normalizedPhone)
  
  // If not in memory, check Airtable
  if (!stored) {
    stored = await getMemberVerification(normalizedPhone)
  }
  
  if (!stored) {
    return { valid: false, error: 'No verification code found. Please request a new one.' }
  }
  
  // Check expiry
  if (Date.now() > stored.expiresAt) {
    VERIFICATION_CODES.delete(normalizedPhone)
    await clearMemberVerification(normalizedPhone)
    return { valid: false, error: 'Code expired. Please request a new one.' }
  }
  
  // Check attempts (max 5)
  if (stored.attempts >= 5) {
    VERIFICATION_CODES.delete(normalizedPhone)
    await clearMemberVerification(normalizedPhone)
    return { valid: false, error: 'Too many attempts. Please request a new code.' }
  }
  
  // Check code
  if (stored.code !== inputCode) {
    stored.attempts++
    VERIFICATION_CODES.set(normalizedPhone, stored)
    await incrementVerificationAttempts(normalizedPhone)
    return { valid: false, error: 'Invalid code. Please try again.' }
  }
  
  // Success! Clear the code
  VERIFICATION_CODES.delete(normalizedPhone)
  await clearMemberVerification(normalizedPhone)
  
  return { valid: true }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a session token for authenticated user
 */
export async function createSession(memberId, phone) {
  const token = await new SignJWT({ 
    memberId, 
    phone: normalizePhone(phone),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 day session
    .sign(JWT_SECRET)
  
  return token
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { valid: true, memberId: payload.memberId, phone: payload.phone }
  } catch (error) {
    return { valid: false, error: 'Invalid or expired session' }
  }
}

/**
 * Get current session from cookies
 */
export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('flex_session')?.value
  
  if (!token) {
    return null
  }
  
  const result = await verifySession(token)
  if (!result.valid) {
    return null
  }
  
  return result
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token) {
  const cookieStore = await cookies()
  cookieStore.set('flex_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('flex_session')
}

// ============================================================================
// PHONE UTILITIES
// ============================================================================

/**
 * Normalize phone number to consistent format
 */
export function normalizePhone(phone) {
  let cleaned = phone.replace('whatsapp:', '').replace(/\D/g, '')
  
  // Handle UK numbers
  if (cleaned.startsWith('0')) {
    cleaned = '44' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('44') && cleaned.length === 10) {
    cleaned = '44' + cleaned
  }
  
  return cleaned
}

/**
 * Format phone for display
 */
export function formatPhoneDisplay(phone) {
  const normalized = normalizePhone(phone)
  if (normalized.startsWith('44')) {
    const local = '0' + normalized.slice(2)
    return local.replace(/(\d{5})(\d{6})/, '$1 $2')
  }
  return phone
}

// ============================================================================
// AIRTABLE VERIFICATION STORAGE
// ============================================================================

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

async function updateMemberVerification(phone, code, expiresAt) {
  try {
    // Find member by phone
    const member = await findMemberByPhone(phone)
    if (!member) return
    
    // Update verification fields
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${member.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Verification Code': code,
            'Verification Expires': new Date(expiresAt).toISOString(),
            'Verification Attempts': 0,
          },
        }),
      }
    )
  } catch (error) {
    console.error('Failed to store verification in Airtable:', error)
  }
}

async function getMemberVerification(phone) {
  try {
    const member = await findMemberByPhone(phone)
    if (!member) return null
    
    const code = member.fields['Verification Code']
    const expiresAt = member.fields['Verification Expires']
    const attempts = member.fields['Verification Attempts'] || 0
    
    if (!code || !expiresAt) return null
    
    return {
      code,
      expiresAt: new Date(expiresAt).getTime(),
      attempts,
    }
  } catch (error) {
    console.error('Failed to get verification from Airtable:', error)
    return null
  }
}

async function incrementVerificationAttempts(phone) {
  try {
    const member = await findMemberByPhone(phone)
    if (!member) return
    
    const attempts = (member.fields['Verification Attempts'] || 0) + 1
    
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${member.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: { 'Verification Attempts': attempts },
        }),
      }
    )
  } catch (error) {
    console.error('Failed to increment attempts:', error)
  }
}

async function clearMemberVerification(phone) {
  try {
    const member = await findMemberByPhone(phone)
    if (!member) return
    
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${member.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Verification Code': null,
            'Verification Expires': null,
            'Verification Attempts': null,
          },
        }),
      }
    )
  } catch (error) {
    console.error('Failed to clear verification:', error)
  }
}

async function findMemberByPhone(phone) {
  const normalized = normalizePhone(phone)
  
  // Build search formats
  const formats = []
  if (normalized.startsWith('44')) {
    formats.push('+' + normalized)
    formats.push(normalized)
    formats.push('0' + normalized.slice(2))
  } else {
    formats.push(normalized)
    formats.push('+' + normalized)
  }
  
  const conditions = formats.map(f => `{Phone} = '${f}'`).join(', ')
  const formula = encodeURIComponent(`OR(${conditions})`)
  
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?filterByFormula=${formula}&maxRecords=1`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    )
    
    const data = await response.json()
    return data.records?.[0] || null
  } catch (error) {
    console.error('Failed to find member:', error)
    return null
  }
}

// ============================================================================
// SEND VERIFICATION CODE VIA WHATSAPP
// ============================================================================

export async function sendVerificationCode(phone, code) {
  const { sendPlainText } = await import('./whatsapp.js')
  
  const message = 
    `🔐 Your FLEX verification code is:\n\n` +
    `*${code}*\n\n` +
    `This code expires in 10 minutes.\n\n` +
    `If you didn't request this, please ignore this message.`
  
  await sendPlainText(phone, message)
}

export { findMemberByPhone }
