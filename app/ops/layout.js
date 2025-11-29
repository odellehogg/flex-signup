// app/ops/layout.js
// Protected layout for ops dashboard
// Simple password protection for MVP

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import OpsNav from '@/components/ops/OpsNav'

export const metadata = {
  title: 'FLEX Ops Dashboard',
  description: 'Internal operations dashboard',
  robots: 'noindex, nofollow', // Don't index this page
}

export default async function OpsLayout({ children }) {
  // Check for auth cookie
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('flex_ops_auth')
  
  // If not authenticated, redirect to login
  if (!authCookie || authCookie.value !== process.env.OPS_AUTH_TOKEN) {
    redirect('/ops/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OpsNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
