import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/airtable';
import { verifyLoginCode, createAuthCookie } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    // Verify the code and get token
    const result = await verifyLoginCode(normalizedPhone, code);

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Invalid code' 
      }, { status: 401 });
    }

    // Set auth cookie
    const cookieStore = await cookies();
    const authCookie = createAuthCookie(result.token);
    
    cookieStore.set(authCookie.name, authCookie.value, {
      httpOnly: authCookie.httpOnly,
      secure: authCookie.secure,
      sameSite: authCookie.sameSite,
      maxAge: authCookie.maxAge,
      path: authCookie.path,
    });

    return NextResponse.json({ 
      success: true,
      memberId: result.memberId 
    });
  } catch (err) {
    console.error('Verify code error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
