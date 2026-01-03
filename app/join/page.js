'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PLANS } from '@/lib/plans';

function JoinFormContent() {
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get('plan');
  const preselectedGym = searchParams.get('gym');

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan || '');
  const [selectedGym, setSelectedGym] = useState(preselectedGym || '');
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchGyms();
  }, []);

  useEffect(() => {
    if (preselectedPlan) {
      setSelectedPlan(preselectedPlan);
      if (preselectedGym) {
        setSelectedGym(preselectedGym);
        setStep(3);
      } else {
        setStep(2);
      }
    }
  }, [preselectedPlan, preselectedGym]);

  async function fetchGyms() {
    try {
      const res = await fetch('/api/gyms');
      const data = await res.json();
      setGyms(data.gyms || []);
    } catch (err) {
      console.error('Failed to fetch gyms:', err);
    }
  }

  function handlePlanSelect(planId) {
    setSelectedPlan(planId);
    setStep(2);
  }

  function handleGymSelect(gymCode) {
    setSelectedGym(gymCode);
    setStep(3);
  }

  function handleInputChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          gymCode: selectedGym,
          ...formData,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
        setLoading(false);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const plans = Object.values(PLANS);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > s ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 text-sm text-gray-600">
            <span className={step === 1 ? 'font-medium text-green-600' : ''}>
              Choose Plan
            </span>
            <span className="mx-8"></span>
            <span className={step === 2 ? 'font-medium text-green-600' : ''}>
              Select Gym
            </span>
            <span className="mx-8"></span>
            <span className={step === 3 ? 'font-medium text-green-600' : ''}>
              Your Details
            </span>
          </div>
        </div>

        {/* Step 1: Choose Plan */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan === plan.id
                      ? 'border-green-600'
                      : 'border-transparent'
                  } ${plan.popular ? 'ring-2 ring-green-600 ring-offset-2' : ''}`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
                  <p className="text-3xl font-bold mt-2">
                    £{plan.price}
                    <span className="text-base font-normal text-gray-600">
                      {plan.isSubscription ? '/mo' : ''}
                    </span>
                  </p>
                  <p className="text-gray-600 mt-2">{plan.drops} drops{plan.isSubscription ? '/month' : ''}</p>
                  <ul className="mt-4 space-y-2">
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full mt-6 btn-primary">
                    Select {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Gym */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="text-green-600 hover:text-green-700 mb-4 flex items-center"
            >
              ← Back to plans
            </button>
            <h1 className="text-3xl font-bold text-center mb-8">Select Your Gym</h1>
            
            {gyms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No gyms available yet in your area.</p>
                <Link href="/contact" className="text-green-600 hover:text-green-700">
                  Request your gym →
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {gyms.map((gym) => (
                  <div
                    key={gym.code}
                    className={`bg-white rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedGym === gym.code
                        ? 'border-green-600'
                        : 'border-transparent'
                    }`}
                    onClick={() => handleGymSelect(gym.code)}
                  >
                    <h3 className="text-lg font-bold">{gym.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{gym.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Your Details */}
        {step === 3 && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="text-green-600 hover:text-green-700 mb-4 flex items-center"
            >
              ← Back to gym selection
            </button>
            <h1 className="text-3xl font-bold text-center mb-8">Your Details</h1>
            
            <div className="bg-white rounded-xl p-6 shadow-sm max-w-md mx-auto">
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Plan:</strong> {PLANS[selectedPlan]?.name} - £{PLANS[selectedPlan]?.price}
                  {PLANS[selectedPlan]?.isSubscription ? '/mo' : ''}
                </p>
                {selectedGym && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Gym:</strong> {gyms.find(g => g.code === selectedGym)?.name || selectedGym}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (for WhatsApp updates)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+44 7XXX XXXXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="text-green-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-green-600 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <JoinFormContent />
    </Suspense>
  );
}
