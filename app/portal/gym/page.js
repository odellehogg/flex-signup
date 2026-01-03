'use client'

// app/portal/gym/page.js
// Change gym location

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GymPage() {
  const router = useRouter()
  const [currentGym, setCurrentGym] = useState(null)
  const [gyms, setGyms] = useState([])
  const [selectedGym, setSelectedGym] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchGyms()
  }, [])

  const fetchGyms = async () => {
    try {
      const response = await fetch('/api/portal/gym')
      
      if (response.status === 401) {
        router.push('/portal')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load gyms')
      }

      setCurrentGym(data.currentGym)
      setGyms(data.availableGyms)
    } catch (err) {
      setError(err.message)
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
      const response = await fetch('/api/portal/gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId: selectedGym }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change gym')
      }

      setCurrentGym(data.newGym)
      setSelectedGym(null)
      setSuccess(`Successfully changed to ${data.newGym.name}!`)

      // Redirect after short delay
      setTimeout(() => router.push('/portal/dashboard'), 2000)

    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredGyms = gyms.filter(gym => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      gym.name.toLowerCase().includes(query) ||
      gym.address?.toLowerCase().includes(query) ||
      gym.area?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

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

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change gym</h1>
        <p className="text-gray-600 mt-1">
          Select a new gym for your drops
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Current gym */}
      {currentGym && (
        <div className="bg-[#1e3a5f] text-white rounded-xl p-6">
          <p className="text-sm opacity-80">Current gym</p>
          <p className="text-xl font-semibold mt-1">{currentGym.name}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search gyms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
        />
      </div>

      {/* Gym list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
        {filteredGyms.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No gyms found matching "{searchQuery}"
          </div>
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
                  isCurrent
                    ? 'bg-gray-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isCurrent ? 'text-gray-400' : 'text-gray-900'}`}>
                      {gym.name}
                    </p>
                    {gym.address && (
                      <p className="text-sm text-gray-500 mt-0.5">{gym.address}</p>
                    )}
                    {gym.area && (
                      <p className="text-xs text-gray-400 mt-0.5">{gym.area}</p>
                    )}
                  </div>
                  {isCurrent ? (
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                      Current
                    </span>
                  ) : isSelected ? (
                    <div className="w-6 h-6 bg-[#1e3a5f] rounded-full flex items-center justify-center">
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
        <button
          onClick={handleChangeGym}
          disabled={actionLoading}
          className="w-full bg-[#1e3a5f] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d4a6f] transition disabled:opacity-50"
        >
          {actionLoading ? 'Updating...' : 'Confirm gym change'}
        </button>
      )}

      {/* Note */}
      <p className="text-sm text-gray-500 text-center">
        Your next drop will be at the new gym location. Any in-progress drops will still be returned to your previous gym.
      </p>
    </div>
  )
}
