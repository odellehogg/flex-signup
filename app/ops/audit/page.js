// app/ops/audit/page.js
// Audit trail viewer - all system actions logged

import { getRecentAuditLogs } from '@/lib/audit'
import AuditViewer from '@/components/ops/AuditViewer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AuditPage() {
  const logs = await getRecentAuditLogs(200)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-500">Complete log of all system actions</p>
        </div>
        <div className="text-sm text-gray-500">
          Showing last 200 events
        </div>
      </div>

      <AuditViewer logs={logs} />
    </div>
  )
}
