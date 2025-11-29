// components/ops/OpsNav.js
// Navigation header for ops dashboard

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Truck, Shirt, Package, Users, BarChart3, History, LogOut } from 'lucide-react'

export default function OpsNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: '/ops', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/ops/pickups', label: 'Pickups', icon: Truck },
    { href: '/ops/laundry', label: 'Laundry', icon: Shirt },
    { href: '/ops/delivery', label: 'Delivery', icon: Package },
    { href: '/ops/members', label: 'Members', icon: Users },
    { href: '/ops/reports', label: 'Reports', icon: BarChart3 },
    { href: '/ops/audit', label: 'Audit', icon: History },
  ]

  const handleLogout = async () => {
    await fetch('/api/ops/auth', { method: 'DELETE' })
    router.push('/ops/login')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1e3a5f] text-white z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/ops" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#1e3a5f] font-bold text-xl">F</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">FLEX Ops</h1>
              <p className="text-blue-200 text-xs">Operations Dashboard</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/ops' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-blue-200 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
