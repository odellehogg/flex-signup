// components/MemberDashboardClient.js
// Client-side member dashboard with self-service features

'use client'

import { useState } from 'react'
import { 
  User, 
  MapPin, 
  Package, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  ChevronRight
} from 'lucide-react'

export default function MemberDashboardClient({ member, token }) {
  const [loading, setLoading] = useState(false)

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/member/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Billing portal error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'paused': return 'bg-amber-100 text-amber-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDropStatusColor = (status) => {
    switch (status) {
      case 'Dropped': return 'bg-amber-100 text-amber-700'
      case 'At Laundry': return 'bg-blue-100 text-blue-700'
      case 'Ready': return 'bg-green-100 text-green-700'
      case 'Collected': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-flex-navy to-[#2a4a6f] text-white rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {member.firstName}!</h1>
              <p className="text-blue-200">{member.email}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(member.status)}`}>
            {member.status}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Drops Remaining</span>
            <Package className="w-5 h-5 text-flex-navy" />
          </div>
          <p className="text-3xl font-bold text-flex-navy">{member.dropsRemaining}</p>
          <p className="text-sm text-gray-500 mt-1">of {member.dropsAllowed} this month</p>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-flex-navy rounded-full"
              style={{ width: `${(member.dropsUsed / member.dropsAllowed) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Your Plan</span>
            <CreditCard className="w-5 h-5 text-flex-navy" />
          </div>
          <p className="text-2xl font-bold text-flex-navy">{member.plan}</p>
          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="mt-3 text-sm text-flex-navy hover:text-gray-700 flex items-center"
          >
            {loading ? 'Loading...' : 'Manage billing'} <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Your Gym</span>
            <MapPin className="w-5 h-5 text-flex-navy" />
          </div>
          <p className="text-lg font-bold text-flex-navy">{member.gym}</p>
          <a
            href={`https://wa.me/447366907286?text=CHANGE_GYM`}
            className="mt-3 text-sm text-flex-navy hover:text-gray-700 flex items-center"
          >
            Change gym <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>

      {/* Active Drop */}
      {member.activeDrop && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-800">Active Drop</p>
                <p className="text-2xl font-bold text-amber-900">Bag {member.activeDrop.bagNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDropStatusColor(member.activeDrop.status)}`}>
                {member.activeDrop.status === 'Dropped' && <Clock className="w-4 h-4 mr-1" />}
                {member.activeDrop.status === 'At Laundry' && <Clock className="w-4 h-4 mr-1 animate-spin" />}
                {member.activeDrop.status === 'Ready' && <CheckCircle className="w-4 h-4 mr-1" />}
                {member.activeDrop.status}
              </span>
              <p className="text-sm text-amber-600 mt-1">Dropped {formatDate(member.activeDrop.droppedAt)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Drops */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Drops</h2>
          
          {member.recentDrops.length > 0 ? (
            <div className="space-y-3">
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
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No drops yet this month</p>
              <a
                href={`https://wa.me/447366907286?text=DROP`}
                className="inline-flex items-center mt-4 text-flex-navy hover:text-gray-700"
              >
                Start a drop <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="space-y-3">
            <a
              href={`https://wa.me/447366907286?text=DROP`}
              className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-green-800">New Drop</span>
              </div>
              <ChevronRight className="w-5 h-5 text-green-600" />
            </a>

            <a
              href={`https://wa.me/447366907286?text=TRACK`}
              className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-blue-800">Track My Bag</span>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-600" />
            </a>

            <a
              href={`https://wa.me/447366907286?text=MANAGE`}
              className="flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-purple-800">Manage Subscription</span>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-600" />
            </a>

            <a
              href={`https://wa.me/447366907286?text=HELP`}
              className="flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-medium text-amber-800">Get Help</span>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-600" />
            </a>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Account Details</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{member.firstName} {member.lastName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{member.phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Gym</p>
              <p className="font-medium">{member.gym}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="flex items-center text-flex-navy hover:text-gray-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Manage billing & invoices'}
          </button>
          <a
            href={`https://wa.me/447366907286?text=MY_ACCOUNT`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Update details via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
