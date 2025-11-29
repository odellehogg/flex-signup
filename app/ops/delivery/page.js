// app/ops/delivery/page.js
// Delivery management - return cleaned bags to gyms

import { getDropsReadyForDelivery, getGyms } from '@/lib/airtable'
import DeliveryList from '@/components/ops/DeliveryList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DeliveryPage() {
  const [drops, gyms] = await Promise.all([
    getDropsReadyForDelivery(),
    getGyms(),
  ])

  // Group drops by gym
  const dropsByGym = {}
  drops.forEach(drop => {
    const gymName = drop.fields['Gym'] || 'Unknown Gym'
    if (!dropsByGym[gymName]) {
      const gym = gyms.find(g => g.fields['Name'] === gymName)
      dropsByGym[gymName] = {
        name: gymName,
        address: gym?.fields['Address'] || '',
        bags: [],
      }
    }
    dropsByGym[gymName].bags.push({
      id: drop.id,
      bagNumber: drop.fields['Bag Number'],
      memberName: drop.fields['Member Name'] || 'Unknown',
      memberPhone: drop.fields['Member Phone'] || '',
      memberId: drop.fields['Member']?.[0],
      cleanedAt: drop.fields['Ready Date'] || drop.fields['Modified'],
    })
  })

  const gymGroups = Object.values(dropsByGym)
  const totalBags = drops.length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
          <p className="text-gray-500">Return cleaned bags to gym reception</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium">
            {totalBags} bags ready for delivery
          </div>
        </div>
      </div>

      {/* Notification Preview */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">When you mark bags as delivered:</p>
            <p className="text-sm text-green-700 mt-1">
              Each customer receives a WhatsApp: <span className="font-mono bg-white px-2 py-0.5 rounded">"Your FLEX bag is ready for pickup at [Gym]! 🎉"</span>
            </p>
          </div>
        </div>
      </div>

      <DeliveryList gymGroups={gymGroups} />
    </div>
  )
}
