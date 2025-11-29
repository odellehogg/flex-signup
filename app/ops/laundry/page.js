// app/ops/laundry/page.js
// Laundry partner handoff - manage bags at laundry facility
// Dynamically loads partners and groups bags by laundry partner

import { getDropsAtLaundry, getDropsInTransit, getLaundryPartners } from '@/lib/airtable'
import LaundryTabs from '@/components/ops/LaundryTabs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LaundryPage() {
  const [atLaundry, inTransit, laundryPartners] = await Promise.all([
    getDropsAtLaundry(),
    getDropsInTransit(),
    getLaundryPartners(),
  ])

  // Format drops for the component
  const formatDrops = (drops) => drops.map(drop => {
    const statusDate = drop.fields['Status Changed'] || drop.fields['Modified'] || drop.fields['Drop Date']
    const hoursAtStatus = statusDate ? 
      Math.floor((new Date() - new Date(statusDate)) / (1000 * 60 * 60)) : 0

    return {
      id: drop.id,
      bagNumber: drop.fields['Bag Number'],
      memberName: drop.fields['Member Name'] || 'Unknown',
      gym: drop.fields['Gym'] || 'Unknown Gym',
      laundryPartner: drop.fields['Laundry Partner'] || 'Unassigned',
      statusTime: statusDate,
      hoursAtStatus,
      status: hoursAtStatus > 24 ? 'critical' : hoursAtStatus > 12 ? 'warning' : 'normal',
    }
  })

  const inTransitFormatted = formatDrops(inTransit)
  const atLaundryFormatted = formatDrops(atLaundry)

  // Group by laundry partner
  const groupByPartner = (drops) => {
    const grouped = {}
    drops.forEach(drop => {
      const partner = drop.laundryPartner
      if (!grouped[partner]) {
        const partnerInfo = laundryPartners.find(p => p.fields['Name'] === partner)
        grouped[partner] = {
          name: partner,
          address: partnerInfo?.fields['Address'] || '',
          contact: partnerInfo?.fields['Contact'] || '',
          bags: [],
        }
      }
      grouped[partner].bags.push(drop)
    })
    return Object.values(grouped)
  }

  const inTransitByPartner = groupByPartner(inTransitFormatted)
  const atLaundryByPartner = groupByPartner(atLaundryFormatted)

  // Count active partners
  const activePartnerCount = laundryPartners.filter(p => p.fields['Status'] === 'Active').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laundry Partner Handoff</h1>
          <p className="text-gray-500">Manage bags across all laundry facilities</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            {activePartnerCount} Active Partner{activePartnerCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Partner Summary Cards */}
      {laundryPartners.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {laundryPartners.filter(p => p.fields['Status'] === 'Active').map(partner => {
            const partnerName = partner.fields['Name']
            const inTransitCount = inTransitFormatted.filter(d => d.laundryPartner === partnerName).length
            const processingCount = atLaundryFormatted.filter(d => d.laundryPartner === partnerName).length
            const totalBags = inTransitCount + processingCount
            
            return (
              <div key={partner.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{partnerName}</h3>
                    <p className="text-sm text-gray-500">{partner.fields['Address'] || 'No address'}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    totalBags > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {totalBags} bags
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-4 text-sm">
                  <span className="text-amber-600">{inTransitCount} incoming</span>
                  <span className="text-blue-600">{processingCount} processing</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Process Flow Visualization */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-center text-amber-600">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xs mt-2 font-medium">In Transit</span>
              <span className="text-lg font-bold">{inTransitFormatted.length}</span>
            </div>
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="flex flex-col items-center text-blue-600">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-xs mt-2 font-medium">Processing</span>
              <span className="text-lg font-bold">{atLaundryFormatted.length}</span>
            </div>
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="flex flex-col items-center text-green-600">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs mt-2 font-medium">Ready</span>
              <span className="text-lg font-bold">→</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total across all partners</p>
            <p className="text-2xl font-bold text-gray-900">{inTransitFormatted.length + atLaundryFormatted.length} bags</p>
          </div>
        </div>
      </div>

      <LaundryTabs 
        inTransit={inTransitFormatted} 
        atLaundry={atLaundryFormatted}
        inTransitByPartner={inTransitByPartner}
        atLaundryByPartner={atLaundryByPartner}
        laundryPartners={laundryPartners}
      />
    </div>
  )
}
