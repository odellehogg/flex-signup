// app/ops/members/page.js
// Member lookup and management

'use client'

import { useState } from 'react'
import { Search, User, Phone, Mail, MapPin, CreditCard, Package, Calendar, Loader2 } from 'lucide-react'

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [member, setMember] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setError('')
    setMember(null)

    try {
      const res = await fetch(`/api/ops/members/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()

      if (res.ok && data.member) {
        setMember(data.member)
      } else {
        setError(data.error || 'Member not found')
      }
    } catch (err) {
      setError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'paused': return 'bg-amber-100 text-amber-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'past due': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDropStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'dropped': return 'bg-amber-100 text-amber-700'
      case 'at laundry': return 'bg-blue-100 text-blue-700'
      case 'ready': return 'bg-green-100 text-green-700'
      case 'collected': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Member Lookup</h1>
        <p className="text-gray-500">Search by phone, email, name, or bag number</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter phone number, email, name, or bag number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-lg"
              autoFocus
            />
          </div>
          <button 
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-6 py-3 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2a4a6f] transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {searching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span>Search</span>
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* Member Card */}
      {member && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4a6f] text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{member.firstName} {member.lastName}</h2>
                  <p className="text-blue-200">{member.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{member.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Gym</p>
                    <p className="font-medium">{member.gym || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Bag Number</p>
                    <p className="font-mono font-medium">{member.bagNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Plan</p>
                    <p className="font-medium">{member.plan || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">{formatDate(member.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Next Billing</p>
                    <p className="font-medium">{formatDate(member.nextBilling)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drops Usage */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Drops This Month</span>
                <span className="text-lg font-bold text-[#1e3a5f]">
                  {member.dropsUsed || 0} / {member.dropsAllowed || 10}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1e3a5f] rounded-full"
                  style={{ width: `${((member.dropsUsed || 0) / (member.dropsAllowed || 10)) * 100}%` }}
                />
              </div>
            </div>

            {/* Recent Drops */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Recent Drops</h3>
              {member.recentDrops && member.recentDrops.length > 0 ? (
                <div className="space-y-2">
                  {member.recentDrops.map((drop, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm font-medium">{drop.bagNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDropStatusColor(drop.status)}`}>
                          {drop.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(drop.date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No drops recorded</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center space-x-3">
            <a 
              href={`https://wa.me/${member.phone?.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Message on WhatsApp
            </a>
            <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              View Full History
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!member && !error && !searching && (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for a member</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter a phone number, email address, member name, or bag number to find their account details.
          </p>
        </div>
      )}
    </div>
  )
}
