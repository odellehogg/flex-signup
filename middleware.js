import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect portal routes (except login)
  if (pathname.startsWith('/portal') && !pathname.startsWith('/portal/login')) {
    const token = request.cookies.get('flex_auth')?.value;
    
    if (!token) {
      const loginUrl = new URL('/portal/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect ops routes with basic auth check
  if (pathname.startsWith('/ops')) {
    // In production, implement proper ops authentication
    // For now, allow access (implement auth in production)
    const opsAuth = request.cookies.get('ops_auth')?.value;
    
    // Skip auth check for now - implement proper auth before launch
    // if (!opsAuth && process.env.NODE_ENV === 'production') {
    //   return NextResponse.redirect(new URL('/ops/login', request.url));
    // }
  }

  // Protect cron routes
  if (pathname.startsWith('/api/cron')) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow Vercel cron (has special header) or valid secret
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !hasValidSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/ops/:path*',
    '/api/cron/:path*',
  ],
};
