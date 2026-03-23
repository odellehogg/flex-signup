'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

const STATUSES = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

function parseNotes(notes) {
  if (!notes) return [];
  return notes.split('\n').filter(Boolean).map(line => {
    const match = line.match(/^\[([^\]]+)\]\s*(\w+):\s*(.*)/);
    if (match) {
      return { timestamp: match[1], author: match[2], text: match[3] };
    }
    return { timestamp: '', author: '', text: line };
  });
}

function TicketsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'Open';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/tickets?status=${statusFilter}`);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function updateTicket(ticketId, updates) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/ops/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) fetchTickets();
    } catch (err) {
      console.error('Failed to update ticket:', err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleReply(ticketId) {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/ops/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText,
          newStatus: replyStatus || undefined,
        }),
      });
      if (res.ok) {
        setReplyText('');
        setReplyStatus('');
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  }

  function toggleExpand(ticket) {
    if (expandedId === ticket.id) {
      setExpandedId(null);
    } else {
      setExpandedId(ticket.id);
      setReplyText('');
      setReplyStatus(ticket.status);
    }
  }

  function getPriorityClass(priority) {
    const classes = {
      'Low': 'bg-gray-100 text-gray-800',
      'Normal': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800',
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }

  function getStatusClass(status) {
    const classes = {
      'Open': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Waiting on Customer': 'bg-purple-100 text-purple-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <button onClick={fetchTickets} className="btn-secondary text-sm">
          Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No {statusFilter.toLowerCase()} tickets
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => {
            const isExpanded = expandedId === ticket.id;
            const notes = parseNotes(ticket.internalNotes);
            const ticketShortId = ticket.id.slice(-6).toUpperCase();

            return (
              <div key={ticket.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Card Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(ticket)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">#{ticketShortId}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <h3 className="font-medium">{ticket.type}</h3>
                      {!isExpanded && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{ticket.description}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500 flex-shrink-0">
                      <div>{ticket.memberName}</div>
                      <div>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-GB') : ''}</div>
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {/* Description */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                      <p className="text-sm whitespace-pre-wrap mt-1">{ticket.description}</p>
                    </div>

                    {/* Member Info */}
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Phone: </span>
                        <span className="font-medium">{ticket.memberPhone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created: </span>
                        <span className="font-medium">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Conversation History */}
                    {notes.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Conversation</label>
                        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                          {notes.map((note, i) => (
                            <div key={i} className={`text-sm p-3 rounded-lg ${
                              note.author === 'FLEX' ? 'bg-green-50 ml-8' : 'bg-gray-50 mr-8'
                            }`}>
                              {note.timestamp && (
                                <div className="text-xs text-gray-400 mb-1">
                                  {note.author && <span className="font-medium">{note.author}</span>}
                                  {note.timestamp && <span> &middot; {note.timestamp}</span>}
                                </div>
                              )}
                              <p>{note.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reply Form */}
                    <div className="border-t border-gray-100 pt-4">
                      <label className="text-xs font-medium text-gray-500 uppercase">Reply (sends WhatsApp to member)</label>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />

                      <div className="flex items-center gap-3 mt-3">
                        <select
                          value={replyStatus}
                          onChange={(e) => setReplyStatus(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleReply(ticket.id)}
                          disabled={sending || !replyText.trim()}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          {sending ? 'Sending...' : 'Send Reply'}
                        </button>

                        <button
                          onClick={() => updateTicket(ticket.id, { status: replyStatus, priority: ticket.priority })}
                          disabled={updating}
                          className="btn-secondary text-sm disabled:opacity-50"
                        >
                          {updating ? 'Saving...' : 'Update Status Only'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OpsTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  );
}
