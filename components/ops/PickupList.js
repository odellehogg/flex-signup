// components/ops/PickupList.js
// Interactive pickup list with check-in functionality and laundry partner assignment

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, MapPin, Clock, ChevronDown, ChevronUp, Search, Truck, Loader2, Building2 } from 'lucide-react'

export default function PickupList({ gymGroups, laundryPartners = [] }) {
  const [expandedGym, setExpandedGym] = useState(gymGroups[0]?.name || null)
  const [selectedBags, setSelectedBags] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPartner, setSelectedPartner] = useState({}) // Per-gym partner selection
  const router = useRouter()

  const hasMultiplePartners = laundryPartners.length > 1

  // Get selected partner for a gym (or default)
  const getPartnerForGym = (gymName, defaultPartner) => {
    return selectedPartner[gymName] || defaultPartner || laundryPartners[0]?.name || null
  }

  const toggleBag = (bagId) => {
    setSelectedBags(prev => 
      prev.includes(bagId) 
        ? prev.filter(id => id !== bagId)
        : [...prev, bagId]
    )
  }

  const selectAllInGym = (gymName) => {
    const gym = gymGroups.find(g => g.name === gymName)
    const gymBagIds = gym.bags.map(b => b.id)
    const allSelected = gymBagIds.every(id => selectedBags.includes(id))
    
    if (allSelected) {
      setSelectedBags(prev => prev.filter(id => !gymBagIds.includes(id)))
    } else {
      setSelectedBags(prev => [...new Set([...prev, ...gymBagIds])])
    }
  }

  const handleCheckIn = async (dropIds, gymName, defaultPartner) => {
    const partner = getPartnerForGym(gymName, defaultPartner)
    
    if (hasMultiplePartners && !partner) {
      alert('Please select a laundry partner')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ops/drops/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dropIds, 
          newStatus: 'At Laundry',
          action: 'pickup_from_gym',
          laundryPartner: partner,
        }),
      })

      if (res.ok) {
        setSelectedBags([])
        router.refresh()
      } else {
        alert('Failed to check in bags')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkCheckIn = async () => {
    // Group selected bags by gym to apply correct partner
    const bagsByGym = {}
    gymGroups.forEach(gym => {
      const selectedInGym = gym.bags.filter(b => selectedBags.includes(b.id))
      if (selectedInGym.length > 0) {
        bagsByGym[gym.name] = {
          dropIds: selectedInGym.map(b => b.id),
          partner: getPartnerForGym(gym.name, gym.defaultLaundryPartner)
        }
      }
    })

    setLoading(true)
    try {
      // Check in each gym's bags with their assigned partner
      for (const [gymName, { dropIds, partner }] of Object.entries(bagsByGym)) {
        await fetch('/api/ops/drops/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            dropIds, 
            newStatus: 'At Laundry',
            action: 'pickup_from_gym',
            laundryPartner: partner,
          }),
        })
      }
      setSelectedBags([])
      router.refresh()
    } catch (error) {
      console.error('Bulk check-in error:', error)
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

  const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return '****'
    return '****' + phone.slice(-4)
  }

  // Filter gyms based on search
  const filteredGyms = gymGroups.map(gym => ({
    ...gym,
    bags: gym.bags.filter(bag => 
      bag.bagNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bag.memberName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(gym => gym.bags.length > 0)

  return (
    <>
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by bag number, member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedBags.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">{selectedBags.length} bags selected</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSelectedBags([])}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
            <button 
              onClick={handleBulkCheckIn}
              disabled={loading}
              className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2a4a6f] transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              <span>Check In Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Gym List */}
      {filteredGyms.length > 0 ? (
        <div className="space-y-4">
          {filteredGyms.map((gym) => {
            const isExpanded = expandedGym === gym.name
            const gymBagIds = gym.bags.map(b => b.id)
            const allSelected = gymBagIds.every(id => selectedBags.includes(id))
            const someSelected = gymBagIds.some(id => selectedBags.includes(id))
            const currentPartner = getPartnerForGym(gym.name, gym.defaultLaundryPartner)

            return (
              <div key={gym.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Gym Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedGym(isExpanded ? null : gym.name)}
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                        allSelected ? 'bg-[#1e3a5f] border-[#1e3a5f]' : someSelected ? 'border-[#1e3a5f] bg-blue-100' : 'border-gray-300'
                      }`}
                      onClick={(e) => { e.stopPropagation(); selectAllInGym(gym.name); }}
                    >
                      {allSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{gym.name}</h3>
                      {gym.address && (
                        <p className="text-sm text-gray-500 flex items-center mt-0.5">
                          <MapPin className="w-3 h-3 mr-1" />
                          {gym.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                      {gym.bags.length} bags
                    </span>
                    
                    {/* Laundry Partner Selector */}
                    {hasMultiplePartners && (
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <select
                          value={currentPartner || ''}
                          onChange={(e) => setSelectedPartner(prev => ({
                            ...prev,
                            [gym.name]: e.target.value
                          }))}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {laundryPartners.map(p => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleCheckIn(gymBagIds, gym.name, gym.defaultLaundryPartner); 
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#2a4a6f] transition-colors disabled:opacity-50"
                    >
                      Check In All
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Bag List */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Partner info banner */}
                    {hasMultiplePartners && (
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center space-x-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>Sending to: <strong>{currentPartner}</strong></span>
                      </div>
                    )}
                    
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dropped</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {gym.bags.map((bag) => {
                          const hoursAgo = bag.droppedAt ? 
                            Math.floor((new Date() - new Date(bag.droppedAt)) / (1000 * 60 * 60)) : 0
                          const isPriority = hoursAgo > 6

                          return (
                            <tr key={bag.id} className={`hover:bg-gray-50 ${isPriority ? 'bg-red-50' : ''}`}>
                              <td className="px-4 py-3">
                                <div 
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                                    selectedBags.includes(bag.id) ? 'bg-[#1e3a5f] border-[#1e3a5f]' : 'border-gray-300'
                                  }`}
                                  onClick={() => toggleBag(bag.id)}
                                >
                                  {selectedBags.includes(bag.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-mono font-medium text-gray-900">{bag.bagNumber}</span>
                                {isPriority && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">SLA Risk</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-900">{bag.memberName}</td>
                              <td className="px-4 py-3 text-gray-500 font-mono text-sm">{maskPhone(bag.memberPhone)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center text-gray-500 text-sm">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {formatTime(bag.droppedAt)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <button 
                                  onClick={() => handleCheckIn([bag.id], gym.name, gym.defaultLaundryPartner)}
                                  disabled={loading}
                                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                                >
                                  Check In
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-500">No bags awaiting pickup at this time.</p>
        </div>
      )}
    </>
  )
}
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

  const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return '****'
    return '****' + phone.slice(-4)
  }

  // Filter gyms based on search
  const filteredGyms = gymGroups.map(gym => ({
    ...gym,
    bags: gym.bags.filter(bag => 
      bag.bagNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bag.memberName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(gym => gym.bags.length > 0)

  return (
    <>
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by bag number, member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedBags.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">{selectedBags.length} bags selected</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSelectedBags([])}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
            <button 
              onClick={() => handleCheckIn(selectedBags)}
              disabled={loading}
              className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2a4a6f] transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              <span>Check In Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Gym List */}
      {filteredGyms.length > 0 ? (
        <div className="space-y-4">
          {filteredGyms.map((gym) => {
            const isExpanded = expandedGym === gym.name
            const gymBagIds = gym.bags.map(b => b.id)
            const allSelected = gymBagIds.every(id => selectedBags.includes(id))
            const someSelected = gymBagIds.some(id => selectedBags.includes(id))

            return (
              <div key={gym.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Gym Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedGym(isExpanded ? null : gym.name)}
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                        allSelected ? 'bg-[#1e3a5f] border-[#1e3a5f]' : someSelected ? 'border-[#1e3a5f] bg-blue-100' : 'border-gray-300'
                      }`}
                      onClick={(e) => { e.stopPropagation(); selectAllInGym(gym.name); }}
                    >
                      {allSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{gym.name}</h3>
                      {gym.address && (
                        <p className="text-sm text-gray-500 flex items-center mt-0.5">
                          <MapPin className="w-3 h-3 mr-1" />
                          {gym.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                      {gym.bags.length} bags
                    </span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleCheckIn(gymBagIds); 
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#2a4a6f] transition-colors disabled:opacity-50"
                    >
                      Check In All
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Bag List */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dropped</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {gym.bags.map((bag) => {
                          const hoursAgo = bag.droppedAt ? 
                            Math.floor((new Date() - new Date(bag.droppedAt)) / (1000 * 60 * 60)) : 0
                          const isPriority = hoursAgo > 6

                          return (
                            <tr key={bag.id} className={`hover:bg-gray-50 ${isPriority ? 'bg-red-50' : ''}`}>
                              <td className="px-4 py-3">
                                <div 
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                                    selectedBags.includes(bag.id) ? 'bg-[#1e3a5f] border-[#1e3a5f]' : 'border-gray-300'
                                  }`}
                                  onClick={() => toggleBag(bag.id)}
                                >
                                  {selectedBags.includes(bag.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-mono font-medium text-gray-900">{bag.bagNumber}</span>
                                {isPriority && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">SLA Risk</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-900">{bag.memberName}</td>
                              <td className="px-4 py-3 text-gray-500 font-mono text-sm">{maskPhone(bag.memberPhone)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center text-gray-500 text-sm">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {formatTime(bag.droppedAt)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <button 
                                  onClick={() => handleCheckIn([bag.id])}
                                  disabled={loading}
                                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                                >
                                  Check In
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-500">No bags awaiting pickup at this time.</p>
        </div>
      )}
    </>
  )
}
