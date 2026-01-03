// app/api/portal/subscription/route.js
// Subscription management - pause, resume, cancel, change plan

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMemberById, updateMember } from '@/lib/airtable'
import { 
  pauseSubscription, 
  resumeSubscription, 
  cancelSubscription,
  changeSubscriptionPlan,
  applyDiscount,
  getSubscription,
} from '@/lib/stripe-helpers'

// ============================================================================
// GET - Get subscription details
// ============================================================================

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const member = await getMemberById(session.memberId)
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    
    const stripeSubId = member.fields['Stripe Subscription ID']
    if (!stripeSubId) {
      return NextResponse.json({ 
        status: 'no_subscription',
        plan: member.fields['Subscription Tier'] || 'None',
      })
    }
    
    const subscription = await getSubscription(stripeSubId)
    
    return NextResponse.json({
      status: subscription.status,
      plan: member.fields['Subscription Tier'],
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      pauseCollection: subscription.pause_collection,
      pauseResumesAt: subscription.pause_collection?.resumes_at 
        ? new Date(subscription.pause_collection.resumes_at * 1000).toISOString()
        : null,
    })
    
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 })
  }
}

// ============================================================================
// POST - Subscription actions (pause, resume, cancel, change plan)
// ============================================================================

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const { action, ...params } = await request.json()
    
    const member = await getMemberById(session.memberId)
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    
    const stripeSubId = member.fields['Stripe Subscription ID']
    if (!stripeSubId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }
    
    switch (action) {
      case 'pause':
        return handlePause(member, stripeSubId, params)
      
      case 'resume':
        return handleResume(member, stripeSubId)
      
      case 'cancel':
        return handleCancel(member, stripeSubId, params)
      
      case 'change_plan':
        return handleChangePlan(member, stripeSubId, params)
      
      case 'apply_discount':
        return handleApplyDiscount(member, stripeSubId)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Subscription action error:', error)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handlePause(member, stripeSubId, params) {
  const { days = 14 } = params // Default 2 weeks
  
  // Max pause: 30 days
  const pauseDays = Math.min(days, 30)
  
  await pauseSubscription(stripeSubId, pauseDays)
  
  const resumeDate = new Date()
  resumeDate.setDate(resumeDate.getDate() + pauseDays)
  
  await updateMember(member.id, {
    'Subscription Status': 'Paused',
    'Pause Resume Date': resumeDate.toISOString(),
  })
  
  // Send WhatsApp notification
  const { sendPlainText } = await import('@/lib/whatsapp')
  const phone = member.fields['Phone']
  const firstName = member.fields['First Name'] || 'there'
  
  await sendPlainText(phone,
    `Hey ${firstName}! Your FLEX subscription is now paused. ⏸️\n\n` +
    `It will automatically resume on ${resumeDate.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })}.\n\n` +
    `You can resume anytime in your portal.\n\n` +
    `Reply MENU for options.`
  )
  
  return NextResponse.json({
    success: true,
    message: `Subscription paused until ${resumeDate.toLocaleDateString()}`,
    resumeDate: resumeDate.toISOString(),
  })
}

async function handleResume(member, stripeSubId) {
  await resumeSubscription(stripeSubId)
  
  await updateMember(member.id, {
    'Subscription Status': 'Active',
    'Pause Resume Date': null,
  })
  
  // Send WhatsApp notification
  const { sendPlainText } = await import('@/lib/whatsapp')
  const phone = member.fields['Phone']
  const firstName = member.fields['First Name'] || 'there'
  
  await sendPlainText(phone,
    `Welcome back, ${firstName}! 🎉\n\n` +
    `Your FLEX subscription is active again.\n\n` +
    `Ready to make a drop?\n\n` +
    `Reply DROP to start, or MENU for options.`
  )
  
  return NextResponse.json({
    success: true,
    message: 'Subscription resumed successfully',
  })
}

