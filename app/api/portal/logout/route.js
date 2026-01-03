import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createLogoutCookie } from '@/lib/auth';

export async function GET() {
  const cookieStore = cookies();
  const logoutCookie = createLogoutCookie();
  
  cookieStore.set('flex_auth', '', {
    httpOnly: logoutCookie.httpOnly,
    secure: logoutCookie.secure,
    sameSite: logoutCookie.sameSite,
    maxAge: logoutCookie.maxAge,
    path: logoutCookie.path,
  });

  // Redirect to login page
  return NextResponse.redirect(new URL('/portal/login', process.env.NEXT_PUBLIC_URL || 'https://flexlaundry.co.uk'));
}

export async function POST() {
  const cookieStore = cookies();
  const logoutCookie = createLogoutCookie();
  
  cookieStore.set('flex_auth', '', {
    httpOnly: logoutCookie.httpOnly,
    secure: logoutCookie.secure,
    sameSite: logoutCookie.sameSite,
    maxAge: logoutCookie.maxAge,
    path: logoutCookie.path,
  });

  return NextResponse.json({ success: true });
}
