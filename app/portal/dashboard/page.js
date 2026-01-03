'use client'

// app/portal/dashboard/page.js
// Main portal dashboard - overview of subscription, drops, quick actions

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PortalDashboard() {
  const router = useRouter()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMemberData()
  }, [])

  const fetchMemberData = async () => {
    try {
      const response = await fetch('/api/portal/me')
      
      if (response.status === 401) {
        router.push('/portal')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load account')
      }

      setMember(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/portal/logout', { method: 'POST' })
    router.push('/portal')
  }

  const handleBilling = async () => {
    try {
      const response = await fetch('/api/portal/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.href }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing')
      }

      window.location.href = data.url
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-red-50 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-medium">Error loading account</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchMemberData}
            className="mt-4 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const isPaused = member.status === 'Paused' || member.subscription?.pauseCollection
  const isCancelling = member.status === 'Cancelling' || member.subscription?.cancelAtPeriodEnd

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hey, {member.firstName || 'there'}! 👋
          </h1>
          <p className="text-gray-600">Manage your FLEX subscription</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Log out
        </button>
      </div>

      {/* Status banners */}
      {isPaused && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-yellow-800 font-medium">Your subscription is paused</p>
          {member.subscription?.pauseResumesAt && (
            <p className="text-yellow-700 text-sm mt-1">
              Resumes on {new Date(member.subscription.pauseResumesAt).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          )}
        </div>
      )}

      {isCancelling && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-800 font-medium">Your subscription is ending</p>
          {member.subscription?.currentPeriodEnd && (
            <p className="text-red-700 text-sm mt-1">
              Access until {new Date(member.subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
              })}
            </p>
          )}
        </div>
      )}

      {/* Drops remaining card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Drops remaining</p>
            <p className="text-4xl font-bold text-[#1e3a5f] mt-1">
              {member.dropsRemaining}
              <span className="text-lg text-gray-400 font-normal"> / {member.dropsAllowed}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Plan</p>
            <p className="text-lg font-semibold text-gray-900">{member.plan}</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1e3a5f] rounded-full transition-all"
              style={{ width: `${(member.dropsRemaining / member.dropsAllowed) * 100}%` }}
            />
          </div>
        </div>

        {member.dropsRemaining <= 2 && member.plan !== 'Unlimited' && (
          <p className="text-amber-600 text-sm mt-3">
            Running low! Consider upgrading to Unlimited.
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/portal/subscription"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-[#1e3a5f] transition group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Subscription</h3>
              <p className="text-sm text-gray-600 mt-1">
                {isPaused ? 'Resume subscription' : isCancelling ? 'Reactivate' : 'Pause or cancel'}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/portal/plan"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-[#1e3a5f] transition group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Change plan</h3>
              <p className="text-sm text-gray-600 mt-1">
                {member.plan === 'Essential' ? 'Upgrade to Unlimited' : 'Switch plans'}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/portal/gym"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-[#1e3a5f] transition group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Change gym</h3>
              <p className="text-sm text-gray-600 mt-1">
                Currently: {member.gymName}
              </p>
            </div>
          </div>
        </Link>

        <button
          onClick={handleBilling}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-[#1e3a5f] transition group text-left w-full"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Billing</h3>
              <p className="text-sm text-gray-600 mt-1">
                Update payment method
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Active drops */}
      {member.activeDrops.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Active drops</h2>
          <div className="space-y-3">
            {member.activeDrops.map((drop) => (
              <div
                key={drop.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">Bag {drop.bagNumber}</p>
                  <p className="text-sm text-gray-600">
                    Dropped {new Date(drop.dropDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  drop.status === 'Ready' 
                    ? 'bg-green-100 text-green-700'
                    : drop.status === 'At Laundry'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {drop.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open tickets */}
      {member.openTickets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Support tickets</h2>
            <Link href="/portal/tickets" className="text-sm text-[#1e3a5f] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {member.openTickets.slice(0, 3).map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{ticket.ticketId}</p>
                  <p className="text-sm text-gray-600">{ticket.type}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ticket.status === 'Open'
                    ? 'bg-yellow-100 text-yellow-700'
                    : ticket.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Account details</h2>
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{member.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Phone</p>
            <p className="font-medium text-gray-900">{member.phone}</p>
          </div>
          <div>
            <p className="text-gray-600">Member since</p>
            <p className="font-medium text-gray-900">
              {member.signupDate 
                ? new Date(member.signupDate).toLocaleDateString('en-GB', {
                    month: 'long',
                    year: 'numeric',
                  })
                : 'N/A'
              }
            </p>
          </div>
          {member.subscription?.currentPeriodEnd && (
            <div>
              <p className="text-gray-600">Next billing</p>
              <p className="font-medium text-gray-900">
                {new Date(member.subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
