// components/MemberDashboardClient.js
// Original design + session-based authentication integration
// Works with cookie-based login system (/portal/login)

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
  ChevronRight,
  LogOut
} from 'lucide-react'

export default function MemberDashboardClient({ member, subscription, drops }) {
  const [billingLoading, setBillingLoading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Calculate drops info
  const dropsRemaining = member.dropsRemaining || 0
  const totalDrops = member.totalDrops || 0
  const dropsUsed = totalDrops - dropsRemaining
  const dropsAllowed = getPlanDrops(member.plan)

  // Get active drop (first non-collected drop)
  const activeDrop = drops?.find(d => d.status !== 'Collected')
  const recentDrops = drops?.slice(0, 5) || []

  function getPlanDrops(plan) {
    if (!plan) return 0
    const planLower = plan.toLowerCase()
    if (planLower.includes('unlimited')) return 16
    if (planLower.includes('essential')) return 10
    if (planLower.includes('single') || planLower.includes('one')) return 1
    return 10
  }

  const handleManageBilling = async () => {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/portal/billing', {
        method: 'POST',
        credentials: 'include',
      })
      
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No billing URL returned')
      }
    } catch (error) {
      console.error('Billing portal error:', error)
    } finally {
      setBillingLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/portal/logout', {
        method: 'POST',
        credentials: 'include',
      })
      window.location.href = '/portal/login'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/portal/login'
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
      case 'In Transit': return 'bg-purple-100 text-purple-700'
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
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-flex-navy to-[#2a2a2a] text-white rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {member.firstName}!</h1>
                <p className="text-gray-300">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-2 text-white/60 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Drops Remaining</span>
              <Package className="w-5 h-5 text-flex-navy" />
            </div>
            <p className="text-3xl font-bold text-flex-navy">{dropsRemaining}</p>
            <p className="text-sm text-gray-500 mt-1">of {dropsAllowed} this month</p>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-flex-accent rounded-full transition-all"
                style={{ width: `${Math.min((dropsUsed / dropsAllowed) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Your Plan</span>
              <CreditCard className="w-5 h-5 text-flex-navy" />
            </div>
            <p className="text-2xl font-bold text-flex-navy">{member.plan || 'None'}</p>
            {subscription && (
              <p className="text-xs text-gray-500 mt-1">
                {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'}: {subscription.currentPeriodEnd}
              </p>
            )}
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="mt-3 text-sm text-flex-accent hover:text-emerald-700 flex items-center"
            >
              {billingLoading ? 'Loading...' : 'Manage billing'} <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Your Gym</span>
              <MapPin className="w-5 h-5 text-flex-navy" />
            </div>
            <p className="text-lg font-bold text-flex-navy">{member.gym || 'Not set'}</p>
            <a
              href="https://wa.me/447366907286?text=CHANGE_GYM"
              className="mt-3 text-sm text-flex-accent hover:text-emerald-700 flex items-center"
            >
              Change gym <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>

        {/* Active Drop */}
        {activeDrop && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800">Active Drop</p>
                  <p className="text-2xl font-bold text-amber-900">Bag {activeDrop.bagNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDropStatusColor(activeDrop.status)}`}>
                  {activeDrop.status === 'Dropped' && <Clock className="w-4 h-4 mr-1" />}
                  {activeDrop.status === 'At Laundry' && <Clock className="w-4 h-4 mr-1 animate-spin" />}
                  {activeDrop.status === 'Ready' && <CheckCircle className="w-4 h-4 mr-1" />}
                  {activeDrop.status}
                </span>
                <p className="text-sm text-amber-600 mt-1">
                  {activeDrop.status === 'Ready' 
                    ? 'Ready for pickup!' 
                    : `Expected: ${formatDate(activeDrop.expectedReady)}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Recent Drops */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Drops</h2>
            
            {recentDrops.length > 0 ? (
              <div className="space-y-3">
                {recentDrops.map((drop) => (
                  <div key={drop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-medium">{drop.bagNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDropStatusColor(drop.status)}`}>
                        {drop.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(drop.dropDate)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No drops yet</p>
                <a
                  href="https://wa.me/447366907286?text=DROP"
                  className="inline-flex items-center mt-4 text-flex-accent hover:text-emerald-700"
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
                href="https://wa.me/447366907286?text=DROP"
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
                href="https://wa.me/447366907286?text=TRACK"
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
                href="https://wa.me/447366907286?text=MANAGE"
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
                href="https://wa.me/447366907286?text=HELP"
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
              disabled={billingLoading}
              className="flex items-center text-flex-accent hover:text-emerald-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {billingLoading ? 'Loading...' : 'Manage billing & invoices'}
            </button>
            <a
              href="https://wa.me/447366907286?text=MY_ACCOUNT"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Update details via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
