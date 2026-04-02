'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'FAQs', href: '/faq' },
    { name: 'Contact', href: '/contact' },
    { name: 'Partners', href: '/partners' },
  ]

  return (
    <>
      <header className="fixed top-2 left-2 right-2 z-50 bg-white/92 backdrop-blur-2xl rounded-[20px] border border-flex-border" style={{ WebkitBackdropFilter: 'blur(20px)' }}>
        <nav className="px-4 md:px-5">
          <div className="flex items-center justify-between h-[50px]">
            {/* Logo */}
            <Link href="/" style={{ fontFamily: "'Unbounded', sans-serif" }} className="text-xl font-extrabold text-flex-black">
              FLEX
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-0.5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-[0.75rem] font-medium text-flex-muted hover:text-flex-black hover:bg-flex-bg px-2.5 py-1.5 rounded-full transition-all"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-1.5">
              <Link
                href="/portal"
                className="text-[0.75rem] font-medium text-flex-muted hover:text-flex-black px-2.5 py-1.5 rounded-full transition-colors"
              >
                Login
              </Link>
              <Link href="/join" className="bg-flex-black text-white text-[0.7rem] font-semibold px-4 py-2 rounded-full hover:bg-gray-800 transition-all hover:-translate-y-0.5">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-1 text-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 pt-16 px-5 pb-5 flex flex-col gap-0.5 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-2xl font-bold text-flex-black py-3 border-b border-flex-border"
              style={{ fontFamily: "'Unbounded', sans-serif" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="mt-auto flex flex-col gap-2 pt-4">
            <Link
              href="/portal"
              className="btn-secondary text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Member Login
            </Link>
            <Link
              href="/join"
              className="btn-primary text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
