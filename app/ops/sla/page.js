// app/ops/sla/page.js
// SLA monitoring and breach alerts

import { getBagsBreachingSLA, getSLAStats } from '@/lib/airtable'
import { AlertTriangle, Clock, CheckCircle, XCircle, MapPin } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SLAPage() {
  const [breaches, stats] = await Promise.all([
    getBagsBreachingSLA(),
    getSLAStats(),
  ])

  const criticalCount = breaches.filter(b => b.severity === 'critical').length
  const warningCount = breaches.filter(b => b.severity === 'warning').length

  // Group breaches by status
  const droppedBreaches = breaches.filter(b => b.status === 'Dropped')
  const laundryBreaches = breaches.filter(b => b.status === 'At Laundry')
  const readyBreaches = breaches.filter(b => b.status === 'Ready')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SLA Monitoring</h1>
          <p className="text-gray-500">Track turnaround times and breach alerts</p>
        </div>
        {breaches.length === 0 ? (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>All bags within SLA</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            {criticalCount > 0 && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium">
                {criticalCount} Critical
              </div>
            )}
            {warningCount > 0 && (
              <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-medium">
                {warningCount} Warning
              </div>
            )}
          </div>
        )}
      </div>

      {/* SLA Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Avg Turnaround</p>
              <p className="text-3xl font-bold text-gray-900">{stats.avgTurnaroundHours}hrs</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stats.avgTurnaroundHours <= 36 ? 'bg-green-50' : 'bg-amber-50'
            }`}>
              <Clock className={`w-5 h-5 ${
                stats.avgTurnaroundHours <= 36 ? 'text-green-600' : 'text-amber-600'
              }`} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Target: 48 hours</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">On-Time Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.onTimeRate}%</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stats.onTimeRate >= 95 ? 'bg-green-50' : 'bg-amber-50'
            }`}>
              <CheckCircle className={`w-5 h-5 ${
                stats.onTimeRate >= 95 ? 'text-green-600' : 'text-amber-600'
              }`} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Target: 95%</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Completed (30d)</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCompleted}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">drops processed</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Current Breaches</p>
              <p className="text-3xl font-bold text-gray-900">{breaches.length}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              breaches.length === 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                breaches.length === 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">need attention</p>
        </div>
      </div>

      {/* SLA Thresholds Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">SLA Thresholds</h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-blue-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
            <span><strong>Dropped:</strong> 6 hours (pickup)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span><strong>At Laundry:</strong> 30 hours (cleaning)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span><strong>Ready:</strong> 120 hours (collection)</span>
          </div>
        </div>
      </div>

      {/* Breach List */}
      {breaches.length > 0 ? (
        <div className="space-y-6">
          {/* Dropped Breaches */}
          {droppedBreaches.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                  <span className="font-medium text-amber-800">Awaiting Pickup</span>
                  <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    {droppedBreaches.length} overdue
                  </span>
                </div>
                <Link 
                  href="/ops/pickups"
                  className="text-amber-700 text-sm font-medium hover:text-amber-900"
                >
                  Go to Pickups →
                </Link>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bag #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gym</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waiting</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {droppedBreaches.map(breach => (
                    <tr key={breach.id} className={breach.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'}>
                      <td className="px-4 py-3">
                        {breach.severity === 'critical' ? (
                          <span className="flex items-center text-red-600">
                            <XCircle className="w-4 h-4 mr-1" /> Critical
                          </span>
                        ) : (
                          <span className="flex items-center text-amber-600">
                            <AlertTriangle className="w-4 h-4 mr-1" /> Warning
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">{breach.bagNumber}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" /> {breach.gym}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{breach.memberName}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{breach.hoursInStatus} hrs</td>
                      <td className="px-4 py-3 text-gray-500">{breach.threshold} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Laundry Breaches */}
          {laundryBreaches.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="font-medium text-blue-800">At Laundry Too Long</span>
                  <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    {laundryBreaches.length} overdue
                  </span>
                </div>
                <Link 
                  href="/ops/laundry"
                  className="text-blue-700 text-sm font-medium hover:text-blue-900"
                >
                  Go to Laundry →
                </Link>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bag #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">At Laundry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {laundryBreaches.map(breach => (
                    <tr key={breach.id} className={breach.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'}>
                      <td className="px-4 py-3">
                        {breach.severity === 'critical' ? (
                          <span className="flex items-center text-red-600">
                            <XCircle className="w-4 h-4 mr-1" /> Critical
                          </span>
                        ) : (
                          <span className="flex items-center text-amber-600">
                            <AlertTriangle className="w-4 h-4 mr-1" /> Warning
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">{breach.bagNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{breach.gym}</td>
                      <td className="px-4 py-3 text-gray-600">{breach.memberName}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{breach.hoursInStatus} hrs</td>
                      <td className="px-4 py-3 text-gray-500">{breach.threshold} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Ready Breaches (uncollected) */}
          {readyBreaches.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="font-medium text-green-800">Ready But Uncollected</span>
                  <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    {readyBreaches.length} overdue
                  </span>
                </div>
                <Link 
                  href="/ops/members"
                  className="text-green-700 text-sm font-medium hover:text-green-900"
                >
                  Contact Members →
                </Link>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bag #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">At Gym</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waiting</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {readyBreaches.map(breach => (
                    <tr key={breach.id} className={breach.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'}>
                      <td className="px-4 py-3">
                        {breach.severity === 'critical' ? (
                          <span className="flex items-center text-red-600">
                            <XCircle className="w-4 h-4 mr-1" /> Critical
                          </span>
                        ) : (
                          <span className="flex items-center text-amber-600">
                            <AlertTriangle className="w-4 h-4 mr-1" /> Warning
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">{breach.bagNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{breach.gym}</td>
                      <td className="px-4 py-3 text-gray-600">{breach.memberName}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{breach.hoursInStatus} hrs</td>
                      <td className="px-4 py-3 text-gray-500">{breach.threshold} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All bags within SLA!</h3>
          <p className="text-gray-500">No bags are currently breaching their time thresholds.</p>
        </div>
      )}
    </div>
  )
}
