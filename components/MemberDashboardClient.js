// components/MemberDashboardClient.js
// ============================================================================
// MEMBER PORTAL DASHBOARD
// Main dashboard component for logged-in members
// ============================================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MemberDashboardClient({ member, subscription, drops }) {
  const [activeDrops] = useState(drops || []);
  
  // Calculate drops remaining
  const dropsUsed = member?.['Drops This Period'] || 0;
  const planDrops = getPlanDrops(member?.['Subscription Tier']);
  const dropsRemaining = Math.max(0, planDrops - dropsUsed);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hey {member?.['First Name']}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s your FLEX dashboard
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Subscription Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Plan</h3>
            <StatusBadge status={member?.Status} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {member?.['Subscription Tier'] || 'No Plan'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {subscription?.cancel_at_period_end && 'Cancels at period end'}
          </p>
        </div>

        {/* Drops Remaining */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Drops Remaining</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-purple-600">{dropsRemaining}</span>
            <span className="text-gray-500 ml-2">of {planDrops}</span>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (dropsUsed / planDrops) * 100)}%` }}
            />
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Orders</h3>
          <p className="text-3xl font-bold text-gray-900">
            {activeDrops.filter(d => d.Status !== 'Collected').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {activeDrops.filter(d => d.Status === 'Ready').length} ready for pickup
          </p>
        </div>
      </div>

      {/* Active Drops */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Orders</h2>
        {activeDrops.length > 0 ? (
          <div className="space-y-4">
            {activeDrops.map((drop) => (
              <DropCard key={drop.id} drop={drop} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No active orders</p>
            <p className="text-sm mt-1">Text DROP to start a new drop!</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionCard
          href="/portal/plan"
          icon="📦"
          label="Change Plan"
        />
        <QuickActionCard
          href="/portal/gym"
          icon="🏋️"
          label="Change Gym"
        />
        <QuickActionCard
          href="/portal/billing"
          icon="💳"
          label="Billing"
        />
        <QuickActionCard
          href="/portal/support"
          icon="💬"
          label="Support"
        />
      </div>
    </div>
  );
}

// Helper Components
function StatusBadge({ status }) {
  const colors = {
    Active: 'bg-green-100 text-green-800',
    Paused: 'bg-yellow-100 text-yellow-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status || 'Unknown'}
    </span>
  );
}

function DropCard({ drop }) {
  const statusColors = {
    Dropped: 'bg-blue-500',
    'In Transit': 'bg-orange-500',
    'At Laundry': 'bg-purple-500',
    Ready: 'bg-green-500',
    Collected: 'bg-gray-400',
  };

  const statusEmoji = {
    Dropped: '📥',
    'In Transit': '🚚',
    'At Laundry': '🧺',
    Ready: '✅',
    Collected: '✔️',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <span className="text-2xl">{statusEmoji[drop.Status] || '📦'}</span>
        <div>
          <p className="font-medium text-gray-900">Bag {drop['Bag Number']}</p>
          <p className="text-sm text-gray-500">
            {drop['Drop Date'] ? new Date(drop['Drop Date']).toLocaleDateString('en-GB') : 'Unknown date'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`w-2 h-2 rounded-full ${statusColors[drop.Status] || 'bg-gray-400'}`} />
        <span className="text-sm font-medium text-gray-700">{drop.Status}</span>
      </div>
    </div>
  );
}

function QuickActionCard({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all"
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}

function getPlanDrops(planName) {
  const drops = {
    'One-Off': 1,
    'Essential': 10,
    'Unlimited': 16,
  };
  return drops[planName] || 0;
}
