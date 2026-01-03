'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const countryCodes = [
  { code: '+44', country: 'UK', flag: '🇬🇧', pattern: /^7\d{9}$/ },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
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
    phone: '',
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
        if (gymsRes.ok) setGyms(await gymsRes.json())
        if (plansRes.ok) setPlans(await plansRes.json())
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
    
    if (country?.pattern) {
      return country.pattern.test(phoneDigits)
    }
    return phoneDigits.length >= 7 && phoneDigits.length <= 15
  }

  const handleNext = () => {
    if (step === 2 && !validatePhone()) {
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

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: fullPhone,
        }),
      })

      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch (error) {
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInterestSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/register-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interestData),
      })
      if (res.ok) {
        setInterestSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting interest:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedGym = gyms.find(g => g.slug === formData.gym)
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
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < totalSteps - 1 && <div className={`w-12 h-1 mx-2 ${step > i + 1 ? 'bg-flex-accent' : 'bg-gray-200'}`}></div>}
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  Step {step} of {totalSteps}: {step === 1 ? 'Choose Your Gym' : step === 2 || (preselectedGym && step === 1) ? 'Your Details' : 'Choose Your Plan'}
                </p>
              </div>
            </div>

            {/* Step 1: Gym Selection (if not preselected) */}
            {step === 1 && !preselectedGym && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-flex-navy mb-6">Choose Your Gym</h2>
                <div className="space-y-4">
                  {gyms.map((gym) => (
                    <label key={gym.slug} className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.gym === gym.slug ? 'border-flex-navy bg-flex-light' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="gym" value={gym.slug} checked={formData.gym === gym.slug} onChange={(e) => setFormData({ ...formData, gym: e.target.value })} className="sr-only" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-flex-navy">{gym.name}</p>
                          <p className="text-sm text-gray-500">{gym.address}, {gym.postcode}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${formData.gym === gym.slug ? 'border-flex-navy bg-flex-navy' : 'border-gray-300'}`}>
                          {formData.gym === gym.slug && <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <button onClick={() => setShowInterestModal(true)} className="mt-4 text-flex-navy hover:underline text-sm">Can't find your gym? →</button>
                <button onClick={handleNext} disabled={!formData.gym} className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
              </div>
            )}

            {/* Step 2: Your Details */}
            {((step === 2 && !preselectedGym) || (step === 1 && preselectedGym)) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-flex-navy mb-6">Your Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="input-field" placeholder="John" required /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="input-field" placeholder="Smith" required /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="john@example.com" required /></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (for WhatsApp)</label>
                    <div className="flex space-x-2">
                      <select value={formData.countryCode} onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })} className="input-field w-32">
                        {countryCodes.map((c) => (<option key={c.code} value={c.code}>{c.flag} {c.code}</option>))}
                      </select>
                      <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field flex-1" placeholder={formData.countryCode === '+44' ? '7123 456789' : 'Phone number'} required />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">We'll send you updates via WhatsApp</p>
                  </div>
                </div>
                <div className="flex space-x-4 mt-6">
                  {!preselectedGym && <button onClick={handleBack} className="btn-secondary flex-1">Back</button>}
                  <button onClick={() => setStep(preselectedGym ? 2 : 3)} disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
                </div>
              </div>
            )}

            {/* Step 3: Plan Selection */}
            {((step === 3 && !preselectedGym) || (step === 2 && preselectedGym)) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-flex-navy mb-6">Choose Your Plan</h2>
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <label key={plan.slug} className={`block p-4 border-2 rounded-xl cursor-pointer transition-all relative ${formData.plan === plan.slug ? 'border-flex-navy bg-flex-light' : 'border-gray-200 hover:border-gray-300'}`}>
                      {plan.isPopular && <span className="absolute -top-2 right-4 bg-flex-accent text-white text-xs px-2 py-1 rounded-full">Most Popular</span>}
                      <input type="radio" name="plan" value={plan.slug} checked={formData.plan === plan.slug} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} className="sr-only" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-flex-navy">{plan.name}</p>
                          <p className="text-sm text-gray-500">{plan.drops} drop{plan.drops !== 1 ? 's' : ''} {plan.slug !== 'single' ? 'per month' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-flex-navy">£{plan.price}</p>
                          <p className="text-xs text-gray-500">{plan.slug === 'single' ? 'per drop' : 'per month'}</p>
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
                      <p><span className="font-medium">Plan:</span> {selectedPlan.name} - £{selectedPlan.price}{selectedPlan.slug === 'single' ? '' : '/month'}</p>
                    </div>
                  </div>
                )}
                <div className="flex space-x-4 mt-6">
                  <button onClick={() => setStep(preselectedGym ? 1 : 2)} className="btn-secondary flex-1">Back</button>
                  <button onClick={handleSubmit} disabled={!formData.plan || submitting} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? 'Processing...' : 'Continue to Payment'}</button>
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
                  <div className="w-16 h-16 bg-flex-accent rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                  <h3 className="text-xl font-bold text-flex-navy mb-2">Thanks!</h3>
                  <p className="text-gray-600 mb-4">We'll let you know when FLEX is available at your gym.</p>
                  <button onClick={() => { setShowInterestModal(false); setInterestSubmitted(false) }} className="btn-primary">Close</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-flex-navy">Request Your Gym</h3>
                    <button onClick={() => setShowInterestModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Tell us where you work out and we'll try to bring FLEX there.</p>
                  <form onSubmit={handleInterestSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="First name" value={interestData.firstName} onChange={(e) => setInterestData({ ...interestData, firstName: e.target.value })} className="input-field" required />
                      <input type="text" placeholder="Last name" value={interestData.lastName} onChange={(e) => setInterestData({ ...interestData, lastName: e.target.value })} className="input-field" />
                    </div>
                    <input type="email" placeholder="Email" value={interestData.email} onChange={(e) => setInterestData({ ...interestData, email: e.target.value })} className="input-field" required />
                    <input type="text" placeholder="Gym name" value={interestData.gymName} onChange={(e) => setInterestData({ ...interestData, gymName: e.target.value })} className="input-field" required />
                    <input type="text" placeholder="Location (postcode or area)" value={interestData.location} onChange={(e) => setInterestData({ ...interestData, location: e.target.value })} className="input-field" />
                    <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">{submitting ? 'Submitting...' : 'Notify Me'}</button>
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
