'use client'

// app/portal/plan/page.js
// Change subscription plan (Essential ↔ Unlimited)

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PLANS = [
  {
    id: 'Essential',
    name: 'Essential',
    price: 35,
    drops: 8,
    features: [
      '8 drops per month',
      '48-hour turnaround',
      'Activewear-safe cleaning',
      'WhatsApp support',
    ],
  },
  {
    id: 'Unlimited',
    name: 'Unlimited',
    price: 48,
    drops: 16,
    features: [
      '16 drops per month',
      '48-hour turnaround',
      'Activewear-safe cleaning',
      'WhatsApp support',
      'Priority pickup',
    ],
    popular: true,
  },
]

export default function PlanPage() {
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCurrentPlan()
  }, [])

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch('/api/portal/me')
      
      if (response.status === 401) {
        router.push('/portal')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load plan')
      }

      setCurrentPlan(data.plan)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async (newPlan) => {
    if (newPlan === currentPlan) return

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/portal/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_plan', newPlan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change plan')
      }

      setCurrentPlan(newPlan)
      setSuccess(`Successfully changed to ${newPlan} plan!`)

      // Redirect after short delay
      setTimeout(() => router.push('/portal/dashboard'), 2000)

    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change plan</h1>
        <p className="text-gray-600 mt-1">
          Changes take effect on your next billing date
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const isUpgrade = plan.id === 'Unlimited' && currentPlan === 'Essential'
          const isDowngrade = plan.id === 'Essential' && currentPlan === 'Unlimited'

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl border-2 p-6 transition ${
                isCurrent
                  ? 'border-[#1e3a5f] ring-2 ring-[#1e3a5f] ring-opacity-20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#1e3a5f] text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most popular
                  </span>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Current plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-[#1e3a5f]">£{plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {plan.drops} drops per month
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-center text-sm text-gray-500 py-3">
                  This is your current plan
                </div>
              ) : (
                <button
                  onClick={() => handleChangePlan(plan.id)}
                  disabled={actionLoading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition disabled:opacity-50 ${
                    isUpgrade
                      ? 'bg-[#1e3a5f] text-white hover:bg-[#2d4a6f]'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {actionLoading
                    ? 'Processing...'
                    : isUpgrade
                    ? 'Upgrade'
                    : isDowngrade
                    ? 'Downgrade'
                    : 'Select'
                  }
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Proration note */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>How plan changes work:</strong> When you upgrade, you'll be charged the difference immediately and get access to more drops right away. When you downgrade, the change takes effect on your next billing date.
        </p>
      </div>
    </div>
  )
}
