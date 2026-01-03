'use client';

import { useState, useEffect, useCallback } from 'react';

export default function OpsMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
