import { NextResponse } from 'next/server';

import { cookies } from 'next/headers';
import { createLogoutCookie } from '@/lib/auth';


export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const logoutCookie = createLogoutCookie();
  
  cookieStore.set(logoutCookie.name, logoutCookie.value, {
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
  const cookieStore = await cookies();
  const logoutCookie = createLogoutCookie();
  
  cookieStore.set(logoutCookie.name, logoutCookie.value, {
    httpOnly: logoutCookie.httpOnly,
    secure: logoutCookie.secure,
    sameSite: logoutCookie.sameSite,
    maxAge: logoutCookie.maxAge,
    path: logoutCookie.path,
  });

  return NextResponse.json({ success: true });
}
