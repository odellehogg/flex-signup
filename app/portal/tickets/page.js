'use client'

// app/portal/tickets/page.js
// View support tickets

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, open, resolved

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/portal/tickets')
      
      if (response.status === 401) {
        router.push('/portal')
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load tickets')
      }

      setTickets(data.tickets || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true
    if (filter === 'open') return ['Open', 'In Progress', 'Awaiting Info'].includes(ticket.status)
    if (filter === 'resolved') return ['Resolved', 'Closed'].includes(ticket.status)
    return true
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-yellow-100 text-yellow-700'
      case 'In Progress':
        return 'bg-blue-100 text-blue-700'
      case 'Awaiting Info':
        return 'bg-orange-100 text-orange-700'
      case 'Resolved':
        return 'bg-green-100 text-green-700'
      case 'Closed':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'text-red-600'
      case 'High':
        return 'text-orange-600'
      case 'Medium':
        return 'text-yellow-600'
      case 'Low':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support tickets</h1>
          <p className="text-gray-600 mt-1">
            View and track your support requests
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {[
          { id: 'all', label: 'All' },
          { id: 'open', label: 'Open' },
          { id: 'resolved', label: 'Resolved' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              filter === id
                ? 'bg-[#1e3a5f] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">No tickets found</h3>
          <p className="text-gray-600 mt-1 text-sm">
            {filter === 'all'
              ? "You haven't submitted any support tickets yet."
              : `No ${filter} tickets.`
            }
          </p>
          <p className="text-gray-500 mt-4 text-sm">
            Need help? Message us on WhatsApp by sending "HELP"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium text-[#1e3a5f]">
                      {ticket.ticketId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    {ticket.priority && ticket.priority !== 'Low' && (
                      <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority} priority
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mt-2">
                    {ticket.type}
                  </h3>
                  
                  {ticket.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {ticket.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>
                      Created {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                      <span>
                        Updated {new Date(ticket.updatedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {ticket.hasAttachment && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900">Need more help?</h3>
        <p className="text-sm text-gray-600 mt-2">
          For urgent issues, message us on WhatsApp by sending "HELP" and selecting your issue type. 
          We typically respond within a few hours during business hours.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          You can also email us at <a href="mailto:support@flexlaundry.co.uk" className="text-[#1e3a5f] hover:underline">support@flexlaundry.co.uk</a>
        </p>
      </div>
    </div>
  )
}
