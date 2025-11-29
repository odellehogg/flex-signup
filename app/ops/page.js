// app/ops/page.js
// Main ops dashboard with KPIs and overview

import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle 
} from 'lucide-react'
import Link from 'next/link'
import { getOpsDashboardData } from '@/lib/airtable'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OpsDashboardPage() {
  const data = await getOpsDashboardData()

  const kpis = [
    { 
      label: 'Active Members', 
      value: data.activeMembers, 
      change: data.memberChange, 
      trend: data.memberChange >= 0 ? 'up' : 'down',
      icon: Users 
    },
    { 
      label: 'Drops This Month', 
      value: data.dropsThisMonth, 
      change: data.dropsChange, 
      trend: data.dropsChange >= 0 ? 'up' : 'down',
      icon: Package 
    },
    { 
      label: 'Avg Turnaround', 
      value: `${data.avgTurnaround}hrs`, 
      change: `${data.turnaroundChange}hrs`, 
      trend: data.turnaroundChange <= 0 ? 'up' : 'down',
      icon: Clock 
    },
    { 
      label: 'On-Time Rate', 
      value: `${data.onTimeRate}%`, 
      change: `${data.onTimeChange}%`, 
      trend: data.onTimeChange >= 0 ? 'up' : 'down',
      icon: CheckCircle 
    },
  ]

  const bagStatus = [
    { status: 'Available', count: data.bagsAvailable, color: 'bg-gray-200', textColor: 'text-gray-700' },
    { status: 'Dropped', count: data.bagsDropped, color: 'bg-amber-400', textColor: 'text-amber-900' },
    { status: 'At Laundry', count: data.bagsAtLaundry, color: 'bg-blue-400', textColor: 'text-blue-900' },
    { status: 'Ready', count: data.bagsReady, color: 'bg-green-400', textColor: 'text-green-900' },
  ]

  const totalBags = bagStatus.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* System Status */}
      {data.criticalIssues === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-green-800 font-medium">All systems operational</span>
          </div>
          <span className="text-green-600 text-sm">Last updated: just now</span>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <span className="text-red-800 font-medium">{data.criticalIssues} issue(s) need attention</span>
          </div>
          <Link href="/ops/pickups" className="text-red-600 text-sm font-medium hover:text-red-800">
            View Issues →
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <kpi.icon className="w-5 h-5 text-[#1e3a5f]" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              {kpi.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.change > 0 ? '+' : ''}{kpi.change}
              </span>
              <span className="text-gray-400 text-sm ml-1">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Bag Status */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bag Status Overview</h2>
          
          {/* Progress Bar */}
          <div className="h-8 rounded-full overflow-hidden flex mb-4">
            {bagStatus.map((status, i) => (
              <div
                key={i}
                className={`${status.color} flex items-center justify-center text-xs font-medium ${status.textColor}`}
                style={{ width: totalBags > 0 ? `${(status.count / totalBags) * 100}%` : '25%' }}
              >
                {status.count > 5 && status.count}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-4 gap-4">
            {bagStatus.map((status, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                <span className="text-sm text-gray-600">{status.status}</span>
                <span className="text-sm font-semibold text-gray-900">{status.count}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
            <div className="flex space-x-3">
              <Link 
                href="/ops/pickups"
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
              >
                View Pending Pickups ({data.bagsDropped})
              </Link>
              <Link 
                href="/ops/laundry"
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                View At Laundry ({data.bagsAtLaundry})
              </Link>
              <Link 
                href="/ops/delivery"
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
              >
                View Ready for Delivery ({data.bagsReady})
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Attention Needed</h2>
            {data.alerts.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                {data.alerts.length} issues
              </span>
            )}
          </div>

          {data.alerts.length > 0 ? (
            <div className="space-y-3">
              {data.alerts.slice(0, 5).map((alert, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-amber-50 border-amber-500'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {alert.type === 'critical' ? (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{alert.gym}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <p className="text-sm">No issues to report</p>
            </div>
          )}

          {data.alerts.length > 5 && (
            <Link 
              href="/ops/pickups"
              className="block w-full mt-4 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium text-center hover:bg-gray-50 transition-colors"
            >
              View All Issues
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {data.recentActivity.length > 0 ? (
            data.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-900">{activity.action}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{activity.gym}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-500">{activity.member}</span>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}
