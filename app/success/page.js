'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setError('No session found');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/checkout/success?session_id=${sessionId}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to verify session');
        }

        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/join" className="btn-primary">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to FLEX! 🎉
          </h1>
          
          <p className="text-gray-600 mb-8">
            Your {data?.plan} subscription is now active.
          </p>

          {/* What's Next */}
          <div className="bg-gray-50 rounded-xl p-6 text-left mb-8">
            <h2 className="font-bold text-lg mb-4">What happens next?</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  1
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Check WhatsApp</h3>
                  <p className="text-sm text-gray-600">
                    We've sent you a welcome message with your account details.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  2
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Visit your gym</h3>
                  <p className="text-sm text-gray-600">
                    Head to {data?.gym || 'your gym'} and ask reception for a FLEX bag.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  3
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Drop your clothes</h3>
                  <p className="text-sm text-gray-600">
                    Fill the bag with your sweaty gym clothes and leave it at reception.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  4
                </div>
                <div className="ml-4">
                  <h3 className="font-medium">Collect fresh clothes</h3>
                  <p className="text-sm text-gray-600">
                    We'll wash and return your clothes within 48 hours. We'll text you when ready!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/portal" className="btn-primary">
              Go to My Account
            </Link>
            <Link href="/how-it-works" className="btn-secondary">
              Learn More
            </Link>
          </div>

          {/* Confirmation Email */}
          <p className="text-sm text-gray-500 mt-8">
            A confirmation email has been sent to {data?.email}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
