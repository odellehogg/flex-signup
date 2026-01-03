'use client'

// app/member/subscription/page.js
// Subscription management - pause, resume, cancel
// Matches existing member portal style

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [view, setView] = useState('main') // main, pause, cancel

  useEffect(() => {
    if (!token) {
      router.push('/member')
      return
    }
    fetchSubscription()
  }, [token])

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`/api/member/subscription?token=${token}`)
      if (response.status === 401) {
        router.push('/member?error=invalid_token')
        return
      }
      const data = await response.json()
      setSubscription(data)
    } catch (err) {
      setError('Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action, params = {}) => {
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/member/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action, ...params }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Action failed')

      setSuccess(data.message)
      await fetchSubscription()
      setView('main')
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

  const isPaused = subscription?.pauseCollection || subscription?.status === 'paused'
  const isCancelling = subscription?.cancelAtPeriodEnd

  return (
    <>
      <Header />
      <main className="min-h-screen bg-warm-gray py-8">
        <div className="container-width">
          <div className="max-w-md mx-auto">
            
            <Link href={`/member/dashboard?token=${token}`} className="inline-flex items-center text-sm text-gray-600 hover:text-flex-navy mb-6">
              ← Back to dashboard
            </Link>

            <h1 className="text-2xl font-bold text-flex-navy mb-6">Manage Subscription</h1>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

            {/* Status card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Current plan</p>
                  <p className="text-xl font-semibold text-flex-navy">{subscription?.plan || 'Essential'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isPaused ? 'bg-yellow-100 text-yellow-700' :
                  isCancelling ? 'bg-red-100 text-red-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {isPaused ? 'Paused' : isCancelling ? 'Cancelling' : 'Active'}
                </span>
              </div>

              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-gray-600">
                  {isCancelling ? 'Access until' : 'Next billing'}: {' '}
                  <span className="font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </p>
              )}

              {subscription?.pauseResumesAt && (
                <p className="text-sm text-gray-600 mt-1">
                  Resumes: {new Date(subscription.pauseResumesAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>

            {/* Main view */}
            {view === 'main' && (
              <div className="bg-white rounded-2xl shadow-lg divide-y">
                {/* Pause/Resume */}
                {!isCancelling && (
                  <div className="p-6">
                    {isPaused ? (
                      <>
                        <h3 className="font-semibold text-flex-navy">Resume subscription</h3>
                        <p className="text-sm text-gray-600 mt-1">Pick up where you left off.</p>
                        <button onClick={() => handleAction('resume')} disabled={actionLoading} className="mt-4 w-full btn-primary disabled:opacity-50">
                          {actionLoading ? 'Processing...' : 'Resume now'}
                        </button>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-flex-navy">Take a break</h3>
                        <p className="text-sm text-gray-600 mt-1">Pause for up to 1 month. No charges while paused.</p>
                        <button onClick={() => setView('pause')} className="mt-4 w-full btn-secondary">Pause subscription</button>
                      </>
                    )}
                  </div>
                )}

                {/* Cancel/Reactivate */}
                <div className="p-6">
                  {isCancelling ? (
                    <>
                      <h3 className="font-semibold text-flex-navy">Changed your mind?</h3>
                      <p className="text-sm text-gray-600 mt-1">Reactivate and keep your drops.</p>
                      <button onClick={() => handleAction('resume')} disabled={actionLoading} className="mt-4 w-full btn-primary disabled:opacity-50">
                        {actionLoading ? 'Processing...' : 'Reactivate'}
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-flex-navy">Cancel subscription</h3>
                      <p className="text-sm text-gray-600 mt-1">Keep access until billing period ends.</p>
                      <button onClick={() => setView('cancel')} className="mt-4 w-full border border-red-300 text-red-600 py-3 px-4 rounded-lg font-medium hover:bg-red-50">
                        Cancel subscription
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Pause view */}
            {view === 'pause' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-flex-navy mb-4">How long would you like to pause?</h3>
                <div className="space-y-2">
                  {[{ days: 7, label: '1 week' }, { days: 14, label: '2 weeks' }, { days: 30, label: '1 month' }].map(({ days, label }) => (
                    <button key={days} onClick={() => handleAction('pause', { days })} disabled={actionLoading}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-flex-navy transition disabled:opacity-50">
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setView('main')} className="mt-4 w-full text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              </div>
            )}

            {/* Cancel view */}
            {view === 'cancel' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-flex-navy mb-2">Before you go...</h3>
                <p className="text-sm text-gray-600 mb-4">Would you like 20% off for 2 months?</p>
                
                <button onClick={() => handleAction('apply_discount')} disabled={actionLoading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {actionLoading ? 'Processing...' : 'Yes, give me 20% off! 🎉'}
                </button>

                <div className="mt-6 pt-6 border-t">
                  <button onClick={() => handleAction('cancel')} disabled={actionLoading}
                    className="w-full border border-red-300 text-red-600 py-3 px-4 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50">
                    {actionLoading ? 'Processing...' : 'No, cancel my subscription'}
                  </button>
                </div>

                <button onClick={() => setView('main')} className="mt-4 w-full text-sm text-gray-600 hover:text-gray-900">
                  Never mind, keep my subscription
                </button>
              </div>
            )}

            <p className="text-sm text-gray-500 text-center mt-6">
              Questions? Message us on WhatsApp
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
