// components/ops/AuditViewer.js
// Interactive audit log viewer with filtering

'use client'

import { useState } from 'react'
import { Search, Filter, Package, User, CreditCard, AlertTriangle, Clock } from 'lucide-react'

export default function AuditViewer({ logs }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const entityTypes = ['all', ...new Set(logs.map(l => l.entityType).filter(Boolean))]
  const sources = ['all', ...new Set(logs.map(l => l.source).filter(Boolean))]

  const filteredLogs = logs.filter(log => {
    // Entity type filter
    if (entityFilter !== 'all' && log.entityType !== entityFilter) return false
    
    // Source filter
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        log.entityId?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query) ||
        log.operator?.toLowerCase().includes(query) ||
        log.oldValue?.toLowerCase().includes(query) ||
        log.newValue?.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'Drop': return Package
      case 'Member': return User
      case 'Subscription': return CreditCard
      case 'Issue': return AlertTriangle
      default: return Clock
    }
  }

  const getEntityColor = (entityType) => {
    switch (entityType) {
      case 'Drop': return 'bg-blue-100 text-blue-700'
      case 'Member': return 'bg-green-100 text-green-700'
      case 'Subscription': return 'bg-purple-100 text-purple-700'
      case 'Issue': return 'bg-red-100 text-red-700'
      case 'Bag': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSourceColor = (source) => {
    switch (source) {
      case 'Ops Dashboard': return 'bg-blue-50 text-blue-600'
      case 'WhatsApp': return 'bg-green-50 text-green-600'
      case 'Stripe': return 'bg-purple-50 text-purple-600'
      case 'System': return 'bg-gray-50 text-gray-600'
      case 'Customer': return 'bg-amber-50 text-amber-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} mins ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, action, operator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Entity Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {entityTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sources.map(source => (
              <option key={source} value={source}>
                {source === 'all' ? 'All Sources' : source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {entityTypes.filter(t => t !== 'all').map(type => {
          const count = logs.filter(l => l.entityType === type).length
          const Icon = getEntityIcon(type)
          return (
            <div 
              key={type}
              className={`bg-white rounded-xl shadow-sm p-4 border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors ${
                entityFilter === type ? 'border-blue-500 ring-2 ring-blue-100' : ''
              }`}
              onClick={() => setEntityFilter(entityFilter === type ? 'all' : type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{count}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const Icon = getEntityIcon(log.entityType)
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEntityColor(log.entityType)}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {log.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-900">
                        {log.entityId?.substring(0, 10)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.oldValue || log.newValue ? (
                          <div className="flex items-center space-x-2">
                            {log.oldValue && (
                              <span className="text-red-600 line-through">{log.oldValue}</span>
                            )}
                            {log.oldValue && log.newValue && (
                              <span className="text-gray-400">→</span>
                            )}
                            {log.newValue && (
                              <span className="text-green-600">{log.newValue}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.operator}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSourceColor(log.source)}`}>
                          {log.source}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    {logs.length === 0 ? (
                      <div>
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No audit logs recorded yet</p>
                        <p className="text-sm mt-1">Actions will appear here as they occur</p>
                      </div>
                    ) : (
                      <div>
                        <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No logs match your filters</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
