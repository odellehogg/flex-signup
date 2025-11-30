// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Let all requests pass through - auth is handled by layout
  return NextResponse.next()
}

export const config = {
  matcher: ['/ops/:path*']
}
