// app/member/dashboard/page.js
// Member self-service dashboard
// Accessed via token in URL from WhatsApp link

import { getMemberByToken, getMemberDropsThisMonth, getActiveDropByMember } from '@/lib/airtable'
import { redirect } from 'next/navigation'
import MemberDashboardClient from '@/components/MemberDashboardClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default async function MemberDashboardPage({ searchParams }) {
  const token = searchParams?.token

  if (!token) {
    redirect('/member')
  }

  // Get member by token
  const member = await getMemberByToken(token)

  if (!member) {
    redirect('/member?error=invalid_token')
  }

  // Get member data
  const memberId = member.id
  const [dropsThisMonth, activeDrop] = await Promise.all([
    getMemberDropsThisMonth(memberId),
    getActiveDropByMember(memberId),
  ])

  // Calculate drops remaining
  const plan = member.fields['Subscription Tier'] || 'Essential'
  const dropsAllowed = plan === 'Unlimited' ? 16 : 10
  const dropsUsed = dropsThisMonth.length
  const dropsRemaining = Math.max(0, dropsAllowed - dropsUsed)

  const memberData = {
    id: memberId,
    firstName: member.fields['First Name'],
    lastName: member.fields['Last Name'],
    email: member.fields['Email'],
    phone: member.fields['Phone'],
    gym: member.fields['Gym'],
    plan,
    status: member.fields['Status'],
    stripeCustomerId: member.fields['Stripe Customer ID'],
    dropsUsed,
    dropsAllowed,
    dropsRemaining,
    activeDrop: activeDrop ? {
      bagNumber: activeDrop.fields['Bag Number'],
      status: activeDrop.fields['Status'],
      droppedAt: activeDrop.fields['Drop Date'],
      gym: activeDrop.fields['Gym'],
    } : null,
    recentDrops: dropsThisMonth.slice(0, 5).map(d => ({
      bagNumber: d.fields['Bag Number'],
      status: d.fields['Status'],
      date: d.fields['Drop Date'],
    })),
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-warm-gray py-8">
        <div className="container-width">
          <MemberDashboardClient member={memberData} token={token} />
        </div>
      </main>
      <Footer />
    </>
  )
}
