'use client'

// app/member/tickets/page.js
// View member's support tickets
// Matches existing member portal style

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function TicketsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      router.push('/member')
      return
    }
    fetchTickets()
  }, [token])

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/member/tickets?token=${token}`)
      if (response.status === 401) {
        router.push('/member?error=invalid_token')
        return
      }
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (err) {
      setError('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-700'
      case 'In Progress': return 'bg-blue-100 text-blue-700'
      case 'Resolved': return 'bg-green-100 text-green-700'
      case 'Closed': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-warm-gray py-8">
          <div className="container-width flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-flex-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-warm-gray py-8">
        <div className="container-width">
          <div className="max-w-lg mx-auto">
            
            <Link href={`/member/dashboard?token=${token}`} className="inline-flex items-center text-sm text-gray-600 hover:text-flex-navy mb-6">
              ← Back to dashboard
            </Link>

            <h1 className="text-2xl font-bold text-flex-navy mb-2">Support Tickets</h1>
            <p className="text-gray-600 mb-6">Track your support requests</p>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            {tickets.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-flex-navy mb-2">No tickets yet</h3>
                <p className="text-gray-600 text-sm mb-4">You haven't reported any issues.</p>
                <a href="https://wa.me/447366907286?text=HELP" className="text-flex-navy hover:underline font-medium">
                  Need help? Message us on WhatsApp →
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg divide-y">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-flex-navy font-medium">{ticket.ticketId}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{ticket.type}</p>
                        {ticket.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <a href="https://wa.me/447366907286?text=HELP" 
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Report a new issue
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
