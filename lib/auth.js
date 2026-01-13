// lib/auth.js
// ============================================================================
// MAGIC LINK AUTHENTICATION FOR CUSTOMER PORTAL
// No passwords - login via WhatsApp or email with verification code
// Works with Vercel serverless functions (no Next.js specific imports)
// ============================================================================

import { getMemberByPhone, getMemberById, setVerificationCode, verifyCode as verifyAirtableCode } from './airtable.js';
import { sendMessage } from './whatsapp.js';
// import { sendMagicLinkEmail } from './email.js'; // Removed - not used
// import { COMPANY } from './constants.js'; // Removed - not used

const JWT_SECRET = process.env.JWT_SECRET;
// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://flexlaundry.co.uk';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+44' + cleaned.slice(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

function generateCode() {
  // 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(payload) {
  // Simple JWT-like token (for serverless compatibility)
  // In production, consider using jose library
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60), // 7 days
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  
  // Simple HMAC signature
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');

  return `${base64Header}.${base64Payload}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.');
    
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// ============================================================================
// AUTHENTICATION FLOW
// ============================================================================

/**
 * Step 1: Request login code
 * Sends verification code via WhatsApp (primary) or email (backup)
 */
export async function requestLoginCode(phoneOrEmail) {
  let member;
  let sendVia = 'whatsapp';

  // Check if it's a phone number or email
  if (phoneOrEmail.includes('@')) {
    // Email - need to look up member by email
    // For now, we'll prioritize phone-based auth
    sendVia = 'email';
    // You'd need a getMemberByEmail function in airtable.js
    return { success: false, error: 'Email login not yet implemented. Please use your phone number.' };
  } else {
    const phone = normalizePhone(phoneOrEmail);
    member = await getMemberByPhone(phone);
  }

  if (!member) {
    return { success: false, error: 'Account not found' };
  }

  // Generate 6-digit code
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store code in Airtable
  await setVerificationCode(member.id, code, expiresAt);

  // Send code via WhatsApp
  if (sendVia === 'whatsapp') {
    await sendMessage(member['Phone Number'],
      `Your FLEX login code is: ${code}\n\n` +
      `Enter this code on the login page.\n\n` +
      `This code expires in 15 minutes.\n\n` +
      `Didn't request this? You can ignore this message.`
    );
  }

  return { 
    success: true, 
    memberId: member.id,
    message: `Code sent to ${sendVia}`,
  };
}

/**
 * Step 2: Verify code and return auth token
 * Can accept phone number or memberId
 */
export async function verifyLoginCode(phoneOrMemberId, code) {
  let member;
  
  // Check if it looks like a phone number
  if (phoneOrMemberId.startsWith('+') || phoneOrMemberId.startsWith('0')) {
    const phone = normalizePhone(phoneOrMemberId);
    member = await getMemberByPhone(phone);
  } else {
    // Assume it's a memberId
    member = await getMemberById(phoneOrMemberId);
  }
  
  if (!member) {
    return { success: false, error: 'Account not found' };
  }

  const result = await verifyAirtableCode(member.id, code);

  if (!result.success) {
    return result;
  }

  // Generate auth token
  const token = generateToken({
    memberId: member.id,
    phone: member.fields?.['Phone Number'] || member['Phone Number'],
    email: member.fields?.Email || member.Email,
    firstName: member.fields?.['First Name'] || member['First Name'],
  });

  return {
    success: true,
    token,
    memberId: member.id,
    member: {
      id: member.id,
      firstName: member.fields?.['First Name'] || member['First Name'],
      lastName: member.fields?.['Last Name'] || member['Last Name'],
      email: member.fields?.Email || member.Email,
      phone: member.fields?.['Phone Number'] || member['Phone Number'],
      plan: member.fields?.['Subscription Tier'] || member['Subscription Tier'],
      status: member.fields?.Status || member.Status,
    },
  };
}

/**
 * Alternative: Magic link (sent via email)
 */
export async function sendMagicLink(email) {
  // This would require getMemberByEmail in airtable.js
  // For now, return not implemented
  return { success: false, error: 'Magic links via email not yet implemented' };
}

// ============================================================================
// SESSION MANAGEMENT (for API routes)
// ============================================================================

/**
 * Verify auth token from request
 * Use in API routes: const member = await getAuthenticatedMember(request)
 */
export async function getAuthenticatedMember(request) {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  let token;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    // Check cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(c => c.split('='))
      );
      token = cookies['flex_auth'];
    }
  }

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }

  // Get fresh member data
  const member = await getMemberById(payload.memberId);
  
  return member;
}

/**
 * Create auth cookie configuration
 */
export function createAuthCookie(token) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: 'flex_auth',
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  };
}

/**
 * Create logout cookie configuration (clears token)
 */
export function createLogoutCookie() {
  return {
    name: 'flex_auth',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  generateCode,
  generateToken,
  verifyToken,
};

// Alias for backwards compatibility
export const verifySession = verifyToken;
