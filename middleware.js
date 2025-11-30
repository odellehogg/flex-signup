// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Temporarily disabled - just pass everything through
  return NextResponse.next()
}

export const config = {
  matcher: ['/ops/:path*']
}
