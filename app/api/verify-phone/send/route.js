// app/api/verify-phone/send/route.js
// ============================================================================
// SEND PHONE VERIFICATION CODE
// Used during signup and portal phone updates
// ============================================================================

import { NextResponse } from 'next/server';
import { sendVerificationCode, isValidUKPhone } from '@/lib/verification';
import { normalizePhone } from '@/lib/airtable';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, firstName = 'there' } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize and validate
    const normalizedPhone = normalizePhone(phone);

    if (!isValidUKPhone(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid UK phone number' },
        { status: 400 }
      );
    }

    // Send verification code
    const result = await sendVerificationCode(normalizedPhone, { firstName });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      memberId: result.memberId,
      expiresAt: result.expiresAt,
      message: 'Verification code sent to WhatsApp',
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
