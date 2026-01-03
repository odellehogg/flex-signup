'use client'

// app/member/plan/page.js
// Change subscription plan (Essential ↔ Unlimited)
// Matches existing member portal style

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

const PLANS = [
  { id: 'Essential', price: 35, drops: 10, features: ['10 drops per month', '48-hour turnaround', 'Activewear-safe cleaning', 'WhatsApp support'] },
  { id: 'Unlimited', price: 48, drops: 16, features: ['16 drops per month', '48-hour turnaround', 'Activewear-safe cleaning', 'WhatsApp support', 'Priority pickup'], popular: true },
]

export default function PlanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!token) {
      router.push('/member')
      return
    }
    fetchCurrentPlan()
  }, [token])

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch(`/api/member/subscription?token=${token}`)
      if (response.status === 401) {
        router.push('/member?error=invalid_token')
        return
      }
      const data = await response.json()
      setCurrentPlan(data.plan || 'Essential')
    } catch (err) {
      setError('Failed to load plan')
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
      const response = await fetch('/api/member/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPlan }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to change plan')

      setCurrentPlan(newPlan)
      setSuccess(data.message)
      setTimeout(() => router.push(`/member/dashboard?token=${token}`), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-warm-gray py-8">
          <div className="container-width flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-flex-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-warm-gray py-8">
        <div className="container-width">
          <div className="max-w-xl mx-auto">
            
            <Link href={`/member/dashboard?token=${token}`} className="inline-flex items-center text-sm text-gray-600 hover:text-flex-navy mb-6">
              ← Back to dashboard
            </Link>

            <h1 className="text-2xl font-bold text-flex-navy mb-2">Change Plan</h1>
            <p className="text-gray-600 mb-6">Changes take effect on your next billing date</p>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

            {/* Plan cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlan
                const isUpgrade = plan.id === 'Unlimited' && currentPlan === 'Essential'

                return (
                  <div key={plan.id}
                    className={`relative bg-white rounded-2xl border-2 p-6 shadow-lg ${
                      isCurrent ? 'border-flex-navy ring-2 ring-flex-navy ring-opacity-20' : 'border-gray-200'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-flex-navy text-white text-xs font-medium px-3 py-1 rounded-full">Most popular</span>
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute -top-3 right-4">
                        <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">Current</span>
                      </div>
                    )}

                    <div className="text-center mb-6 pt-2">
                      <h3 className="text-xl font-bold text-flex-navy">{plan.id}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-flex-navy">£{plan.price}</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{plan.drops} drops per month</p>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className="text-center text-sm text-gray-500 py-2">Your current plan</div>
                    ) : (
                      <button
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={actionLoading}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition disabled:opacity-50 ${
                          isUpgrade ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        {actionLoading ? 'Processing...' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="bg-flex-light rounded-xl p-4 mt-6">
              <p className="text-sm text-flex-navy">
                <strong>Upgrades:</strong> Charged difference immediately, more drops right away.<br/>
                <strong>Downgrades:</strong> Takes effect on next billing date.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
