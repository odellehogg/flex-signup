// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Only protect /ops routes (but not /ops/login or /api/ops)
  if (pathname.startsWith('/ops') && !pathname.startsWith('/ops/login') && !pathname.startsWith('/api/ops')) {
    const authToken = request.cookies.get('flex_ops_auth')?.value
    
    // Check if authenticated
    if (authToken !== process.env.OPS_AUTH_TOKEN) {
      return NextResponse.redirect(new URL('/ops/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/ops/:path*']
}
