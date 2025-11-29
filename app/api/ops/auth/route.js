// app/api/ops/auth/route.js
// Simple password authentication for ops dashboard

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const { password } = await request.json()
    
    // Check password against environment variable
    if (password === process.env.OPS_PASSWORD) {
      // Set auth cookie
      const cookieStore = await cookies()
      cookieStore.set('flex_ops_auth', process.env.OPS_AUTH_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

export async function DELETE() {
  // Logout - clear cookie
  const cookieStore = await cookies()
  cookieStore.delete('flex_ops_auth')
  return NextResponse.json({ success: true })
}
