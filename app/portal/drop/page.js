// app/portal/drop/page.js
// ============================================================================
// PORTAL DROP PAGE
// Allows members to start a drop via web instead of WhatsApp
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PortalDropPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [member, setMember] = useState(null);
  const [bagNumber, setBagNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Load member data on mount
  useEffect(() => {
    fetchMemberData();
  }, []);

  async function fetchMemberData() {
    try {
      const res = await fetch('/api/portal/me');
      const data = await res.json();
      
      if (!res.ok || !data.member) {
        router.push('/portal/login');
        return;
      }
      
      setMember(data.member);
    } catch (err) {
      console.error('Error fetching member:', err);
      router.push('/portal/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/portal/drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bagNumber: bagNumber.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit drop');
        return;
      }

      setSuccess({
        bagNumber: data.bagNumber,
        expectedDate: data.expectedDate,
        dropsRemaining: data.dropsRemaining,
      });
      setBagNumber('');
      
      // Refresh member data to update drops remaining
      fetchMemberData();

    } catch (err) {
      console.error('Error submitting drop:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const dropsRemaining = member?.fields?.['Drops Remaining'] || 0;
  const gymName = member?.fields?.['Gym Name']?.[0] || 'your gym';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/portal" 
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Start a Drop</h1>
          <p className="text-gray-600 mt-1">at {gymName}</p>
        </div>

        {/* Drops Remaining */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Drops remaining this month</span>
            <span className={`text-2xl font-bold ${dropsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dropsRemaining}
            </span>
          </div>
        </div>

        {dropsRemaining <= 0 ? (
          /* No Drops Remaining */
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="text-amber-800 font-medium">You've used all your drops this month</p>
            <p className="text-amber-700 text-sm mt-2">
              Your drops will reset on your next billing date.
            </p>
            <Link
              href="/portal"
              className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Upgrade Plan
            </Link>
          </div>
        ) : (
          <>
            {/* Instructions */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Instructions</h2>
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <span>Get a FLEX bag from reception</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <span>Fill with gym clothes (tops, shorts, leggings, socks, towels)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <span>Note the bag number on the tag</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <span>Leave at reception before 6pm</span>
                </li>
              </ol>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Bag {success.bagNumber} confirmed!</p>
                    <p className="text-green-700 text-sm">Expected ready: {success.expectedDate}</p>
                  </div>
                </div>
                <p className="text-green-700 text-sm">We'll WhatsApp you when it's ready for pickup.</p>
              </div>
            )}

            {/* Bag Number Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
              <label htmlFor="bagNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Bag Number
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  id="bagNumber"
                  value={bagNumber}
                  onChange={(e) => {
                    setBagNumber(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="e.g. B042"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-mono uppercase"
                  maxLength={5}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={submitting || !bagNumber.trim()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              <p className="mt-3 text-sm text-gray-500">
                You'll find the bag number on the tag attached to the bag (e.g. B001, B042)
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
