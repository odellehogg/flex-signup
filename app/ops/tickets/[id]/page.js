'use client'

// app/ops/tickets/[id]/page.js
// Individual ticket detail with status updates and WhatsApp notifications
// ADDITIVE - add this to existing /ops

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TicketDetail() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [internalNote, setInternalNote] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchTicket()
  }, [params.id])

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/ops/tickets/${params.id}`)
      
      if (response.status === 401) {
        window.location.href = '/ops'
        return
      }

      if (response.status === 404) {
        setTicket(null)
        setLoading(false)
        return
      }

      const data = await response.json()
      setTicket(data)
    } catch (err) {
      console.error('Failed to fetch ticket:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateTicket = async (updates) => {
    if (updating) return
    
    setUpdating(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/ops/tickets/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          internalNote: internalNote || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update ticket')
      }

      // Refresh ticket data
      await fetchTicket()
      setInternalNote('')
      
      const notifyMsg = data.notificationSent 
        ? ' WhatsApp notification sent to customer.' 
        : ''
      setMessage({ type: 'success', text: `Ticket updated.${notifyMsg}` })
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000)

    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Ticket not found</p>
        <a href="/ops/tickets" className="text-blue-600 hover:underline">
          ← Back to tickets
        </a>
      </div>
    )
  }

  const statusOptions = ['Open', 'In Progress', 'Awaiting Info', 'Resolved', 'Closed']
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent']

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <a href="/ops/tickets" className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block">
            ← Back to tickets
          </a>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 flex-wrap">
            <span className="font-mono">{ticket.ticketId}</span>
            <span className={`text-sm px-3 py-1 rounded-full ${
              ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-700' :
              ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
              ticket.status === 'Awaiting Info' ? 'bg-orange-100 text-orange-700' :
              ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {ticket.status}
            </span>
            {ticket.priority && ticket.priority !== 'Medium' && (
              <span className={`text-sm ${
                ticket.priority === 'Urgent' ? 'text-red-600' :
                ticket.priority === 'High' ? 'text-orange-600' :
                'text-gray-600'
              }`}>
                {ticket.priority} priority
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Issue Details</h2>
            
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium text-gray-900">{ticket.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="font-medium text-gray-900">{ticket.source || 'WhatsApp'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(ticket.createdAt).toLocaleString('en-GB')}
                </p>
              </div>
              {ticket.updatedAt && (
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(ticket.updatedAt).toLocaleString('en-GB')}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {ticket.description || 'No description provided'}
              </p>
            </div>

            {/* Attachments */}
            {ticket.attachments?.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Attachments ({ticket.attachments.length})</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {ticket.attachments.map((attachment, i) => (
                    <a
                      key={i}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={attachment.thumbnails?.large?.url || attachment.url}
                        alt={`Attachment ${i + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Internal notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Internal Notes</h2>
            
            {ticket.internalNotes ? (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4 whitespace-pre-wrap text-sm border border-yellow-200">
                {ticket.internalNotes}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4 italic">No notes yet</p>
            )}

            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Add a note (visible only to ops team)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
            
            {internalNote && (
              <button
                onClick={() => updateTicket({})}
                disabled={updating}
                className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Note'}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Member info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{ticket.memberName || 'Unknown'}</p>
              </div>
              {ticket.memberPhone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a 
                    href={`https://wa.me/${ticket.memberPhone.replace(/[^\d]/g, '')}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {ticket.memberPhone}
                  </a>
                </div>
              )}
              {ticket.memberEmail && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a 
                    href={`mailto:${ticket.memberEmail}?subject=Re: FLEX Support - ${ticket.ticketId}`} 
                    className="font-medium text-blue-600 hover:underline break-all"
                  >
                    {ticket.memberEmail}
                  </a>
                </div>
              )}
              {ticket.memberPlan && (
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="font-medium text-gray-900">{ticket.memberPlan}</p>
                </div>
              )}
              {ticket.memberGym && (
                <div>
                  <p className="text-sm text-gray-500">Gym</p>
                  <p className="font-medium text-gray-900">{ticket.memberGym}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Update Status</h2>
            <p className="text-xs text-gray-500 mb-4">
              📱 "In Progress", "Awaiting Info", and "Resolved" will notify customer via WhatsApp
            </p>
            
            <div className="space-y-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => updateTicket({ status })}
                  disabled={updating || ticket.status === status}
                  className={`w-full text-left px-4 py-3 rounded-lg transition text-sm ${
                    ticket.status === status
                      ? 'bg-blue-600 text-white cursor-default'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                  }`}
                >
                  {ticket.status === status ? '✓ ' : ''}{status}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Priority</h2>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((priority) => (
                <button
                  key={priority}
                  onClick={() => updateTicket({ priority })}
                  disabled={updating || ticket.priority === priority}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    ticket.priority === priority
                      ? priority === 'Urgent' ? 'bg-red-600 text-white' :
                        priority === 'High' ? 'bg-orange-500 text-white' :
                        priority === 'Medium' ? 'bg-yellow-500 text-white' :
                        'bg-gray-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {ticket.memberEmail && (
                <a
                  href={`mailto:${ticket.memberEmail}?subject=Re: FLEX Support - ${ticket.ticketId}`}
                  className="w-full block text-center px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm"
                >
                  📧 Send Email
                </a>
              )}
              {ticket.memberPhone && (
                <a
                  href={`https://wa.me/${ticket.memberPhone.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm"
                >
                  💬 Open WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
