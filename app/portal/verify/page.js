'use client'

// app/portal/verify/page.js
// Enter verification code sent to WhatsApp

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function PortalVerify() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('')
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef([])

  useEffect(() => {
    // Get phone from session storage
    const storedPhone = sessionStorage.getItem('verify_phone')
    if (!storedPhone) {
      router.push('/portal')
      return
    }
    setPhone(storedPhone)
    
    // Focus first input
    inputRefs.current[0]?.focus()
  }, [router])

  useEffect(() => {
    // Cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (value && index === 5 && newCode.every(d => d)) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      handleSubmit(pastedData)
    }
  }

  const handleSubmit = async (codeString) => {
    const finalCode = codeString || code.join('')
    if (finalCode.length !== 6) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/portal/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: finalCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      // Clear session storage
      sessionStorage.removeItem('verify_phone')
      
      // Redirect to dashboard
      router.push(data.redirect || '/portal/dashboard')

    } catch (err) {
      setError(err.message)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return

    setResending(true)
    setError('')

    try {
      const response = await fetch('/api/portal/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resend code')
      }

      setResendCooldown(60) // 60 second cooldown

    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  const formatPhone = (p) => {
    if (!p) return ''
    if (p.startsWith('44')) {
      return '0' + p.slice(2).replace(/(\d{4})(\d{6})/, '$1 $2')
    }
    return p
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check your WhatsApp</h1>
          <p className="text-gray-600 mt-2">
            We sent a 6-digit code to<br />
            <span className="font-medium text-gray-900">{formatPhone(phone)}</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* Code input */}
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none transition"
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center text-gray-600">
              Verifying...
            </div>
          )}

          {/* Resend link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              {resendCooldown > 0 ? (
                <span className="text-gray-400">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-[#1e3a5f] font-medium hover:underline disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              )}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={() => router.push('/portal')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Use a different phone number
          </button>
        </div>
      </div>
    </div>
  )
}
