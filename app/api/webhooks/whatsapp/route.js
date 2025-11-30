// app/api/webhooks/whatsapp/route.js
// Complete WhatsApp automation for FLEX
// FIXED: Button mappings to match TEMPLATES.md + bag confirmation logging

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
  sendHowItWorks,
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
  sendDiscountApplied,
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

    // Get the action (from button payload or text body)
    const rawAction = buttonPayload || bodyUpper
    const action = rawAction.toUpperCase().trim()

    console.log(`📱 WhatsApp from ${from}: "${action}"${mediaUrl ? ' [with media]' : ''}`)

    // =========================================================================
    // GET MEMBER - Handle unknown numbers
    // =========================================================================
    
    const member = await getMemberByPhone(from)
    
    if (!member) {
      console.log(`❌ Unknown number: ${from} - sending signup prompt`)
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

    console.log(`✅ Member: ${firstName} | State: ${state} | Action: ${action}`)

    // =========================================================================
    // CHECK FOR PENDING PICKUP CONFIRMATION (Abuse Prevention Gate)
    // =========================================================================
    
    const pendingPickup = await getDropAwaitingPickupConfirm(memberId)
    
    // =========================================================================
    // PHOTO UPLOAD HANDLING (for damage claims)
    // =========================================================================
    
    if (mediaUrl && state === 'awaiting_damage_photo') {
      const issue = await createIssue(memberId, 'Damage Claim', `Photo uploaded: ${mediaUrl}\n\nDescription: ${body || 'No description provided'}`, mediaUrl)
      await sendDamageReceived(from, issue.fields['Ticket ID'])
      await updateMemberState(memberId, 'idle')
      console.log(`📸 Damage photo received for ticket ${issue.fields['Ticket ID']}`)
      return NextResponse.json({ success: true })
    }
    
    // =========================================================================
    // PICKUP CONFIRMATION FLOW
    // =========================================================================
    
    if (action === 'CONFIRM_PICKUP' || action === 'YES_COLLECTED' || action === 'YES, COLLECTED') {
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

    if (action === 'NOT_COLLECTED' || action === 'NOT YET' || action === 'HAVENT_COLLECTED') {
      await sendMainMenu(from, firstName)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // GLOBAL KEYWORDS (work from any state)
    // =========================================================================
    
    if (['MENU', 'HI', 'HELLO', 'START', 'HOME', 'MAIN MENU', 'BACK', 'BACK TO MENU'].includes(action)) {
      await updateMemberState(memberId, 'main_menu')
      await sendMainMenu(from, firstName)
      return NextResponse.json({ success: true })
    }

    if (['HELP', '?', 'NEED HELP'].includes(action)) {
      await updateMemberState(memberId, 'help_menu')
      await sendHelpMenu(from)
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // FIX: HOW_WORKS (from template) + HOW_IT_WORKS (alternative)
    // =========================================================================
    
    if (['HOW_WORKS', 'HOW_IT_WORKS', 'HOW IT WORKS', 'HOW'].includes(action)) {
      await sendHowItWorks(from)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // DROP FLOW
    // =========================================================================
    
    if (['DROP', 'DROPOFF', 'DROP-OFF', 'START A DROP', 'START DROP'].includes(action)) {
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
    // BAG NUMBER VALIDATION - FIXED with better logging
    // =========================================================================
    
    // Match B001, B0001, or just 001, 0001
    const bagMatch = rawAction.match(/^B?\d{3,4}$/i)
    
    if (bagMatch) {
      if (pendingPickup) {
        const bagNumber = pendingPickup.fields['Bag Number']
        await sendPickupBlocked(from, bagNumber, gymName)
        return NextResponse.json({ success: true })
      }
      
      // Normalize bag number to B-prefix format
      let bagNumber = rawAction.toUpperCase()
      if (!bagNumber.startsWith('B')) {
        bagNumber = 'B' + bagNumber.padStart(3, '0')
      }
      
      console.log(`📦 Creating drop for bag: ${bagNumber}`)
      
      try {
        // Create the drop in Airtable
        const drop = await createDrop(memberId, bagNumber, gymName)
        console.log(`✅ Drop created in Airtable: ${drop?.id || 'unknown'}`)
        
        await updateMemberState(memberId, 'idle')
        
        // Calculate expected date (48 hours from now)
        const expectedDate = new Date()
        expectedDate.setHours(expectedDate.getHours() + 48)
        const formatted = expectedDate.toLocaleDateString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short'
        })
        
        // Send confirmation - THIS IS THE KEY PART
        console.log(`📤 Sending bag confirmation for ${bagNumber}...`)
        const result = await sendBagConfirmed(from, bagNumber, gymName, formatted)
        console.log(`✅ Bag confirmation sent: ${result?.sid || 'sent'}`)
        
      } catch (error) {
        console.error(`❌ Error in bag flow: ${error.message}`)
        console.error(`   Stack: ${error.stack}`)
        // Don't throw - still return success to Twilio to prevent retries
      }
      
      return NextResponse.json({ success: true })
    }

    // If we're awaiting bag number but input wasn't valid
    if (state === 'awaiting_bag_number') {
      console.log(`❌ Invalid bag number format: "${rawAction}"`)
      await sendInvalidBag(from)
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // MAIN MENU ACTIONS
    // =========================================================================
    
    // Check Drops
    if (action === 'CHECK_DROPS' || action === 'CHECK DROPS' || (state === 'main_menu' && action === '1')) {
      const dropsUsed = await getMemberDropsThisMonth(memberId)
      const totalDrops = planName === 'Unlimited' ? 16 : (planName === 'Essential' ? 10 : 1)
      const remaining = Math.max(0, totalDrops - dropsUsed)
      const renewDate = getNextBillingDate(member.fields['Signup Date'])
      
      await sendCheckDrops(from, planName, dropsUsed, totalDrops, remaining, renewDate)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // FIX: TRACK (from template) + TRACK_ORDER (alternative)
    // =========================================================================
    
    if (['TRACK', 'TRACK_ORDER', 'TRACK ORDER'].includes(action) || (state === 'main_menu' && action === '2')) {
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
    if (['MANAGE_SUB', 'MANAGE SUB', 'MANAGE SUBSCRIPTION'].includes(action) || (state === 'main_menu' && action === '3')) {
      const nextBilling = getNextBillingDate(member.fields['Signup Date'])
      const price = planName === 'Unlimited' ? 48 : (planName === 'Essential' ? 30 : 5)
      
      await sendManageSub(from, planName, price, nextBilling)
      await updateMemberState(memberId, 'subscription_menu')
      return NextResponse.json({ success: true })
    }

    // My Account
    if (['MY_ACCOUNT', 'MY ACCOUNT', 'ACCOUNT'].includes(action) || (state === 'main_menu' && action === '4')) {
      const dropsUsed = await getMemberDropsThisMonth(memberId)
      const totalDrops = planName === 'Unlimited' ? 16 : (planName === 'Essential' ? 10 : 1)
      const remaining = Math.max(0, totalDrops - dropsUsed)
      const nextBilling = getNextBillingDate(member.fields['Signup Date'])
      
      await sendMyAccount(from, firstName, email, gymName, planName, remaining, totalDrops, nextBilling)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // Help from main menu
    if (state === 'main_menu' && action === '5') {
      await updateMemberState(memberId, 'help_menu')
      await sendHelpMenu(from)
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // SUBSCRIPTION MENU ACTIONS
    // =========================================================================
    
    // Pause Subscription
    if (['PAUSE_SUB', 'PAUSE SUB', 'PAUSE', 'EXTEND PAUSE'].includes(action) || (state === 'subscription_menu' && action === '1')) {
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
      
      // Cancel from pause menu goes back to main
      if (action === 'CANCEL' || action === 'MENU') {
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'main_menu')
        return NextResponse.json({ success: true })
      }
    }

    // Resume Subscription
    if (['RESUME_SUB', 'RESUME SUB', 'RESUME'].includes(action) || (state === 'subscription_menu' && action === '2')) {
      if (stripeSubId) {
        await resumeSubscription(stripeSubId)
        await sendResumeConfirmed(from)
      }
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    // Cancel Subscription
    if (['CANCEL_SUB', 'CANCEL SUB'].includes(action) || (state === 'subscription_menu' && action === '3')) {
      await sendCancelReason(from)
      await updateMemberState(memberId, 'cancel_reason')
      return NextResponse.json({ success: true })
    }

    // Change Gym
    if (['CHANGE_GYM', 'CHANGE GYM'].includes(action) || (state === 'subscription_menu' && action === '4')) {
      const gyms = await getGyms()
      const gymList = gyms.filter(g => g.name !== gymName).map(g => g.name)
      await sendChangeGymMenu(from, gymName, gymList)
      await updateMemberState(memberId, 'change_gym')
      return NextResponse.json({ success: true })
    }

    // Change Plan
    if (['CHANGE_PLAN', 'CHANGE PLAN'].includes(action) || (state === 'subscription_menu' && action === '5')) {
      await sendChangePlanMenu(from, planName)
      await updateMemberState(memberId, 'change_plan')
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // CHANGE GYM FLOW
    // =========================================================================
    
    if (state === 'change_gym') {
      // Cancel goes back to menu
      if (action === 'CANCEL' || action === 'MENU') {
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'main_menu')
        return NextResponse.json({ success: true })
      }
      
      const gyms = await getGyms()
      const gymList = gyms.filter(g => g.name !== gymName)
      
      let selectedGym = null
      const numChoice = parseInt(action)
      
      if (!isNaN(numChoice) && numChoice >= 1 && numChoice <= gymList.length) {
        selectedGym = gymList[numChoice - 1]
      } else {
        selectedGym = gyms.find(g => g.name.toUpperCase() === action || g.slug?.toUpperCase() === action)
      }
      
      if (selectedGym) {
        await updateMember(memberId, { 'Gym': selectedGym.name })
        await sendGymChanged(from, selectedGym.name)
        await updateMemberState(memberId, 'idle')
        console.log(`🏋️ Gym changed to ${selectedGym.name}`)
      } else {
        await sendChangeGymMenu(from, gymName, gymList.map(g => g.name))
      }
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // CHANGE PLAN FLOW
    // =========================================================================
    
    if (state === 'change_plan') {
      // Cancel goes back to menu
      if (action === 'CANCEL' || action === 'MENU') {
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'main_menu')
        return NextResponse.json({ success: true })
      }
      
      if (action === '1' || action === 'ESSENTIAL') {
        if (planName !== 'Essential') {
          if (stripeSubId) {
            await changeSubscriptionPlan(stripeSubId, 'essential')
            await updateMember(memberId, { 'Subscription Tier': 'Essential' })
            await sendPlanChanged(from, 'Essential', 30, 10)
            console.log(`📦 Plan changed to Essential`)
          }
        } else {
          await sendMainMenu(from, firstName)
        }
        await updateMemberState(memberId, 'idle')
      } else if (action === '2' || action === 'UNLIMITED') {
        await sendPlanChanged(from, 'Unlimited', 0, 0, true) // unavailable
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
      // Never Mind button goes back to menu
      if (action === 'NEVER MIND' || action === 'MENU') {
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'main_menu')
        return NextResponse.json({ success: true })
      }
      
      // Any other response (reason selection) triggers retention offer
      await sendCancelRetention(from)
      await updateMemberState(memberId, 'cancel_retention')
      return NextResponse.json({ success: true })
    }

    if (state === 'cancel_retention') {
      if (['ACCEPT_OFFER', 'ACCEPT OFFER', 'KEEP MY DISCOUNT'].includes(action) || action === '1') {
        if (stripeSubId) {
          await applyDiscount(stripeSubId, 20, 2)
        }
        await sendDiscountApplied(from)
        await updateMemberState(memberId, 'idle')
      } else if (['CONFIRM_CANCEL', 'CONFIRM CANCEL', 'CANCEL ANYWAY'].includes(action) || action === '2') {
        if (stripeSubId) {
          await cancelSubscription(stripeSubId)
        }
        const dropsRemaining = await getMemberDropsThisMonth(memberId)
        const endDate = getNextBillingDate(member.fields['Signup Date'])
        await sendCancelConfirmed(from, dropsRemaining, endDate)
        await updateMemberState(memberId, 'idle')
      } else {
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'main_menu')
      }
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // HELP MENU ACTIONS
    // =========================================================================
    
    if (state === 'help_menu') {
      switch (action) {
        case '1': // What counts as a drop?
        case '2': // How long until pickup?
        case '3': // What can I include?
        case '4': // How does cleaning work?
        case '5': // Can I pause/cancel?
        case '6': // WhatsApp commands
        case '9': // Pricing
          await updateMemberState(memberId, 'idle')
          break
          
        case '7': // Report an issue
          await sendIssueTypeMenu(from)
          await updateMemberState(memberId, 'select_issue_type')
          break
          
        case '8': // Billing
          const nextBilling = getNextBillingDate(member.fields['Signup Date'])
          const price = planName === 'Unlimited' ? 48 : (planName === 'Essential' ? 30 : 5)
          await sendBillingHelp(from, planName, price, nextBilling)
          await updateMemberState(memberId, 'idle')
          break
          
        default:
          // MENU or CANCEL goes back
          if (action === 'MENU' || action === 'CANCEL') {
            await sendMainMenu(from, firstName)
            await updateMemberState(memberId, 'main_menu')
          } else {
            await sendHelpMenu(from)
          }
      }
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // ISSUE TYPE SELECTION
    // =========================================================================
    
    if (state === 'select_issue_type') {
      // Cancel goes back
      if (action === 'CANCEL' || action === 'MENU') {
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'main_menu')
        return NextResponse.json({ success: true })
      }
      
      let issueType = null
      
      switch (action) {
        case '1':
        case 'LATE_DELIVERY':
        case 'LATE DELIVERY':
          issueType = 'Late Delivery'
          break
        case '2':
        case 'MISSING_BAG':
        case 'MISSING BAG':
          issueType = 'Missing Bag'
          break
        case '3':
        case 'WRONG_ITEMS':
        case 'WRONG ITEMS':
          issueType = 'Wrong Items'
          break
        case '4':
        case 'DAMAGE_CLAIM':
        case 'DAMAGE CLAIM':
        case 'DAMAGE':
          await sendDamagePhotoRequest(from)
          await updateMemberState(memberId, 'awaiting_damage_photo')
          return NextResponse.json({ success: true })
        case '5':
        case 'OTHER':
          issueType = 'Other'
          break
        default:
          await sendIssueTypeMenu(from)
          return NextResponse.json({ success: true })
      }
      
      if (issueType) {
        await updateMember(memberId, { 'Pending Issue Type': issueType })
        await updateMemberState(memberId, 'awaiting_issue')
        // TODO: Send "please describe your issue" message
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
    // FEEDBACK FLOW - Fixed emoji button payloads
    // =========================================================================
    
    if (['FEEDBACK_GREAT', '😊 GREAT', 'GREAT', '😊'].includes(action)) {
      const referralCode = member.fields['Referral Code'] || 'FLEX10'
      await sendFeedbackGreat(from, referralCode)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    if (['FEEDBACK_OK', '😐 OK', 'OK', '😐'].includes(action)) {
      await sendMainMenu(from, firstName)
      await updateMemberState(memberId, 'idle')
      return NextResponse.json({ success: true })
    }

    if (['FEEDBACK_BAD', '😞 NOT GOOD', 'NOT GOOD', 'BAD', '😞'].includes(action)) {
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
    // GOT IT (from ready_pickup template)
    // =========================================================================
    
    if (action === 'GOT IT' || action === 'GOT_IT') {
      // Treat as pickup confirmation
      if (pendingPickup) {
        await updateDropStatus(pendingPickup.id, 'Collected')
        await sendPickupConfirmedThanks(from)
        await updateMemberState(memberId, 'idle')
        console.log(`✅ Pickup confirmed via "Got It" for bag ${pendingPickup.fields['Bag Number']}`)
      } else {
        await sendMainMenu(from, firstName)
        await updateMemberState(memberId, 'main_menu')
      }
      return NextResponse.json({ success: true })
    }

    // =========================================================================
    // DEFAULT: Show main menu
    // =========================================================================
    
    console.log(`⚠️ Unhandled action: "${action}" in state "${state}" - showing main menu`)
    await sendMainMenu(from, firstName)
    await updateMemberState(memberId, 'main_menu')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error.message)
    console.error('   Stack:', error.stack)
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
