'use client';

import { useState, useEffect, useCallback } from 'react';

export default function OpsMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/ops/members?${params}`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = members.filter(m => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      m.firstName?.toLowerCase().includes(searchLower) ||
      m.lastName?.toLowerCase().includes(searchLower) ||
      m.email?.toLowerCase().includes(searchLower) ||
      m.phone?.includes(search)
    );
  });

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!messageTarget || !messageText.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/ops/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: messageTarget.phone, message: messageText }),
      });
      if (res.ok) {
        setSendResult('sent');
        setMessageText('');
        setTimeout(() => { setMessageTarget(null); setSendResult(null); }, 2000);
      } else {
        setSendResult('error');
      }
    } catch {
      setSendResult('error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Members</h1>
        <div className="text-sm text-gray-500">{members.length} total</div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="spinner mx-auto"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No members found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Plan</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Drops</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Gym</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">{member.email}</div>
                    <div className="text-sm text-gray-400">{member.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">{member.plan || '-'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">{member.dropsRemaining || 0} remaining</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      member.status === 'Active' ? 'badge-active' :
                      member.status === 'Paused' ? 'badge-paused' :
                      'badge-cancelled'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{member.gym || '-'}</span>
                  </td>
                  <td className="py-3 px-4">
                    {member.phone && (
                      <button
                        onClick={() => { setMessageTarget(member); setMessageText(''); setSendResult(null); }}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Message
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Message Modal */}
      {messageTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold">Message on WhatsApp</h2>
                  <p className="text-sm text-gray-500">{messageTarget.firstName} {messageTarget.lastName} &middot; {messageTarget.phone}</p>
                </div>
                <button onClick={() => setMessageTarget(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>

              {sendResult === 'sent' ? (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-center">
                  Message sent!
                </div>
              ) : (
                <form onSubmit={handleSendMessage}>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {sendResult === 'error' && (
                    <p className="text-red-600 text-sm mb-3">Failed to send. Please try again.</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                    <button type="button" onClick={() => setMessageTarget(null)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
