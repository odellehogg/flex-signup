// components/ops/LaundryTabs.js
// Tabbed interface for laundry operations with multi-partner support

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Clock, AlertCircle, CheckCircle, Loader2, Building2, ChevronDown, ChevronUp } from 'lucide-react'

export default function LaundryTabs({ 
  inTransit, 
  atLaundry, 
  inTransitByPartner = [], 
  atLaundryByPartner = [],
  laundryPartners = []
}) {
  const [activeTab, setActiveTab] = useState('incoming')
  const [loading, setLoading] = useState(false)
  const [expandedPartner, setExpandedPartner] = useState(null)
  const [viewMode, setViewMode] = useState('partner') // 'partner' or 'all'
  const router = useRouter()

  const handleConfirmReceipt = async (dropIds) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ops/drops/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dropIds, 
          newStatus: 'At Laundry',
          action: 'arrive_at_laundry'
        }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Failed to confirm receipt')
      }
    } catch (error) {
      console.error('Receipt error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkClean = async (dropIds) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ops/drops/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dropIds, 
          newStatus: 'Ready for Delivery',
          action: 'leave_laundry'
        }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Failed to mark as clean')
      }
    } catch (error) {
      console.error('Clean error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Unknown'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${Math.floor(diffHours / 24)} days ago`
  }

  const tabs = [
    { id: 'incoming', label: 'Incoming', count: inTransit.length, color: 'amber' },
    { id: 'processing', label: 'Processing', count: atLaundry.length, color: 'blue' },
  ]

  const hasMultiplePartners = laundryPartners.length > 1

  // Render bag table
  const renderBagTable = (bags, actionLabel, actionHandler, showPartner = false) => (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bag #</th>
          {showPartner && (
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
          )}
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            {activeTab === 'incoming' ? 'From Gym' : 'Return To'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            {activeTab === 'incoming' ? 'Picked Up' : 'Time at Laundry'}
          </th>
          {activeTab === 'processing' && (
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          )}
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {bags.map((bag) => (
          <tr key={bag.id} className={`hover:bg-gray-50 ${bag.status === 'critical' ? 'bg-red-50' : bag.status === 'warning' ? 'bg-amber-50' : ''}`}>
            <td className="px-4 py-3 font-mono font-medium text-gray-900">{bag.bagNumber}</td>
            {showPartner && (
              <td className="px-4 py-3 text-gray-600 text-sm">{bag.laundryPartner}</td>
            )}
            <td className="px-4 py-3 text-gray-900">{bag.gym}</td>
            <td className="px-4 py-3 text-gray-600">{bag.memberName}</td>
            <td className="px-4 py-3 text-gray-500 text-sm flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(bag.statusTime)}
            </td>
            {activeTab === 'processing' && (
              <td className="px-4 py-3">
                {bag.status === 'critical' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <AlertCircle className="w-3 h-3 mr-1" /> SLA Breach
                  </span>
                )}
                {bag.status === 'warning' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <Clock className="w-3 h-3 mr-1" /> Approaching SLA
                  </span>
                )}
                {bag.status === 'normal' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" /> On Track
                  </span>
                )}
              </td>
            )}
            <td className="px-4 py-3">
              <button 
                onClick={() => actionHandler([bag.id])}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  activeTab === 'incoming' 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {actionLabel}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  // Render partner-grouped view
  const renderPartnerGrouped = (partnerGroups, actionLabel, actionHandler) => (
    <div className="divide-y divide-gray-100">
      {partnerGroups.map((partner) => {
        const isExpanded = expandedPartner === partner.name || partnerGroups.length === 1
        
        return (
          <div key={partner.name}>
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedPartner(isExpanded ? null : partner.name)}
            >
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                  {partner.address && (
                    <p className="text-sm text-gray-500">{partner.address}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activeTab === 'incoming' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {partner.bags.length} bags
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    actionHandler(partner.bags.map(b => b.id))
                  }}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    activeTab === 'incoming'
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${actionLabel} All`}
                </button>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {isExpanded && partner.bags.length > 0 && (
              <div className="border-t border-gray-100">
                {renderBagTable(partner.bags, actionLabel, actionHandler, false)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      {/* Tabs and View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                tab.id === 'incoming' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {hasMultiplePartners && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">View:</span>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('partner')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'partner' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                }`}
              >
                By Partner
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                }`}
              >
                All Bags
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'incoming' && (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-amber-50">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">Bags in transit from gyms</span>
              </div>
              {inTransit.length > 0 && viewMode === 'all' && (
                <button 
                  onClick={() => handleConfirmReceipt(inTransit.map(d => d.id))}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm All Receipt</span>
                </button>
              )}
            </div>
            
            {inTransit.length > 0 ? (
              viewMode === 'partner' && hasMultiplePartners ? (
                renderPartnerGrouped(inTransitByPartner, 'Confirm Receipt', handleConfirmReceipt)
              ) : (
                renderBagTable(inTransit, 'Confirm Receipt', handleConfirmReceipt, hasMultiplePartners)
              )
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No bags in transit</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'processing' && (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-50">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Bags being cleaned</span>
              </div>
              {atLaundry.length > 0 && viewMode === 'all' && (
                <button 
                  onClick={() => handleMarkClean(atLaundry.map(d => d.id))}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Mark All Clean</span>
                </button>
              )}
            </div>
            
            {atLaundry.length > 0 ? (
              viewMode === 'partner' && hasMultiplePartners ? (
                renderPartnerGrouped(atLaundryByPartner, 'Mark Clean', handleMarkClean)
              ) : (
                renderBagTable(atLaundry, 'Mark Clean', handleMarkClean, hasMultiplePartners)
              )
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No bags currently processing</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
