// app/ops/reports/page.js
// Financial reporting dashboard

import { getRevenueByPlan, getChurnStats, getUtilisationStats, getSLAStats } from '@/lib/airtable'
import { TrendingUp, TrendingDown, Users, Package, Clock, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ReportsPage() {
  const [revenue, churn, utilisation, sla] = await Promise.all([
    getRevenueByPlan(),
    getChurnStats(),
    getUtilisationStats(),
    getSLAStats(),
  ])

  const totalMRR = revenue.reduce((sum, p) => sum + p.monthlyRevenue, 0)
  const totalMembers = revenue.reduce((sum, p) => sum + p.count, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-500">Revenue, utilisation, and churn metrics</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">£{totalMRR.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{totalMembers} active subscribers</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Utilisation Rate</p>
              <p className="text-3xl font-bold text-gray-900">{utilisation.utilisationRate}%</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{utilisation.totalUsed} / {utilisation.totalAllowed} drops used</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Avg Turnaround</p>
              <p className="text-3xl font-bold text-gray-900">{sla.avgTurnaroundHours}hrs</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{sla.onTimeRate}% on-time rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Churn (30 days)</p>
              <p className="text-3xl font-bold text-gray-900">{churn.cancelledCount}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">cancelled subscriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h2>
          
          {revenue.length > 0 ? (
            <div className="space-y-4">
              {revenue.map((plan, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      <p className="text-sm text-gray-500">{plan.count} members × £{plan.price}/mo</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">£{plan.monthlyRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">/month</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No revenue data available</p>
          )}

          {/* Annual projection */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Annual Run Rate</span>
              <span className="text-xl font-bold text-green-600">£{(totalMRR * 12).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Churn Analysis */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Churn Reasons (Last 30 Days)</h2>
          
          {Object.keys(churn.reasons).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(churn.reasons)
                .sort(([, a], [, b]) => b - a)
                .map(([reason, count], i) => {
                  const percentage = Math.round((count / churn.cancelledCount) * 100)
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{reason}</span>
                        <span className="text-sm font-medium text-gray-900">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-500">No cancellations in the last 30 days!</p>
            </div>
          )}
        </div>
      </div>

      {/* Utilisation Details */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Drop Utilisation</h2>
        
        <div className="flex items-center space-x-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Drops used this month</span>
              <span className="text-sm font-medium">{utilisation.totalUsed} / {utilisation.totalAllowed}</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  utilisation.utilisationRate > 80 ? 'bg-green-500' :
                  utilisation.utilisationRate > 50 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${utilisation.utilisationRate}%` }}
              />
            </div>
          </div>
          
          <div className="text-center px-6 border-l border-gray-100">
            <p className="text-4xl font-bold text-[#1e3a5f]">{utilisation.utilisationRate}%</p>
            <p className="text-sm text-gray-500">utilisation</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Insight:</strong> {
              utilisation.utilisationRate > 80 
                ? 'High utilisation indicates strong product-market fit. Consider introducing higher-tier plans.'
                : utilisation.utilisationRate > 50
                ? 'Healthy utilisation. Members are getting value from the service.'
                : 'Low utilisation may indicate members aren\'t forming habits. Consider engagement campaigns.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
