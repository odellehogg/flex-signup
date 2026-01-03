'use client'

// app/member/gym/page.js
// Change gym location
// Matches existing member portal style

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function GymPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [currentGym, setCurrentGym] = useState(null)
  const [gyms, setGyms] = useState([])
  const [selectedGym, setSelectedGym] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!token) {
      router.push('/member')
      return
    }
    fetchGyms()
  }, [token])

  const fetchGyms = async () => {
    try {
      const response = await fetch(`/api/member/gym?token=${token}`)
      if (response.status === 401) {
        router.push('/member?error=invalid_token')
        return
      }
      const data = await response.json()
      setCurrentGym(data.currentGym)
      setGyms(data.availableGyms || [])
    } catch (err) {
      setError('Failed to load gyms')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeGym = async () => {
    if (!selectedGym || selectedGym === currentGym?.id) return

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/member/gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, gymId: selectedGym }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to change gym')

      setCurrentGym(data.newGym)
      setSelectedGym(null)
      setSuccess(data.message)
      setTimeout(() => router.push(`/member/dashboard?token=${token}`), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredGyms = gyms.filter(gym => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return gym.name?.toLowerCase().includes(q) || gym.address?.toLowerCase().includes(q) || gym.area?.toLowerCase().includes(q)
  })

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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-warm-gray py-8">
        <div className="container-width">
          <div className="max-w-md mx-auto">
            
            <Link href={`/member/dashboard?token=${token}`} className="inline-flex items-center text-sm text-gray-600 hover:text-flex-navy mb-6">
              ← Back to dashboard
            </Link>

            <h1 className="text-2xl font-bold text-flex-navy mb-2">Change Gym</h1>
            <p className="text-gray-600 mb-6">Select a new gym for your drops</p>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

            {/* Current gym */}
            {currentGym && (
              <div className="bg-flex-navy text-white rounded-2xl p-5 mb-6">
                <p className="text-sm opacity-80">Current gym</p>
                <p className="text-lg font-semibold mt-1">{currentGym.name}</p>
              </div>
            )}

            {/* Search */}
            <input
              type="text"
              placeholder="Search gyms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field mb-4"
            />

            {/* Gym list */}
            <div className="bg-white rounded-2xl shadow-lg divide-y max-h-[350px] overflow-y-auto">
              {filteredGyms.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No gyms found</div>
              ) : (
                filteredGyms.map((gym) => {
                  const isCurrent = gym.id === currentGym?.id
                  const isSelected = gym.id === selectedGym

                  return (
                    <button
                      key={gym.id}
                      onClick={() => !isCurrent && setSelectedGym(gym.id)}
                      disabled={isCurrent}
                      className={`w-full text-left p-4 transition ${
                        isCurrent ? 'bg-gray-50 cursor-not-allowed' :
                        isSelected ? 'bg-flex-light' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${isCurrent ? 'text-gray-400' : 'text-flex-navy'}`}>{gym.name}</p>
                          {gym.address && <p className="text-sm text-gray-500 mt-0.5">{gym.address}</p>}
                        </div>
                        {isCurrent ? (
                          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Current</span>
                        ) : isSelected ? (
                          <div className="w-6 h-6 bg-flex-navy rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Confirm button */}
            {selectedGym && selectedGym !== currentGym?.id && (
              <button onClick={handleChangeGym} disabled={actionLoading} className="w-full btn-primary mt-6 disabled:opacity-50">
                {actionLoading ? 'Updating...' : 'Confirm gym change'}
              </button>
            )}

            <p className="text-sm text-gray-500 text-center mt-6">
              In-progress drops will still be returned to your previous gym.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
