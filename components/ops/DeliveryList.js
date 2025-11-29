// components/ops/DeliveryList.js
// Interactive delivery list with mark delivered functionality

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, MapPin, Package, Truck, Bell, CheckCircle, Loader2 } from 'lucide-react'

export default function DeliveryList({ gymGroups }) {
  const [deliveredBags, setDeliveredBags] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleMarkDelivered = async (dropIds, gymName) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ops/drops/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dropIds,
          gymName,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setDeliveredBags(prev => [...prev, ...dropIds])
        // Optionally show success message with notification count
        console.log(`${result.notificationsSent} customers notified`)
      } else {
        alert('Failed to mark as delivered')
      }
    } catch (error) {
      console.error('Delivery error:', error)
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
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 60) return `${diffMins} mins ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${Math.floor(diffHours / 24)} days ago`
  }

  const totalBags = gymGroups.reduce((sum, g) => sum + g.bags.length, 0)
  const pendingBags = totalBags - deliveredBags.length
  const allDelivered = pendingBags === 0 && totalBags > 0

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Gyms to Visit</p>
              <p className="text-2xl font-bold text-gray-900">{gymGroups.filter(g => !g.bags.every(b => deliveredBags.includes(b.id))).length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Bags to Deliver</p>
              <p className="text-2xl font-bold text-gray-900">{pendingBags}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Delivered Today</p>
              <p className="text-2xl font-bold text-gray-900">{deliveredBags.length}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* All Delivered Banner */}
      {allDelivered && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white text-center mb-6">
          <CheckCircle className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">All Deliveries Complete! 🎉</h2>
          <p className="text-green-100">
            {totalBags} customers have been notified that their bags are ready for pickup.
          </p>
        </div>
      )}

      {/* Delivery Route */}
      {gymGroups.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Delivery Route</span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {gymGroups.map((gym, index) => {
              const gymBagIds = gym.bags.map(b => b.id)
              const allGymDelivered = gymBagIds.every(id => deliveredBags.includes(id))

              return (
                <div key={gym.name} className={`p-4 ${allGymDelivered ? 'bg-green-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Route Number */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        allGymDelivered 
                          ? 'bg-green-500 text-white' 
                          : 'bg-[#1e3a5f] text-white'
                      }`}>
                        {allGymDelivered ? <Check className="w-4 h-4" /> : index + 1}
                      </div>

                      {/* Gym Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{gym.name}</h3>
                          {allGymDelivered && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" /> Delivered
                            </span>
                          )}
                        </div>
                        {gym.address && (
                          <p className="text-sm text-gray-500 flex items-center mt-0.5">
                            <MapPin className="w-3 h-3 mr-1" />
                            {gym.address}
                          </p>
                        )}

                        {/* Bag List */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {gym.bags.map(bag => (
                            <div 
                              key={bag.id}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                                deliveredBags.includes(bag.id)
                                  ? 'bg-green-100 border-green-200 text-green-800'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              {deliveredBags.includes(bag.id) && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              <span className="font-mono text-sm font-medium">{bag.bagNumber}</span>
                              <span className="text-xs text-gray-500">{bag.memberName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-sm text-gray-500">{gym.bags.length} bags</span>
                      {!allGymDelivered && (
                        <button 
                          onClick={() => handleMarkDelivered(gymBagIds, gym.name)}
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Mark Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notification Preview */}
                  {!allGymDelivered && (
                    <div className="mt-3 ml-12 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-2 text-sm text-blue-800">
                        <Bell className="w-4 h-4" />
                        <span>
                          <strong>{gym.bags.filter(b => !deliveredBags.includes(b.id)).length} customers</strong> will be notified when you mark as delivered
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bags ready for delivery</h3>
          <p className="text-gray-500">Bags will appear here once they're cleaned by the laundry partner.</p>
        </div>
      )}
    </>
  )
}
