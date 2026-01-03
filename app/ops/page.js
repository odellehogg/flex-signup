import Link from 'next/link';
import { getOpsHealthMetrics, getTodaySummary, getDropsAtRisk, getTicketsNeedingAttention } from '@/lib/sla';

export const dynamic = 'force-dynamic';

export default async function OpsDashboard() {
  // Fetch dashboard data
  let health = { score: 0, status: 'unknown' };
  let todaySummary = { dropped: 0, inTransit: 0, atLaundry: 0, ready: 0, collected: 0 };
  let dropsAtRisk = [];
  let urgentTickets = [];

  try {
    health = await getOpsHealthMetrics();
    todaySummary = await getTodaySummary();
    dropsAtRisk = await getDropsAtRisk();
    urgentTickets = await getTicketsNeedingAttention();
  } catch (err) {
    console.error('Failed to fetch dashboard data:', err);
  }

  const healthColor = health.status === 'healthy' ? 'emerald' : health.status === 'warning' ? 'yellow' : 'red';

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Operations Dashboard</h1>

      {/* Health Score */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className={`bg-white rounded-xl shadow p-6 border-l-4 border-${healthColor}-500`}>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Health Score</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">{health.score}</span>
            <span className={`text-sm font-medium text-${healthColor}-600 mb-1`}>
              {health.status}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Drops</h3>
          <span className="text-4xl font-bold text-gray-900">
            {todaySummary.dropped + todaySummary.inTransit + todaySummary.atLaundry + todaySummary.ready}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">At Risk</h3>
          <span className="text-4xl font-bold text-red-600">
            {dropsAtRisk.filter(d => d.riskLevel !== 'ok').length}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Open Tickets</h3>
          <span className="text-4xl font-bold text-gray-900">
            {urgentTickets.length}
          </span>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Drop Pipeline</h2>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-blue-600">{todaySummary.dropped}</div>
            <div className="text-sm text-gray-500">Dropped</div>
          </div>
          <div className="text-gray-300">→</div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-purple-600">{todaySummary.inTransit}</div>
            <div className="text-sm text-gray-500">In Transit</div>
          </div>
          <div className="text-gray-300">→</div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-indigo-600">{todaySummary.atLaundry}</div>
            <div className="text-sm text-gray-500">At Laundry</div>
          </div>
          <div className="text-gray-300">→</div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-emerald-600">{todaySummary.ready}</div>
            <div className="text-sm text-gray-500">Ready</div>
          </div>
          <div className="text-gray-300">→</div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-gray-600">{todaySummary.collected}</div>
            <div className="text-sm text-gray-500">Collected</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Drops at Risk */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Drops at Risk</h2>
            <Link href="/ops/drops" className="text-emerald-600 text-sm hover:underline">
              View all →
            </Link>
          </div>
          
          {dropsAtRisk.filter(d => d.riskLevel !== 'ok').length === 0 ? (
            <p className="text-gray-500 text-center py-4">All drops on track! ✓</p>
          ) : (
            <div className="space-y-3">
              {dropsAtRisk
                .filter(d => d.riskLevel !== 'ok')
                .slice(0, 5)
                .map((drop) => (
                  <div key={drop.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{drop.bagNumber}</span>
                      <span className="text-gray-500 text-sm ml-2">{drop.status}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      drop.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                      drop.riskLevel === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {drop.riskLevel}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Tickets Needing Attention */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
            <Link href="/ops/tickets" className="text-emerald-600 text-sm hover:underline">
              View all →
            </Link>
          </div>
          
          {urgentTickets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No open tickets! ✓</p>
          ) : (
            <div className="space-y-3">
              {urgentTickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{ticket.type}</span>
                    <span className="text-gray-500 text-sm block">{ticket.memberName}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ticket.urgency === 'overdue' ? 'bg-red-100 text-red-700' :
                    ticket.urgency === 'needs_response' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {ticket.urgency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/ops/drops?status=Dropped" className="btn-outline">
            Process Dropped Bags
          </Link>
          <Link href="/ops/drops?status=Ready" className="btn-outline">
            Mark Collected
          </Link>
          <Link href="/ops/tickets?status=Open" className="btn-outline">
            Review Tickets
          </Link>
          <Link href="/ops/members" className="btn-outline">
            Search Members
          </Link>
        </div>
      </div>
    </div>
  );
}
