'use client'

import { useState } from 'react'

export default function PortalLogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/portal/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout error:', err)
    }
    window.location.href = '/portal/login'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-gray-600 hover:text-red-600 text-sm disabled:opacity-50"
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  )
}
