import { NextResponse } from 'next/server';

export function proxy(request) {
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

 // Protect ops routes with auth check
 if (pathname.startsWith('/ops') && !pathname.startsWith('/ops/login')) {
     const opsAuth = request.cookies.get('ops_auth')?.value;
     const opsSecret = process.env.OPS_AUTH_SECRET;

    if (!opsAuth || !opsSecret || opsAuth !== opsSecret) {
         return NextResponse.redirect(new URL('/ops/login', request.url));
    }
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
