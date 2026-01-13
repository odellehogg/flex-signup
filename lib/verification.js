// lib/verification.js
// ============================================================================
// PHONE VERIFICATION SYSTEM
// Uses WhatsApp OTP for signup and phone updates
// ============================================================================

import { VERIFICATION, COMPANY } from './constants.js';
import { 
  getMemberByPhone, 
  createMember, 
  updateMember, 
  setVerificationCode as saveVerificationCode,
  checkVerificationCode as validateVerificationCode,
  normalizePhone 
} from './airtable.js';

// ============================================================================
// OTP GENERATION
// ============================================================================

export function generateOTP(length = VERIFICATION.CODE_LENGTH) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

export function getExpiryTime(minutes = VERIFICATION.EXPIRY_MINUTES) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}

// ============================================================================
// SEND VERIFICATION CODE
// ============================================================================

export async function sendVerificationCode(phone, { firstName = 'there' } = {}) {
  const normalizedPhone = normalizePhone(phone);
  
  if (!normalizedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // Generate code
  const code = generateOTP();
  const expiresAt = getExpiryTime();

  // Check if member exists
  let member = await getMemberByPhone(normalizedPhone);
  
  if (!member) {
    // Create pending member for verification
    member = await createMember({
      phone: normalizedPhone,
      firstName,
      status: 'Pending',
    });
  }

  // Save verification code to member record
  await saveVerificationCode(member.id, code, expiresAt);

  // Send WhatsApp message with code
  try {
    const { sendVerificationCodeMessage } = await import('./whatsapp.js');
    await sendVerificationCodeMessage(normalizedPhone, code);
    
    return { 
      success: true, 
      memberId: member.id,
      expiresAt,
      // Don't return code in production, this is for logging
      ...(process.env.NODE_ENV === 'development' && { code }),
    };
  } catch (error) {
    console.error('Failed to send verification WhatsApp:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
}

// ============================================================================
// VERIFY CODE
// ============================================================================

export async function verifyCode(phone, code) {
  const normalizedPhone = normalizePhone(phone);
  
  if (!normalizedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // Get member by phone
  const member = await getMemberByPhone(normalizedPhone);
  
  if (!member) {
    return { success: false, error: 'No verification pending for this number' };
  }

  // Validate the code
  const result = await validateVerificationCode(member.id, code);
  
  if (!result.success) {
    return result;
  }

  return { 
    success: true, 
    memberId: member.id,
    member: result.member,
  };
}

// ============================================================================
// PHONE UPDATE VERIFICATION
// For changing phone number in portal
// ============================================================================

export async function sendPhoneUpdateCode(memberId, newPhone) {
  const normalizedPhone = normalizePhone(newPhone);
  
  if (!normalizedPhone) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // Check if new phone is already in use by another member
  const existingMember = await getMemberByPhone(normalizedPhone);
  if (existingMember && existingMember.id !== memberId) {
    return { success: false, error: 'This phone number is already registered' };
  }

  // Generate code
  const code = generateOTP();
  const expiresAt = getExpiryTime();

  // Store pending phone and verification code
  await updateMember(memberId, {
    'Pending Phone': normalizedPhone,
    'Verification Code': code,
    'Verification Expires': expiresAt.toISOString(),
    'Verification Attempts': 0,
  });

  // Send code to the NEW number
  try {
    const { sendVerificationCodeMessage } = await import('./whatsapp.js');
    await sendVerificationCodeMessage(normalizedPhone, code);
    
    return { 
      success: true, 
      expiresAt,
    };
  } catch (error) {
    console.error('Failed to send phone update verification:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
}

export async function verifyPhoneUpdate(memberId, code) {
  const { getMemberById } = await import('./airtable.js');
  const member = await getMemberById(memberId);
  
  if (!member) {
    return { success: false, error: 'Member not found' };
  }

  const storedCode = member.fields['Verification Code'];
  const expires = member.fields['Verification Expires'];
  const attempts = member.fields['Verification Attempts'] || 0;
  const pendingPhone = member.fields['Pending Phone'];

  if (!pendingPhone) {
    return { success: false, error: 'No phone update pending' };
  }

  // Check attempts
  if (attempts >= VERIFICATION.MAX_ATTEMPTS) {
    return { success: false, error: 'Too many attempts. Please request a new code.' };
  }

  // Check expiry
  if (!expires || new Date(expires) < new Date()) {
    return { success: false, error: 'Code expired. Please request a new code.' };
  }

  // Check code
  if (storedCode !== code) {
    await updateMember(memberId, {
      'Verification Attempts': attempts + 1,
    });
    return { success: false, error: 'Invalid code' };
  }

  // Success - update phone number
  const oldPhone = member.fields['Phone'];
  
  await updateMember(memberId, {
    'Phone': pendingPhone,
    'Pending Phone': '',
    'Verification Code': '',
    'Verification Expires': '',
    'Verification Attempts': 0,
  });

  return { 
    success: true, 
    oldPhone,
    newPhone: pendingPhone,
  };
}

// ============================================================================
// RESEND LOGIC
// ============================================================================

export async function canResendCode(memberId) {
  const { getMemberById } = await import('./airtable.js');
  const member = await getMemberById(memberId);
  
  if (!member) {
    return { canResend: false, error: 'Member not found' };
  }

  const lastSent = member.fields['Verification Sent At'];
  
  if (lastSent) {
    const secondsSinceSent = (Date.now() - new Date(lastSent).getTime()) / 1000;
    if (secondsSinceSent < VERIFICATION.RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(VERIFICATION.RESEND_COOLDOWN_SECONDS - secondsSinceSent);
      return { 
        canResend: false, 
        waitSeconds,
        error: `Please wait ${waitSeconds} seconds before requesting a new code`,
      };
    }
  }

  return { canResend: true };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function isValidUKPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  
  // UK mobile numbers start with +447
  // UK landlines start with +441, +442, +443
  return /^\+44[1-9]\d{9,10}$/.test(normalized);
}

export function formatPhoneForDisplay(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return phone;
  
  // Format as +44 7XXX XXX XXX
  if (normalized.length === 13 && normalized.startsWith('+44')) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 7)} ${normalized.slice(7, 10)} ${normalized.slice(10)}`;
  }
  
  return normalized;
}

export default {
  generateOTP,
  getExpiryTime,
  sendVerificationCode,
  verifyCode,
  sendPhoneUpdateCode,
  verifyPhoneUpdate,
  canResendCode,
  isValidUKPhone,
  formatPhoneForDisplay,
};
