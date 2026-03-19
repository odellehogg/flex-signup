export const dynamic = 'force-dynamic';

// app/api/portal/verify-code/route.js
// ============================================================================
// PORTAL LOGIN CODE VERIFICATION
// NEW FILE - was missing, caused portal login to always 404
// Called by app/portal/login/page.js after user enters 6-digit code
// ============================================================================

import { NextResponse } from 'next/server';
import { verifyLoginCode, createAuthCookie } from '@/lib/auth';
import { normalizePhone } from '@/lib/airtable';

export async function POST(request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // Verify the code using auth.js
    const result = await verifyLoginCode(normalizedPhone, code.trim());

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid or expired code' },
        { status: 401 }
      );
    }

    // Create response with auth cookie
    const response = NextResponse.json({
      success: true,
      member: result.member,
    });

    // Set the auth cookie
    const cookieConfig = createAuthCookie(result.token);
    response.cookies.set(cookieConfig.name, cookieConfig.value, {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      maxAge: cookieConfig.maxAge,
      path: cookieConfig.path,
    });

    return response;
  } catch (err) {
    console.error('Portal verify-code error:', err);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
