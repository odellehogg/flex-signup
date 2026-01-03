'use client'

// app/ops/tickets/page.js
// Ops ticket management - list view
// ADDITIVE - add this folder to existing /ops

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function OpsTickets() {
  const searchParams = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get('status') || 'open')

  useEffect(() => {
    fetchTickets()
  }, [filter])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ops/tickets?status=${filter}`)
      
      if (response.status === 401) {
        // Redirect to your existing ops login
        window.location.href = '/ops'
        return
      }

      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-700'
      case 'In Progress': return 'bg-blue-100 text-blue-700'
      case 'Awaiting Info': return 'bg-orange-100 text-orange-700'
      case 'Resolved': return 'bg-green-100 text-green-700'
      case 'Closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 font-bold'
      case 'High': return 'text-orange-600 font-semibold'
      case 'Medium': return 'text-yellow-600'
      case 'Low': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Manage customer support tickets</p>
        </div>
        <a href="/ops" className="text-sm text-blue-600 hover:underline">
          ← Back to Ops
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'open', label: 'Open', count: tickets.filter(t => t.status === 'Open').length },
          { id: 'in-progress', label: 'In Progress' },
          { id: 'all', label: 'All' },
          { id: 'resolved', label: 'Resolved' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tickets table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tickets found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ticket</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Priority</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-blue-600 font-medium">
                        {ticket.ticketId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{ticket.memberName}</p>
                      <p className="text-xs text-gray-500">{ticket.memberPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ticket.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/ops/tickets/${ticket.id}`}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && tickets.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
