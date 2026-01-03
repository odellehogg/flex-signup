// app/api/portal/logout/route.js
// Clears session and redirects to login

import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    await clearSessionCookie()
    
    return NextResponse.json({
      success: true,
      redirect: '/portal',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await clearSessionCookie()
    
    // Redirect to login page
    return NextResponse.redirect(new URL('/portal', process.env.NEXT_PUBLIC_BASE_URL || 'https://flexlaundry.co.uk'))
  } catch (error) {
    return NextResponse.redirect(new URL('/portal', process.env.NEXT_PUBLIC_BASE_URL || 'https://flexlaundry.co.uk'))
  }
}