async function handleCancel(member, stripeSubId, params) {
  const { reason, immediate = false } = params
  
  if (immediate) {
    // Immediate cancellation (rare, usually for disputes)
    const { cancelSubscriptionImmediately } = await import('@/lib/stripe-helpers')
    await cancelSubscriptionImmediately(stripeSubId)
    
    await updateMember(member.id, {
      'Subscription Status': 'Cancelled',
      'Cancellation Reason': reason || 'Not specified',
      'Cancellation Date': new Date().toISOString(),
    })
  } else {
    // Cancel at period end (standard)
    await cancelSubscription(stripeSubId)
    
    await updateMember(member.id, {
      'Subscription Status': 'Cancelling',
      'Cancellation Reason': reason || 'Not specified',
    })
  }
  
  // Get subscription to find end date
  const subscription = await getSubscription(stripeSubId)
  const endDate = new Date(subscription.current_period_end * 1000)
  
  // Send WhatsApp notification
  const { sendPlainText } = await import('@/lib/whatsapp')
  const phone = member.fields['Phone']
  const firstName = member.fields['First Name'] || 'there'
  const dropsRemaining = (member.fields['Drops Allowed'] || 8) - (member.fields['Drops Used'] || 0)
  
  await sendPlainText(phone,
    `We're sorry to see you go, ${firstName}. 😢\n\n` +
    `Your subscription will end on ${endDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
    })}.\n\n` +
    `You still have ${dropsRemaining} drops remaining until then.\n\n` +
    `Changed your mind? You can reactivate anytime in your portal.`
  )
  
  return NextResponse.json({
    success: true,
    message: `Subscription will end on ${endDate.toLocaleDateString()}`,
    endDate: endDate.toISOString(),
    dropsRemaining,
  })
}

async function handleChangePlan(member, stripeSubId, params) {
  const { newPlan } = params
  
  const priceIds = {
    'Essential': process.env.STRIPE_PRICE_ESSENTIAL,
    'Unlimited': process.env.STRIPE_PRICE_UNLIMITED,
  }
  
  const newPriceId = priceIds[newPlan]
  if (!newPriceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  
  await changeSubscriptionPlan(stripeSubId, newPriceId)
  
  await updateMember(member.id, {
    'Subscription Tier': newPlan,
    'Drops Allowed': newPlan === 'Unlimited' ? 16 : 8,
  })
  
  // Send WhatsApp notification
  const { sendPlainText } = await import('@/lib/whatsapp')
  const phone = member.fields['Phone']
  const firstName = member.fields['First Name'] || 'there'
  
  const planDetails = {
    'Essential': { price: 35, drops: 8 },
    'Unlimited': { price: 48, drops: 16 },
  }
  
  await sendPlainText(phone,
    `Plan updated! ✅\n\n` +
    `You're now on the ${newPlan} plan:\n` +
    `• £${planDetails[newPlan].price}/month\n` +
    `• ${planDetails[newPlan].drops} drops/month\n\n` +
    `The change takes effect on your next billing date.\n\n` +
    `Reply MENU for options.`
  )
  
  return NextResponse.json({
    success: true,
    message: `Changed to ${newPlan} plan`,
    newPlan,
  })
}

async function handleApplyDiscount(member, stripeSubId) {
  // 20% off for 2 months retention offer
  await applyDiscount(stripeSubId, 20, 2)
  
  await updateMember(member.id, {
    'Subscription Status': 'Active',
    'Discount Applied': '20% for 2 months',
  })
  
  // Send WhatsApp notification
  const { sendPlainText } = await import('@/lib/whatsapp')
  const phone = member.fields['Phone']
  const firstName = member.fields['First Name'] || 'there'
  
  await sendPlainText(phone,
    `Great news, ${firstName}! 🎉\n\n` +
    `We've applied 20% off to your next 2 months.\n\n` +
    `Thanks for staying with FLEX!\n\n` +
    `Reply DROP to make a drop, or MENU for options.`
  )
  
  return NextResponse.json({
    success: true,
    message: '20% discount applied for 2 months',
  })
}
