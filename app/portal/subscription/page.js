'use client'

// app/portal/subscription/page.js
// Pause, resume, or cancel subscription

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubscriptionPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showPauseOptions, setShowPauseOptions] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/portal/subscription')
      
      if (response.status === 401) {
        router.push('/portal')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load subscription')
      }

      setSubscription(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action, params = {}) => {
    setActionLoading(true)
    setError('')

    try {
      const response = await fetch('/api/portal/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Action failed')
      }

      // Refresh data
      await fetchSubscription()
      setShowCancelConfirm(false)
      setShowPauseOptions(false)

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

  const isPaused = subscription?.pauseCollection || subscription?.status === 'paused'
  const isCancelling = subscription?.cancelAtPeriodEnd

  return (
    <div className="max-w-xl mx-auto space-y-6">
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

      <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Current status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current plan</p>
            <p className="text-xl font-semibold text-gray-900">{subscription?.plan}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isPaused
              ? 'bg-yellow-100 text-yellow-700'
              : isCancelling
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {isPaused ? 'Paused' : isCancelling ? 'Cancelling' : 'Active'}
          </div>
        </div>

        {subscription?.currentPeriodEnd && (
          <p className="text-sm text-gray-600 mt-4">
            {isCancelling ? 'Access until' : 'Next billing'}: {' '}
            <span className="font-medium">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </p>
        )}

        {subscription?.pauseResumesAt && (
          <p className="text-sm text-gray-600 mt-2">
            Resumes: {' '}
            <span className="font-medium">
              {new Date(subscription.pauseResumesAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
        
        {/* Pause/Resume */}
        {!isCancelling && (
          <div className="p-6">
            {isPaused ? (
              <>
                <h3 className="font-semibold text-gray-900">Resume subscription</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Pick up where you left off and start making drops again.
                </p>
                <button
                  onClick={() => handleAction('resume')}
                  disabled={actionLoading}
                  className="mt-4 w-full bg-[#1e3a5f] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d4a6f] transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Resume now'}
                </button>
              </>
            ) : showPauseOptions ? (
              <>
                <h3 className="font-semibold text-gray-900">How long would you like to pause?</h3>
                <div className="mt-4 space-y-2">
                  {[
                    { days: 7, label: '1 week' },
                    { days: 14, label: '2 weeks' },
                    { days: 30, label: '1 month' },
                  ].map(({ days, label }) => (
                    <button
                      key={days}
                      onClick={() => handleAction('pause', { days })}
                      disabled={actionLoading}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-[#1e3a5f] transition disabled:opacity-50"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowPauseOptions(false)}
                  className="mt-4 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900">Take a break</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Pause your subscription for up to 1 month. No charges while paused.
                </p>
                <button
                  onClick={() => setShowPauseOptions(true)}
                  className="mt-4 w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Pause subscription
                </button>
              </>
            )}
          </div>
        )}

        {/* Cancel/Reactivate */}
        <div className="p-6">
          {isCancelling ? (
            <>
              <h3 className="font-semibold text-gray-900">Changed your mind?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Reactivate your subscription and keep your drops.
              </p>
              <button
                onClick={() => handleAction('resume')}
                disabled={actionLoading}
                className="mt-4 w-full bg-[#1e3a5f] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d4a6f] transition disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Reactivate subscription'}
              </button>
            </>
          ) : showCancelConfirm ? (
            <>
              <h3 className="font-semibold text-red-600">Cancel subscription</h3>
              <p className="text-sm text-gray-600 mt-2">
                We're sorry to see you go. Before you leave, would you like 20% off for 2 months?
              </p>
              
              <button
                onClick={() => handleAction('apply_discount')}
                disabled={actionLoading}
                className="mt-4 w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                Yes, give me 20% off! 🎉
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Still want to cancel? Please tell us why:</p>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
                >
                  <option value="">Select a reason...</option>
                  <option value="too_expensive">Too expensive</option>
                  <option value="not_using">Not using it enough</option>
                  <option value="gym_change">Changing gyms</option>
                  <option value="quality">Quality issues</option>
                  <option value="other">Other</option>
                </select>

                <button
                  onClick={() => handleAction('cancel', { reason: cancelReason })}
                  disabled={actionLoading || !cancelReason}
                  className="w-full border border-red-300 text-red-600 py-3 px-4 rounded-lg font-medium hover:bg-red-50 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Cancel at end of billing period'}
                </button>
              </div>

              <button
                onClick={() => setShowCancelConfirm(false)}
                className="mt-4 w-full text-sm text-gray-600 hover:text-gray-900"
              >
                Never mind, keep my subscription
              </button>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-gray-900">Cancel subscription</h3>
              <p className="text-sm text-gray-600 mt-1">
                You'll keep access until the end of your billing period.
              </p>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="mt-4 w-full border border-red-300 text-red-600 py-3 px-4 rounded-lg font-medium hover:bg-red-50 transition"
              >
                Cancel subscription
              </button>
            </>
          )}
        </div>
      </div>

      {/* Help text */}
      <p className="text-sm text-gray-500 text-center">
        Questions? Message us on WhatsApp or email support@flexlaundry.co.uk
      </p>
    </div>
  )
}
