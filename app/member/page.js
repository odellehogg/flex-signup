'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function MemberPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate phone
    const cleanPhone = phone.replace(/\s/g, '')
    if (!/^(\+44|0)?7\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid UK mobile number')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/member/send-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      })

      const data = await response.json()

      if (response.ok) {
        setSent(true)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (err) {
      setError('Connection failed. Please try again.')
    }

    setLoading(false)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-warm-gray py-16">
        <div className="container-width">
          <div className="max-w-md mx-auto">
            {!sent ? (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-flex-navy rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-flex-navy mb-2">Member Login</h1>
                  <p className="text-gray-600">Enter your phone number to receive a login link via WhatsApp</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07123 456789"
                      className="input-field"
                      required
                    />
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Login Link'}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t text-center">
                  <p className="text-gray-500 text-sm mb-4">Or manage your account via WhatsApp</p>
                  <a
                    href="https://wa.me/447366907286?text=MENU"
                    className="inline-flex items-center justify-center space-x-2 text-green-600 hover:text-green-700 font-semibold"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Open WhatsApp</span>
                  </a>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-gray-500 text-sm">
                    Not a member yet?{' '}
                    <Link href="/join" className="text-flex-navy hover:text-gray-700 font-medium">
                      Sign up here
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-flex-navy mb-2">Check WhatsApp!</h1>
                <p className="text-gray-600 mb-6">
                  We've sent a login link to your WhatsApp. Click it to access your account.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-flex-navy hover:text-gray-700 font-medium"
                >
                  Didn't receive it? Try again
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <a
                href="https://wa.me/447366907286?text=CHECK_DROPS"
                className="bg-white rounded-xl p-4 text-center shadow hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-flex-light rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-flex-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="font-medium text-sm text-flex-navy">Check Drops</p>
              </a>
              <a
                href="https://wa.me/447366907286?text=TRACK_ORDER"
                className="bg-white rounded-xl p-4 text-center shadow hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-flex-light rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-flex-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="font-medium text-sm text-flex-navy">Track Order</p>
              </a>
              <a
                href="https://wa.me/447366907286?text=DROP"
                className="bg-white rounded-xl p-4 text-center shadow hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="font-medium text-sm text-flex-navy">New Drop</p>
              </a>
              <a
                href="https://wa.me/447366907286?text=HELP"
                className="bg-white rounded-xl p-4 text-center shadow hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium text-sm text-flex-navy">Get Help</p>
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
