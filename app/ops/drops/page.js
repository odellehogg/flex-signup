'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

const STATUSES = ['Dropped', 'In Transit', 'At Laundry', 'Ready', 'Collected'];

function DropsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [updating, setUpdating] = useState(null);

  const fetchDrops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      
      const res = await fetch(`/api/ops/drops?${params}`);
      const data = await res.json();
      setDrops(data.drops || []);
    } catch (err) {
      console.error('Failed to fetch drops:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  async function updateStatus(dropId, newStatus) {
    setUpdating(dropId);
    try {
      const res = await fetch(`/api/ops/drops/${dropId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        // Update local state
        setDrops(drops.map(d => 
          d.id === dropId ? { ...d, status: newStatus } : d
        ));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(null);
    }
  }

  function getStatusBadgeClass(status) {
    const classes = {
      'Dropped': 'badge-dropped',
      'In Transit': 'badge-transit',
      'At Laundry': 'badge-laundry',
      'Ready': 'badge-ready',
      'Collected': 'badge-collected',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  function getNextStatus(currentStatus) {
    const index = STATUSES.indexOf(currentStatus);
    return index < STATUSES.length - 1 ? STATUSES[index + 1] : null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Drops Management</h1>
        <button onClick={fetchDrops} className="btn-secondary text-sm">
          Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === '' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          All Active
        </button>
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

      {/* Drops Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : drops.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No drops found
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bag #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gym</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drop Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drops.map(drop => {
                const nextStatus = getNextStatus(drop.status);
                return (
                  <tr key={drop.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-mono font-medium">{drop.bagNumber}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{drop.memberName}</div>
                      <div className="text-sm text-gray-500">{drop.memberPhone}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{drop.gym}</td>
                    <td className="px-4 py-4 text-gray-600">
                      {drop.dropDate ? new Date(drop.dropDate).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(drop.status)}`}>
                        {drop.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {nextStatus && (
                        <button
                          onClick={() => updateStatus(drop.id, nextStatus)}
                          disabled={updating === drop.id}
                          className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                        >
                          {updating === drop.id ? 'Updating...' : `→ ${nextStatus}`}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function OpsDropsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <DropsContent />
    </Suspense>
  );
}
