// app/api/verify-phone/check/route.js
// ============================================================================
// CHECK PHONE VERIFICATION CODE
// Validates the code entered by user
// ============================================================================

import { NextResponse } from 'next/server';
import { verifyCode } from '@/lib/verification';
import { normalizePhone } from '@/lib/airtable';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(phone);

    // Verify the code
    const result = await verifyCode(normalizedPhone, code.trim());

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      memberId: result.memberId,
      message: 'Phone verified successfully',
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
