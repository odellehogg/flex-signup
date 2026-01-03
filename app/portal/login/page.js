'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState('phone'); // 'phone' or 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/portal/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/portal/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      // Redirect to dashboard
      router.push('/portal');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-emerald-600">
            FLEX
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Member Portal
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'phone' 
              ? 'Enter your phone number to login'
              : 'Enter the code we sent to WhatsApp'
            }
          </p>
        </div>

        <div className="card">
          {step === 'phone' ? (
            <form onSubmit={handleRequestCode}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7123 456789"
                  required
                  className="input"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  The phone number you signed up with
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Login Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  maxLength={6}
                  className="input text-center text-2xl tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Check WhatsApp for your 6-digit code
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError('');
                }}
                className="w-full mt-3 text-emerald-600 hover:underline text-sm"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link href="/join" className="text-emerald-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
