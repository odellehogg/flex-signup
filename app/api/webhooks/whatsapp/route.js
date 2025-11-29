// app/api/webhooks/whatsapp/route.js
// Complete WhatsApp automation for FLEX
// Handles: drops, tracking, subscriptions, help, issues, photos, account management

import { NextResponse } from 'next/server'
import {
  getMemberByPhone,
  updateMemberState,
  updateMember,
  createDrop,
  getActiveDropByMember,
  getDropAwaitingPickupConfirm,
  getMemberDropsThisMonth,
  updateDropStatus,
  createIssue,
  getGyms,
} from '@/lib/airtable'
import {
  sendMainMenu,
  sendDropGuide,
  sendBagConfirmed,
  sendInvalidBag,
  sendCheckDrops,
  sendTrackActive,
  sendTrackNone,
  sendManageSub,
  sendPauseMenu,
  sendPauseConfirmed,
  sendResumeConfirmed,
  sendCancelReason,
  sendCancelRetention,
  sendCancelConfirmed,
  sendHelpMenu,
  sendFeedbackGreat,
  sendFeedbackBad,
  sendIssueReported,
  sendPickupBlocked,
  sendPickupConfirmedThanks,
  sendNotAMember,
  sendMyAccount,
  sendChangeGymMenu,
  sendGymChanged,
  sendChangePlanMenu,
  sendPlanChanged,
  sendBillingHelp,
  sendDamagePhotoRequest,
  sendDamageReceived,
  sendIssueTypeMenu,
} from '@/lib/whatsapp'
import {
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  applyDiscount,
  changeSubscriptionPlan,
} from '@/lib/stripe-helpers'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const from = formData.get('From')
    const body = formData.get('Body')?.trim() || ''
    const bodyUpper = body.toUpperCase()
    const buttonPayload = formData.get('ButtonPayload') || ''
    
    // Check for media (photo upload)
    const numMedia = parseInt(formData.get('NumMedia') || '0')
    const mediaUrl = numMedia > 0 ? formData.get('MediaUrl0') : null
    const mediaType = numMedia > 0 ? formData.get('MediaContentType0') : null

    // Get the action (from button or text)
    const action = buttonPayload || bodyUpper

    console.log(`📱 WhatsApp from ${from}: "${action}"${mediaUrl ? ' [with media]' : ''}`)

    // =========================================================================
    // GET MEMBER - Handle unknown numbers
    // =========================================================================
    
    const member = await getMemberByPhone(from)
    
    if (!member) {
      console.log(`Unknown number: ${from} - sending signup prompt`)
      await sendNotAMember(from)
      return NextResponse.json({ success: true })
    }

    const memberId = member.id
    const firstName = member.fields['First Name'] || 'there'
    const gymName = member.fields['Gym'] || 'your gym'
    const planName = member.fields['Subscription Tier'] || 'Essential'
    const email = member.fields['Email'] || ''
    const state = member.fields['Conversation State'] || 'idle'
    const stripeSubId = member.fields['Stripe Subscription ID']

    // =========================================================================
    // CHECK FOR PENDING PICKUP CONFIRMATION (Abuse Prevention Gate)
    // =========================================================================
    
    const pendingPickup = await getDropAwaitingPickupConfirm(memberId)
    
    // =========================================================================
    // PHOTO UPLOAD HANDLING (for damage claims)
    // =========================================================================
    
    if (mediaUrl && state === 'awaiting_damage_photo') {
      // Save the damage claim with photo
      const issue = await createIssue(memberId, 'Damage Claim', `Photo uploaded: ${mediaUrl}\n\nDescription: ${body || 'No description provided'}`, mediaUrl)
      await sendDamageReceived(from, issue.fields['Ticket ID'])
      await updateMemberState(memberId, 'idle')
      console.log(`📸 Damage photo received for ticket ${issue.fields['Ticket ID']}`)
      return NextResponse.json({ success: true })
    }
    
    // =========================================================================
    // PICKUP CONFIRMATION FLOW
    // =========================================================================
    
    if (action === 'CONFIRM_PICKUP' || action === 'YES_COLLECTED') {
      if (pendingPickup) {
        await updateDropStatus(pendingPickup.id, 'Collected')
        await sendPickupConfirmedThanks(from)
        await updateMemberState(memberId, 'idle')
        console.log(`✅ Pickup confirmed for bag ${pendingPickup.fields['Bag Number']}`)
      } else {
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'main_menu')
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'NOT_COLLECTED' || action === 'HAVENT_COLLECTED') {
      await sendMainMenu(from, firstName)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // GLOBAL KEYWORDS (work from any state)
    // =========================================================================
    
    if (['MENU', 'HI', 'HELLO', 'START', 'HOME'].includes(action)) {
      await updateMemberState(memberId, 'main_menu')
      await sendMainMenu(from, firstName)
      return NextResponse.json({ success: true })
    }

    if (['HELP', '?'].includes(action)) {
      await updateMemberState(memberId, 'help_menu')
      await sendHelpMenu(from)
      return NextResponse.json({ success: true })
    }

    if (['DROP', 'DROPOFF', 'DROP-OFF'].includes(action)) {
      if (pendingPickup) {
        const bagNumber = pendingPickup.fields['Bag Number']
        await sendPickupBlocked(from, bagNumber, gymName)
        return NextResponse.json({ success: true })
      }
      
      await updateMemberState(memberId, 'awaiting_bag_number')
      await sendDropGuide(from, gymName)
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // BAG NUMBER VALIDATION
    // =========================================================================
    
    if (/^B\d{3,4}$/i.test(action)) {
      if (pendingPickup) {
        const bagNumber = pendingPickup.fields['Bag Number']
        await sendPickupBlocked(from, bagNumber, gymName)
        return NextResponse.json({ success: true })
      }
      
      const bagNumber = action.toUpperCase()
      
      await createDrop(memberId, bagNumber, gymName)
      await updateMemberState(memberId, 'idle')
      
      const expectedDate = new Date()
      expectedDate.setHours(expectedDate.getHours() + 48)
      const formatted = expectedDate.toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short'
      })
      
      await sendBagConfirmed(from, bagNumber, gymName, formatted)
      return NextResponse.json({ success: true })
    }

    if (state === 'awaiting_bag_number') {
      await sendInvalidBag(from)
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // MAIN MENU ACTIONS
    // =========================================================================
    
    // Check Drops
    if (action === 'CHECK_DROPS' || (state === 'main_menu' && action === '1')) {
      const dropsUsed = await getMemberDropsThisMonth(memberId)
      const totalDrops = planName === 'Unlimited' ? 16 : (planName === 'Essential' ? 10 : 1)
      const remaining = Math.max(0, totalDrops - dropsUsed)
      const renewDate = getNextBillingDate(member.fields['Signup Date'])
      
      await sendCheckDrops(from, planName, dropsUsed, totalDrops, remaining, renewDate)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // Track Order
    if (action === 'TRACK_ORDER' || (state === 'main_menu' && action === '2')) {
      const activeDrop = await getActiveDropByMember(memberId)
      
      if (activeDrop) {
        const bagNumber = activeDrop.fields['Bag Number']
        const status = activeDrop.fields['Status']
        const expectedDate = activeDrop.fields['Ready Date'] || 'within 48 hours'
        await sendTrackActive(from, bagNumber, status, gymName, expectedDate)
      } else {
        await sendTrackNone(from)
      }
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // Manage Subscription
    if (action === 'MANAGE_SUB' || (state === 'main_menu' && action === '3')) {
      const nextBilling = getNextBillingDate(member.fields['Signup Date'])
      const price = planName === 'Unlimited' ? 48 : (planName === 'Essential' ? 30 : 5)
      
      await sendManageSub(from, planName, price, nextBilling)
      await updateMemberState(memberId, 'subscription_menu')
      return NextResponse.json({ success: true })
    }

    // My Account (NEW)
    if (action === 'MY_ACCOUNT' || (state === 'main_menu' && action === '4')) {
      const dropsUsed = await getMemberDropsThisMonth(memberId)
      const totalDrops = planName === 'Unlimited' ? 16 : (planName === 'Essential' ? 10 : 1)
      const remaining = Math.max(0, totalDrops - dropsUsed)
      const nextBilling = getNextBillingDate(member.fields['Signup Date'])
      
      await sendMyAccount(from, firstName, email, gymName, planName, remaining, totalDrops, nextBilling)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // SUBSCRIPTION MENU ACTIONS
    // =========================================================================
    
    // Pause Subscription
    if (action === 'PAUSE_SUB' || (state === 'subscription_menu' && action === '1')) {
      await sendPauseMenu(from)
      await updateMemberState(memberId, 'pause_menu')
      return NextResponse.json({ success: true })
    }

    if (state === 'pause_menu') {
      let days = 0
      if (action === 'PAUSE_2WEEKS' || action === '1') days = 14
      if (action === 'PAUSE_1MONTH' || action === '2') days = 30
      
      if (days > 0 && stripeSubId) {
        const resumeDate = new Date()
        resumeDate.setDate(resumeDate.getDate() + days)
        const formatted = resumeDate.toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long'
        })
        
        await pauseSubscription(stripeSubId, days)
        await sendPauseConfirmed(from, formatted)
        await updateMemberState(memberId, 'idle')
        return NextResponse.json({ success: true })
      }
    }

    // Resume Subscription
    if (action === 'RESUME_SUB' || (state === 'subscription_menu' && action === '2')) {
      if (stripeSubId) {
        await resumeSubscription(stripeSubId)
        await sendResumeConfirmed(from)
        await updateMemberState(memberId, 'idle')
      }
      return NextResponse.json({ success: true })
    }

    // Cancel Subscription
    if (action === 'CANCEL_SUB' || (state === 'subscription_menu' && action === '3')) {
      await sendCancelReason(from)
      await updateMemberState(memberId, 'cancel_reason')
      return NextResponse.json({ success: true })
    }

    // Change Gym (NEW)
    if (action === 'CHANGE_GYM' || (state === 'subscription_menu' && action === '4')) {
      const gyms = await getGyms()
      const gymList = gyms.filter(g => g.name !== gymName).map(g => g.name)
      await sendChangeGymMenu(from, gymName, gymList)
      await updateMemberState(memberId, 'change_gym')
      return NextResponse.json({ success: true })
    }

    // Change Plan (NEW)
    if (action === 'CHANGE_PLAN' || (state === 'subscription_menu' && action === '5')) {
      await sendChangePlanMenu(from, planName)
      await updateMemberState(memberId, 'change_plan')
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // CHANGE GYM FLOW (NEW)
    // =========================================================================
    
    if (state === 'change_gym') {
      // User selected a gym (number or name)
      const gyms = await getGyms()
      const gymList = gyms.filter(g => g.name !== gymName)
      
      let selectedGym = null
      const numChoice = parseInt(action)
      
      if (!isNaN(numChoice) && numChoice >= 1 && numChoice <= gymList.length) {
        selectedGym = gymList[numChoice - 1]
      } else {
        // Try matching by name
        selectedGym = gyms.find(g => g.name.toUpperCase() === action || g.slug?.toUpperCase() === action)
      }
      
      if (selectedGym) {
        await updateMember(memberId, { 'Gym': selectedGym.name })
        await sendGymChanged(from, selectedGym.name)
        await updateMemberState(memberId, 'idle')
        console.log(`🏋️ Gym changed to ${selectedGym.name} for member ${memberId}`)
      } else {
        // Invalid selection, show menu again
        await sendChangeGymMenu(from, gymName, gymList.map(g => g.name))
      }
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // CHANGE PLAN FLOW (NEW - Essential only for MVP)
    // =========================================================================
    
    if (state === 'change_plan') {
      // For MVP, only Essential is available, so any request goes to contact
      if (action === '1' || action === 'ESSENTIAL') {
        if (planName !== 'Essential') {
          // Downgrade to Essential
          if (stripeSubId) {
            await changeSubscriptionPlan(stripeSubId, 'essential')
            await updateMember(memberId, { 'Subscription Tier': 'Essential' })
            await sendPlanChanged(from, 'Essential', 30, 10)
            console.log(`📦 Plan changed to Essential for member ${memberId}`)
          }
        } else {
          // Already on Essential
          await sendMainMenu(from, firstName)
        }
        await updateMemberState(memberId, 'idle')
      } else if (action === '2' || action === 'UNLIMITED') {
        // Unlimited not available in MVP
        await sendPlanChanged(from, 'Unlimited', 0, 0, true) // unavailable flag
        await updateMemberState(memberId, 'idle')
      } else {
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'idle')
      }
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // CANCEL FLOW
    // =========================================================================
    
    if (state === 'cancel_reason') {
      await sendCancelRetention(from)
      await updateMemberState(memberId, 'cancel_retention')
      return NextResponse.json({ success: true })
    }

    if (state === 'cancel_retention') {
      if (action === 'ACCEPT_OFFER' || action === '1') {
        if (stripeSubId) {
          await applyDiscount(stripeSubId, 20, 2)
        }
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'idle')
      } else if (action === 'CONFIRM_CANCEL' || action === '2') {
        if (stripeSubId) {
          await cancelSubscription(stripeSubId)
        }
        const dropsRemaining = await getMemberDropsThisMonth(memberId)
        const endDate = getNextBillingDate(member.fields['Signup Date'])
        await sendCancelConfirmed(from, dropsRemaining, endDate)
        await updateMemberState(memberId, 'idle')
      }
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // HELP MENU ACTIONS (UPDATED with Billing and Issue Types)
    // =========================================================================
    
    if (state === 'help_menu') {
      switch (action) {
        case '1':
        case 'WHAT_IS_DROP':
          // Info about drops - just acknowledge
          await updateMemberState(memberId, 'idle')
          break
          
        case '2':
        case 'TURNAROUND':
          await updateMemberState(memberId, 'idle')
          break
          
        case '3':
        case 'WHAT_ITEMS':
          await updateMemberState(memberId, 'idle')
          break
          
        case '4':
        case 'HOW_WORKS':
          await updateMemberState(memberId, 'idle')
          break
          
        case '5':
        case 'PAUSE_CANCEL':
          await updateMemberState(memberId, 'idle')
          break
          
        case '6':
        case 'COMMANDS':
          await updateMemberState(memberId, 'idle')
          break
          
        case '7':
        case 'REPORT_ISSUE':
          // Show issue type menu
          await sendIssueTypeMenu(from)
          await updateMemberState(memberId, 'select_issue_type')
          break
          
        case '8':
        case 'BILLING':
          // Billing help (NEW)
          const nextBilling = getNextBillingDate(member.fields['Signup Date'])
          const price = planName === 'Unlimited' ? 48 : (planName === 'Essential' ? 30 : 5)
          await sendBillingHelp(from, planName, price, nextBilling)
          await updateMemberState(memberId, 'idle')
          break
          
        case '9':
        case 'PRICING':
          await updateMemberState(memberId, 'idle')
          break
          
        default:
          await sendHelpMenu(from)
      }
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // ISSUE TYPE SELECTION (NEW)
    // =========================================================================
    
    if (state === 'select_issue_type') {
      let issueType = null
      
      switch (action) {
        case '1':
        case 'LATE_DELIVERY':
          issueType = 'Late Delivery'
          await updateMemberState(memberId, 'awaiting_issue')
          break
          
        case '2':
        case 'MISSING_BAG':
          issueType = 'Missing Bag'
          await updateMemberState(memberId, 'awaiting_issue')
          break
          
        case '3':
        case 'WRONG_ITEMS':
          issueType = 'Wrong Items'
          await updateMemberState(memberId, 'awaiting_issue')
          break
          
        case '4':
        case 'DAMAGE_CLAIM':
          // For damage, request photo
          await sendDamagePhotoRequest(from)
          await updateMemberState(memberId, 'awaiting_damage_photo')
          return NextResponse.json({ success: true })
          
        case '5':
        case 'OTHER':
          issueType = 'Other'
          await updateMemberState(memberId, 'awaiting_issue')
          break
          
        default:
          await sendIssueTypeMenu(from)
          return NextResponse.json({ success: true })
      }
      
      if (issueType) {
        // Store the issue type temporarily
        await updateMember(memberId, { 'Pending Issue Type': issueType })
      }
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // AWAITING ISSUE DESCRIPTION
    // =========================================================================
    
    if (state === 'awaiting_issue') {
      const issueType = member.fields['Pending Issue Type'] || 'Other'
      const issue = await createIssue(memberId, issueType, body)
      await sendIssueReported(from, issue.fields['Ticket ID'])
      await updateMember(memberId, { 'Pending Issue Type': '' })
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // FEEDBACK FLOW
    // =========================================================================
    
    if (action === 'FEEDBACK_GREAT' || action === '😊') {
      const referralCode = member.fields['Referral Code'] || 'FLEX10'
      await sendFeedbackGreat(from, referralCode)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    if (action === 'FEEDBACK_OK' || action === '😐') {
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    if (action === 'FEEDBACK_BAD' || action === '😞') {
      await sendFeedbackBad(from)
      await updateMemberState(memberId, 'awaiting_feedback')
      return NextResponse.json({ success: true })
    }

    if (state === 'awaiting_feedback') {
      const issue = await createIssue(memberId, 'Feedback', body)
      await sendIssueReported(from, issue.fields['Ticket ID'])
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // DEFAULT: Show main menu
    // =========================================================================
    
    await sendMainMenu(from, firstName)
    await updateMemberState(memberId, 'main_menu')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getNextBillingDate(signupDate) {
  if (!signupDate) return 'your next billing date'
  
  const signup = new Date(signupDate)
  const now = new Date()
  const dayOfMonth = signup.getDate()
  
  let billing = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
  if (billing <= now) {
    billing.setMonth(billing.getMonth() + 1)
  }
  
  return billing.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  })
}
