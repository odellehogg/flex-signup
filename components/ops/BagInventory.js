// components/ops/BagInventory.js
// Interactive bag inventory management

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, User, Calendar, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function BagInventory({ bags }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [selectedBag, setSelectedBag] = useState(null)
  const router = useRouter()

  const handleAction = async (bagId, action, data = {}) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ops/bags/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bagId, action, ...data }),
      })

      if (res.ok) {
        router.refresh()
        setSelectedBag(null)
      } else {
        alert('Action failed')
      }
    } catch (error) {
      console.error('Bag action error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700'
      case 'Issued': return 'bg-blue-100 text-blue-700'
      case 'In Use': return 'bg-purple-100 text-purple-700'
      case 'Unreturned': return 'bg-red-100 text-red-700'
      case 'Damaged': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Good': return 'text-green-600'
      case 'Fair': return 'text-amber-600'
      case 'Replace Soon': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Filter bags
  const filteredBags = bags.filter(bag => {
    const matchesSearch = 
      bag.bagNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bag.memberName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || bag.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by bag number or member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Issued">Issued</option>
            <option value="In Use">In Use</option>
            <option value="Unreturned">Unreturned</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>
      </div>

      {/* Bag Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bag #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBags.map((bag) => (
              <tr key={bag.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-gray-900">{bag.bagNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bag.status)}`}>
                    {bag.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {bag.memberName ? (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{bag.memberName}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {formatDate(bag.issuedDate)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${getConditionColor(bag.condition)}`}>
                    {bag.condition}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    {bag.status === 'Issued' && (
                      <button
                        onClick={() => handleAction(bag.id, 'return')}
                        disabled={loading}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        Return
                      </button>
                    )}
                    {bag.status === 'Issued' && (
                      <button
                        onClick={() => handleAction(bag.id, 'mark_unreturned')}
                        disabled={loading}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        Mark Unreturned
                      </button>
                    )}
                    {bag.status === 'Available' && (
                      <button
                        onClick={() => setSelectedBag(bag)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        Issue to Member
                      </button>
                    )}
                    {bag.status === 'Unreturned' && (
                      <button
                        onClick={() => handleAction(bag.id, 'return')}
                        disabled={loading}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        Mark Returned
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedBag(bag)}
                      className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBags.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No bags found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Edit/Issue Modal */}
      {selectedBag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedBag.status === 'Available' ? 'Issue Bag' : 'Edit Bag'}: {selectedBag.bagNumber}
            </h3>

            <div className="space-y-4">
              {selectedBag.status === 'Available' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member ID (from lookup)
                  </label>
                  <input
                    type="text"
                    id="memberId"
                    placeholder="Enter member ID..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use Member Lookup to find the member ID first
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  id="condition"
                  defaultValue={selectedBag.condition}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Replace Soon">Replace Soon</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedBag(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              {selectedBag.status === 'Available' && (
                <button
                  onClick={() => {
                    const memberId = document.getElementById('memberId')?.value
                    const condition = document.getElementById('condition')?.value
                    if (memberId) {
                      handleAction(selectedBag.id, 'issue', { memberId, condition })
                    } else {
                      alert('Please enter a member ID')
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2a4a6f] transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Issue Bag</span>
                </button>
              )}
              {selectedBag.status !== 'Available' && (
                <button
                  onClick={() => {
                    const condition = document.getElementById('condition')?.value
                    handleAction(selectedBag.id, 'update_condition', { condition })
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2a4a6f] transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
