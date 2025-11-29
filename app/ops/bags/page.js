// app/ops/bags/page.js
// Bag inventory management
// Bags issued when customer wants to drop, returned when inactive/pausing

import { getAvailableBags, getBagsWithIssues } from '@/lib/airtable'
import BagInventory from '@/components/ops/BagInventory'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

async function getAllBags() {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bags?sort%5B0%5D%5Bfield%5D=Bag%20Number&sort%5B0%5D%5Bdirection%5D=asc`,
    {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      cache: 'no-store',
    }
  )
  const data = await response.json()
  return data.records || []
}

export default async function BagsPage() {
  const [allBags, bagsWithIssues] = await Promise.all([
    getAllBags(),
    getBagsWithIssues(),
  ])

  // Calculate stats
  const stats = {
    total: allBags.length,
    available: allBags.filter(b => b.fields['Status'] === 'Available').length,
    issued: allBags.filter(b => b.fields['Status'] === 'Issued').length,
    inUse: allBags.filter(b => b.fields['Status'] === 'In Use').length,
    unreturned: allBags.filter(b => b.fields['Status'] === 'Unreturned').length,
    damaged: allBags.filter(b => b.fields['Status'] === 'Damaged').length,
  }

  // Format bags for component
  const formattedBags = allBags.map(bag => ({
    id: bag.id,
    bagNumber: bag.fields['Bag Number'],
    status: bag.fields['Status'] || 'Available',
    memberName: bag.fields['Member Name'] || null,
    memberId: bag.fields['Member']?.[0] || null,
    issuedDate: bag.fields['Issued Date'],
    returnedDate: bag.fields['Returned Date'],
    condition: bag.fields['Condition'] || 'Good',
    lastInspected: bag.fields['Last Inspected'],
    unreturnedDate: bag.fields['Unreturned Date'],
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bag Inventory</h1>
          <p className="text-gray-500">Track and manage FLEX bags across the system</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Bags</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.available}</p>
          <p className="text-sm text-gray-500">Available</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.issued}</p>
          <p className="text-sm text-gray-500">Issued</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.inUse}</p>
          <p className="text-sm text-gray-500">In Use</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-red-600">{stats.unreturned}</p>
          <p className="text-sm text-gray-500">Unreturned</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-amber-600">{stats.damaged}</p>
          <p className="text-sm text-gray-500">Damaged</p>
        </div>
      </div>

      {/* Bag Operations Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Bag Lifecycle</h3>
        <div className="grid grid-cols-4 gap-4 text-sm text-blue-700">
          <div>
            <strong>1. Issue:</strong> When customer wants to make their first drop
          </div>
          <div>
            <strong>2. In Use:</strong> Bag is in the laundry cycle
          </div>
          <div>
            <strong>3. Return:</strong> When pausing, cancelling, or no drops remaining
          </div>
          <div>
            <strong>4. Unreturned:</strong> Fee charged if not returned by inactive users
          </div>
        </div>
      </div>

      <BagInventory bags={formattedBags} />
    </div>
  )
}
