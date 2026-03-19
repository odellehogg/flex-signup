import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { password } = await request.json();
    const secret = process.env.OPS_AUTH_SECRET;

    if (!secret) {
      console.error('[Ops Auth] OPS_AUTH_SECRET env var not set');
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
    }

    if (password !== secret) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Set auth cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('ops_auth', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('[Ops Auth] Error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
