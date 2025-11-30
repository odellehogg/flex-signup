// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Skip login page and API routes
  if (pathname === '/ops/login' || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Protect all other /ops routes
  if (pathname.startsWith('/ops')) {
    const authToken = request.cookies.get('flex_ops_auth')?.value
    
    // Just check if cookie exists and has a value (the API route validates the actual password)
    if (!authToken || authToken.length < 20) {
      return NextResponse.redirect(new URL('/ops/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/ops/:path*']
}
