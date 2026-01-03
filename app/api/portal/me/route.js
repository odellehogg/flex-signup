// app/api/portal/me/route.js
// Returns current member data for authenticated user

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMemberById, getActiveDropsByMember, getMemberOpenTickets } from '@/lib/airtable'
import { getSubscription } from '@/lib/stripe-helpers'

export async function GET() {
  try {
    // Check authentication
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Get member from Airtable
    const member = await getMemberById(session.memberId)
    
    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }
    
    const fields = member.fields
    
    // Get active drops
    const drops = await getActiveDropsByMember(session.memberId)
    
    // Get open support tickets
    const tickets = await getMemberOpenTickets(session.memberId)
    
    // Get Stripe subscription details if available
    let subscriptionDetails = null
    const stripeSubId = fields['Stripe Subscription ID']
    
    if (stripeSubId) {
      try {
        const subscription = await getSubscription(stripeSubId)
        subscriptionDetails = {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          pauseCollection: subscription.pause_collection,
        }
      } catch (e) {
        console.error('Failed to get Stripe subscription:', e)
      }
    }
    
    // Calculate drops remaining
    const planName = fields['Subscription Tier'] || 'Essential'
    const dropsAllowed = getPlanDrops(planName)
    const dropsUsed = fields['Drops Used'] || 0
    const dropsRemaining = Math.max(0, dropsAllowed - dropsUsed)
    
    // Build response
    const memberData = {
      id: member.id,
      firstName: fields['First Name'] || '',
      lastName: fields['Last Name'] || '',
      email: fields['Email'] || '',
      phone: fields['Phone'] || '',
      
      // Subscription
      plan: planName,
      status: fields['Subscription Status'] || 'Active',
      dropsUsed,
      dropsAllowed,
      dropsRemaining,
      
      // Gym
      gymName: fields['Gym Name']?.[0] || fields['Gym Name'] || 'Not set',
      gymId: fields['Gym']?.[0] || null,
      
      // Stripe
      stripeCustomerId: fields['Stripe Customer ID'],
      stripeSubscriptionId: stripeSubId,
      subscription: subscriptionDetails,
      
      // Active drops
      activeDrops: drops.map(d => ({
        id: d.id,
        bagNumber: d.fields['Bag Number'],
        status: d.fields['Status'],
        dropDate: d.fields['Drop Date'],
      })),
      
      // Open tickets
      openTickets: tickets.map(t => ({
        id: t.id,
        ticketId: t.fields['Ticket ID'],
        type: t.fields['Type'],
        status: t.fields['Status'],
        createdAt: t.fields['Created At'],
      })),
      
      // Signup info
      signupDate: fields['Signup Date'],
      referralCode: fields['Referral Code'],
    }
    
    return NextResponse.json(memberData)
    
  } catch (error) {
    console.error('Get member error:', error)
    return NextResponse.json(
      { error: 'Failed to get member data' },
      { status: 500 }
    )
  }
}

function getPlanDrops(planName) {
  const plans = {
    'One-Off': 1,
    'Essential': 8,
    'Unlimited': 16,
  }
  return plans[planName] || 8
}
