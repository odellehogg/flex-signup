'use client'

// app/join/page.js
// FIXES:
//   - gyms: was setGyms(await gymsRes.json()) getting {gyms:[...]} object
//     now: setGyms((await gymsRes.json()).gyms || [])
//   - gym.slug → gym.code (API returns code, not slug)
//   - gym.postcode removed (API doesn't return it)
//   - form sends 'plan' and 'gym' — matches what checkout route expects

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const countryCodes = [
  { code: '+44', country: 'UK', flag: '🇬🇧', pattern: /^7\d{9}$/ },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
]

function JoinPageContent() {
  const searchParams = useSearchParams()
  const preselectedGym = searchParams.get('gym')
  const preselectedPlan = searchParams.get('plan')

  const [step, setStep] = useState(preselectedGym ? 2 : 1)
  const [gyms, setGyms] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showInterestModal, setShowInterestModal] = useState(false)
  const [interestSubmitted, setInterestSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    gym: preselectedGym || '',
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+44',
    phone: '',
    plan: preselectedPlan || '',
  })

  const [interestData, setInterestData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gymName: '',
    location: '',
  })

  const totalSteps = preselectedGym ? 2 : 3

  useEffect(() => {
    async function fetchData() {
      try {
        const [gymsRes, plansRes] = await Promise.all([
          fetch('/api/gyms'),
          fetch('/api/plans'),
        ])

        // FIX: API returns { gyms: [...] } — was setting gyms to the wrapper object
        if (gymsRes.ok) {
          const gymsData = await gymsRes.json()
          setGyms(gymsData.gyms || [])
        }

        if (plansRes.ok) {
          setPlans(await plansRes.json())
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const validatePhone = () => {
    const country = countryCodes.find(c => c.code === formData.countryCode)
    let phoneDigits = formData.phone.replace(/\D/g, '')
    if (phoneDigits.startsWith('0')) phoneDigits = phoneDigits.substring(1)
    if (country?.pattern) return country.pattern.test(phoneDigits)
    return phoneDigits.length >= 7 && phoneDigits.length <= 15
  }

  const handleNext = () => {
    if (step === 2 && !preselectedGym && !validatePhone()) {
      alert('Please enter a valid phone number')
      return
    }
    if ((step === 1 && preselectedGym) && !validatePhone()) {
      alert('Please enter a valid phone number')
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => setStep(step - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      let phoneDigits = formData.phone.replace(/\D/g, '')
      if (phoneDigits.startsWith('0')) phoneDigits = phoneDigits.substring(1)
      const fullPhone = `${formData.countryCode}${phoneDigits}`

      // formData already uses 'plan' and 'gym' which matches the checkout API
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: formData.plan,
          gym: formData.gym,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: fullPhone,
        }),
      })

      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
      } else {
        const data = await res.json()
        alert(data.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInterestSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interestData),
      })
      setInterestSubmitted(true)
    } catch (error) {
      console.error('Error submitting interest:', error)
      setInterestSubmitted(true) // Show success even on network error (data may have saved)
    } finally {
      setSubmitting(false)
    }
  }

  // FIX: gyms from API have { id, code, name, address } — not slug/postcode
  const selectedGym = gyms.find(g => g.code === formData.gym)
  const selectedPlan = plans.find(p => p.slug === formData.plan)

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-warm-white section-padding">
          <div className="container-width">
            <div className="max-w-xl mx-auto text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-warm-white section-padding">
        <div className="container-width">
          <div className="max-w-xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-center">
                {[...Array(totalSteps)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step > i ? 'bg-flex-accent text-white' : step === i + 1 ? 'bg-flex-navy text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {step > i + 1 ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < totalSteps - 1 && (
                      <div className={`w-12 h-1 mx-2 ${step > i + 1 ? 'bg-flex-accent' : 'bg-gray-200'}`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  Step {step} of {totalSteps}:{' '}
                  {step === 1 && !preselectedGym ? 'Choose Your Gym' :
                   (step === 2 && !preselectedGym) || (step === 1 && preselectedGym) ? 'Your Details' :
                   'Choose Your Plan'}
                </p>
              </div>
            </div>

            {/* Step 1: Gym Selection */}
            {step === 1 && !preselectedGym && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-flex-navy mb-6">Choose Your Gym</h2>

                {gyms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-4">No gyms available in your area yet.</p>
                    <button
                      onClick={() => setShowInterestModal(true)}
                      className="btn-primary"
                    >
                      Register Your Gym's Interest
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* FIX: use gym.code not gym.slug (API returns code, not slug) */}
                    {gyms.map((gym) => (
                      <label
                        key={gym.code}
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.gym === gym.code
                            ? 'border-flex-navy bg-flex-light'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="gym"
                          value={gym.code}
                          checked={formData.gym === gym.code}
                          onChange={(e) => setFormData({ ...formData, gym: e.target.value })}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-flex-navy">{gym.name}</p>
                            {/* FIX: removed gym.postcode — API doesn't return it */}
                            <p className="text-sm text-gray-500">{gym.address}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${formData.gym === gym.code ? 'border-flex-navy bg-flex-navy' : 'border-gray-300'}`}>
                            {formData.gym === gym.code && (
                              <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowInterestModal(true)}
                  className="mt-4 text-flex-navy hover:underline text-sm"
                >
                  Can't find your gym? →
                </button>

                <button
                  onClick={handleNext}
                  disabled={!formData.gym}
                  className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Your Details */}
            {((step === 2 && !preselectedGym) || (step === 1 && preselectedGym)) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-flex-navy mb-6">Your Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="input-field"
                        placeholder="Jane"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="input-field"
                        placeholder="Smith"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                      placeholder="jane@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (for WhatsApp updates)</label>
                    <div className="flex space-x-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="input-field w-32"
                      >
                        {countryCodes.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input-field flex-1"
                        placeholder={formData.countryCode === '+44' ? '7123 456789' : 'Phone number'}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">We'll send you bag status updates via WhatsApp</p>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  {!preselectedGym && (
                    <button onClick={handleBack} className="btn-secondary flex-1">Back</button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={!formData.firstName || !formData.email || !formData.phone}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Plan Selection */}
            {((step === 3 && !preselectedGym) || (step === 2 && preselectedGym)) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-flex-navy mb-6">Choose Your Plan</h2>
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <label
                      key={plan.slug}
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all relative ${
                        formData.plan === plan.slug
                          ? 'border-flex-navy bg-flex-light'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-2 right-4 bg-flex-accent text-white text-xs px-2 py-1 rounded-full">
                          Most Popular
                        </span>
                      )}
                      <input
                        type="radio"
                        name="plan"
                        value={plan.slug}
                        checked={formData.plan === plan.slug}
                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-flex-navy">{plan.name}</p>
                          <p className="text-sm text-gray-500">
                            {plan.drops} drop{plan.drops !== 1 ? 's' : ''}{' '}
                            {plan.slug !== 'single' && plan.slug !== 'oneoff' && plan.slug !== 'payg' ? 'per month' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-flex-navy">£{plan.price}</p>
                          <p className="text-xs text-gray-500">
                            {plan.isSubscription ? 'per month' : 'one-time'}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedGym && selectedPlan && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-flex-navy mb-2">Order Summary</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Gym:</span> {selectedGym.name}</p>
                      <p>
                        <span className="font-medium">Plan:</span> {selectedPlan.name} —
                        £{selectedPlan.price}{selectedPlan.isSubscription ? '/month' : ''}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setStep(preselectedGym ? 1 : 2)}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.plan || submitting}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : 'Continue to Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Register Interest Modal */}
        {showInterestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              {interestSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-flex-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-flex-navy mb-2">Thanks!</h3>
                  <p className="text-gray-600 mb-4">We'll let you know when FLEX is available at your gym.</p>
                  <button
                    onClick={() => { setShowInterestModal(false); setInterestSubmitted(false) }}
                    className="btn-primary"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-flex-navy">Request Your Gym</h3>
                    <button
                      onClick={() => setShowInterestModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Tell us where you work out and we'll try to bring FLEX there.</p>
                  <form onSubmit={handleInterestSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="First name"
                        value={interestData.firstName}
                        onChange={(e) => setInterestData({ ...interestData, firstName: e.target.value })}
                        className="input-field"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Last name"
                        value={interestData.lastName}
                        onChange={(e) => setInterestData({ ...interestData, lastName: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={interestData.email}
                      onChange={(e) => setInterestData({ ...interestData, email: e.target.value })}
                      className="input-field"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Gym name"
                      value={interestData.gymName}
                      onChange={(e) => setInterestData({ ...interestData, gymName: e.target.value })}
                      className="input-field"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Location (postcode or area)"
                      value={interestData.location}
                      onChange={(e) => setInterestData({ ...interestData, location: e.target.value })}
                      className="input-field"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-primary disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Notify Me'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen bg-warm-white section-padding">
          <div className="container-width">
            <div className="max-w-xl mx-auto text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    }>
      <JoinPageContent />
    </Suspense>
  )
}
