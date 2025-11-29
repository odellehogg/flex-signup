// app/ops/pickups/page.js
// Pickup management - collect bags from gyms
// Includes laundry partner assignment

import { getDropsAwaitingPickup, getGyms, getActiveLaundryPartners, getGymLaundryMapping } from '@/lib/airtable'
import PickupList from '@/components/ops/PickupList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PickupsPage() {
  const [drops, gyms, laundryPartners, gymLaundryMapping] = await Promise.all([
    getDropsAwaitingPickup(),
    getGyms(),
    getActiveLaundryPartners(),
    getGymLaundryMapping(),
  ])

  // Group drops by gym with default laundry partner
  const dropsByGym = {}
  drops.forEach(drop => {
    const gymName = drop.fields['Gym'] || 'Unknown Gym'
    if (!dropsByGym[gymName]) {
      const gym = gyms.find(g => g.fields['Name'] === gymName)
      const defaultPartner = gymLaundryMapping[gymName] || laundryPartners[0]?.fields['Name'] || null
      
      dropsByGym[gymName] = {
        name: gymName,
        address: gym?.fields['Address'] || '',
        defaultLaundryPartner: defaultPartner,
        bags: [],
      }
    }
    dropsByGym[gymName].bags.push({
      id: drop.id,
      bagNumber: drop.fields['Bag Number'],
      memberName: drop.fields['Member Name'] || 'Unknown',
      memberPhone: drop.fields['Member Phone'] || '',
      droppedAt: drop.fields['Drop Date'],
      status: drop.fields['Status'],
    })
  })

  const gymGroups = Object.values(dropsByGym)
  const totalBags = drops.length

  // Format laundry partners for selector
  const partnerOptions = laundryPartners.map(p => ({
    id: p.id,
    name: p.fields['Name'],
    address: p.fields['Address'] || '',
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Management</h1>
          <p className="text-gray-500">Collect bags from gyms and assign to laundry partners</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-medium">
            {totalBags} bags awaiting pickup
          </div>
        </div>
      </div>

      {/* Partner availability summary */}
      {partnerOptions.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>{partnerOptions.length} laundry partners available.</strong> Each gym has a default partner, but you can override when checking in.
          </p>
        </div>
      )}

      <PickupList 
        gymGroups={gymGroups} 
        laundryPartners={partnerOptions}
      />
    </div>
  )
}
