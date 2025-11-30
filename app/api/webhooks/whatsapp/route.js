// app/api/webhooks/whatsapp/route.js
// OPTIMIZED: Immediate response + background processing + parallel calls
// Version: 2.0

export const runtime = 'edge'

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
  getGymName, // NEW: Helper to resolve gym name from linked record
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

// ============================================================================
// MAIN WEBHOOK HANDLER - Responds immediately, processes in background
// ============================================================================

export async function POST(request) {
  const startTime = Date.now()
  
  try {
    // Parse form data
    const formData = await request.formData()
    
    const messageData = {
      from: formData.get('From'),
      body: formData.get('Body')?.trim() || '',
      buttonPayload: formData.get('ButtonPayload') || '',
      numMedia: parseInt(formData.get('NumMedia') || '0'),
      mediaUrl: formData.get('MediaUrl0') || null,
      mediaType: formData.get('MediaContentType0') || null,
    }

    console.log(`📱 Webhook received in ${Date.now() - startTime}ms`)

    // =========================================================================
    // OPTION 1: Use waitUntil (Vercel Edge/Serverless)
    // This lets us return immediately while processing continues
    // =========================================================================
    
    // If using Vercel with waitUntil support:
    // const { waitUntil } = await import('@vercel/functions')
    // waitUntil(processMessage(messageData))
    // return new Response('OK', { status: 200 })

    // =========================================================================
    // OPTION 2: Fire-and-forget with catch (works everywhere)
    // Slight risk: if function terminates early, message may not send
    // =========================================================================
    
    // Process synchronously but optimized
    await processMessage(messageData)
    
    console.log(`✅ Total webhook time: ${Date.now() - startTime}ms`)
    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('❌ Webhook error:', error.message)
    // Always return 200 to prevent Twilio retries
    return new Response('OK', { status: 200 })
  }
}

// ============================================================================
// MESSAGE PROCESSOR - All the business logic
// ============================================================================

async function processMessage(data) {
  const { from, body, buttonPayload, numMedia, mediaUrl } = data
  const processStart = Date.now()

  // Normalize action
  const rawAction = buttonPayload || body
  const action = normalizeAction(rawAction)

  console.log(`🔄 Processing: "${rawAction}" → "${action}"`)

  // =========================================================================
  // STEP 1: Get member (required for everything)
  // =========================================================================
  
  const member = await getMemberByPhone(from)
  
  if (!member) {
    console.log(`❌ Unknown: ${from}`)
    await sendNotAMember(from)
    return
  }

  // Extract member data once
  const ctx = extractMemberContext(member)
  
  console.log(`👤 ${ctx.firstName} | State: ${ctx.state} | ${Date.now() - processStart}ms`)

  // =========================================================================
  // STEP 2: Route to handler (optimized routing)
  // =========================================================================
  
  await routeMessage(from, action, rawAction, ctx, mediaUrl)
}

// ============================================================================
// CONTEXT EXTRACTION - Get all member data in one place
// ============================================================================

function extractMemberContext(member) {
  const fields = member.fields
  
  // Handle gym field (might be linked record or text)
  let gymName = 'your gym'
  const gymField = fields['Gym']
  if (gymField) {
    if (Array.isArray(gymField)) {
      // It's a linked record - we'll need to resolve it
      // For now, check if there's a lookup field
      gymName = fields['Gym Name'] || fields['Gym (from Gyms)'] || 'your gym'
    } else {
      gymName = gymField
    }
  }

  return {
    memberId: member.id,
    firstName: fields['First Name'] || 'there',
    gymName,
    gymRecordId: Array.isArray(fields['Gym']) ? fields['Gym'][0] : null,
    planName: fields['Subscription Tier'] || 'Essential',
    email: fields['Email'] || '',
    state: fields['Conversation State'] || 'idle',
    stripeSubId: fields['Stripe Subscription ID'],
    signupDate: fields['Signup Date'],
    referralCode: fields['Referral Code'] || 'FLEX10',
    pendingIssueType: fields['Pending Issue Type'],
  }
}

// ============================================================================
// ACTION NORMALIZER - Map button text to action codes
// ============================================================================

function normalizeAction(raw) {
  if (!raw) return ''
  
  const upper = raw.toUpperCase().trim()
  
  // Direct mappings from template button payloads
  const map = {
    // Template payloads → normalized actions
    'HOW_WORKS': 'HOW_IT_WORKS',
    'HOW IT WORKS': 'HOW_IT_WORKS',
    'TRACK': 'TRACK_ORDER',
    'TRACK ORDER': 'TRACK_ORDER',
    'MAIN MENU': 'MENU',
    'BACK TO MENU': 'MENU',
    'BACK': 'MENU',
    'START A DROP': 'DROP',
    'START DROP': 'DROP',
    'GOT IT': 'CONFIRM_PICKUP',
    'YES, COLLECTED': 'CONFIRM_PICKUP',
    'YES COLLECTED': 'CONFIRM_PICKUP',
    'NOT YET': 'NOT_COLLECTED',
    'NEED HELP': 'HELP',
    '😊 GREAT': 'FEEDBACK_GREAT',
    'GREAT': 'FEEDBACK_GREAT',
    '😐 OK': 'FEEDBACK_OK',
    '😞 NOT GOOD': 'FEEDBACK_BAD',
    'NOT GOOD': 'FEEDBACK_BAD',
    'ACCEPT OFFER': 'ACCEPT_OFFER',
    'KEEP MY DISCOUNT': 'ACCEPT_OFFER',
    'CANCEL ANYWAY': 'CONFIRM_CANCEL',
    'NEVER MIND': 'MENU',
    'EXTEND PAUSE': 'PAUSE_SUB',
    'KEEP CURRENT': 'MENU',
    'NOT NOW': 'MENU',
    'MANAGE SUB': 'MANAGE_SUB',
    'MANAGE SUBSCRIPTION': 'MANAGE_SUB',
  }
  
  return map[upper] || upper
}

// ============================================================================
// MESSAGE ROUTER - Optimized routing with early returns
// ============================================================================

async function routeMessage(from, action, rawAction, ctx, mediaUrl) {
  const { memberId, firstName, gymName, state, stripeSubId, planName } = ctx

  // =========================================================================
  // PHOTO HANDLING (check first, before anything else)
  // =========================================================================
  
  if (mediaUrl && state === 'awaiting_damage_photo') {
    return handleDamagePhoto(from, memberId, mediaUrl, rawAction)
  }

  // =========================================================================
  // GLOBAL ACTIONS (work from any state)
  // =========================================================================
  
  // Menu/Home
  if (['MENU', 'HI', 'HELLO', 'START', 'HOME'].includes(action)) {
    return Promise.all([
      updateMemberState(memberId, 'main_menu'),
      sendMainMenu(from, firstName)
    ])
  }

  // Help
  if (['HELP', '?'].includes(action)) {
    return Promise.all([
      updateMemberState(memberId, 'help_menu'),
      sendHelpMenu(from)
    ])
  }

  // How It Works
  if (action === 'HOW_IT_WORKS') {
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendHowItWorks(from)
    ])
  }

  // =========================================================================
  // PICKUP CONFIRMATION (abuse prevention gate)
  // =========================================================================
  
  if (action === 'CONFIRM_PICKUP') {
    return handlePickupConfirm(from, memberId, firstName)
  }

  if (action === 'NOT_COLLECTED') {
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendMainMenu(from, firstName)
    ])
  }

  // =========================================================================
  // DROP FLOW
  // =========================================================================
  
  if (action === 'DROP') {
    return handleStartDrop(from, memberId, gymName)
  }

  // Bag number submitted
  if (/^B?\d{3,4}$/i.test(rawAction)) {
    return handleBagNumber(from, memberId, rawAction, gymName)
  }

  // Invalid bag number while awaiting
  if (state === 'awaiting_bag_number') {
    return sendInvalidBag(from)
  }

  // =========================================================================
  // STATE-BASED ROUTING
  // =========================================================================
  
  switch (state) {
    case 'main_menu':
      return handleMainMenu(from, action, ctx)
    
    case 'subscription_menu':
      return handleSubscriptionMenu(from, action, ctx)
    
    case 'pause_menu':
      return handlePauseMenu(from, action, ctx)
    
    case 'cancel_reason':
      return handleCancelReason(from, action, ctx)
    
    case 'cancel_retention':
      return handleCancelRetention(from, action, ctx)
    
    case 'change_gym':
      return handleChangeGym(from, action, ctx)
    
    case 'change_plan':
      return handleChangePlan(from, action, ctx)
    
    case 'help_menu':
      return handleHelpMenu(from, action, ctx)
    
    case 'select_issue_type':
      return handleIssueType(from, action, ctx)
    
    case 'awaiting_issue':
      return handleIssueDescription(from, rawAction, ctx)
    
    case 'awaiting_feedback':
      return handleFeedbackDescription(from, rawAction, ctx)
  }

  // =========================================================================
  // FEEDBACK BUTTONS (can come from any state after pickup)
  // =========================================================================
  
  if (action === 'FEEDBACK_GREAT') {
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendFeedbackGreat(from, ctx.referralCode)
    ])
  }

  if (action === 'FEEDBACK_OK') {
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendMainMenu(from, firstName)
    ])
  }

  if (action === 'FEEDBACK_BAD') {
    return Promise.all([
      updateMemberState(memberId, 'awaiting_feedback'),
      sendFeedbackBad(from)
    ])
  }

  // =========================================================================
  // DIRECT ACTIONS (can come from buttons regardless of state)
  // =========================================================================
  
  if (action === 'TRACK_ORDER') {
    return handleTrackOrder(from, memberId, gymName)
  }

  if (action === 'MANAGE_SUB') {
    return handleManageSub(from, memberId, ctx)
  }

  if (action === 'CHECK_DROPS') {
    return handleCheckDrops(from, memberId, ctx)
  }

  // =========================================================================
  // DEFAULT: Show main menu
  // =========================================================================
  
  console.log(`⚠️ Unhandled: "${action}" in state "${state}"`)
  return Promise.all([
    updateMemberState(memberId, 'main_menu'),
    sendMainMenu(from, firstName)
  ])
}

// ============================================================================
// HANDLERS - Each handler is optimized with parallel calls where possible
// ============================================================================

async function handlePickupConfirm(from, memberId, firstName) {
  const pendingPickup = await getDropAwaitingPickupConfirm(memberId)
  
  if (pendingPickup) {
    console.log(`✅ Confirming pickup: ${pendingPickup.fields['Bag Number']}`)
    return Promise.all([
      updateDropStatus(pendingPickup.id, 'Collected'),
      updateMemberState(memberId, 'idle'),
      sendPickupConfirmedThanks(from)
    ])
  }
  
  return Promise.all([
    updateMemberState(memberId, 'main_menu'),
    sendMainMenu(from, firstName)
  ])
}

async function handleStartDrop(from, memberId, gymName) {
  const pendingPickup = await getDropAwaitingPickupConfirm(memberId)
  
  if (pendingPickup) {
    const bagNumber = pendingPickup.fields['Bag Number']
    return sendPickupBlocked(from, bagNumber, gymName)
  }
  
  return Promise.all([
    updateMemberState(memberId, 'awaiting_bag_number'),
    sendDropGuide(from, gymName)
  ])
}

async function handleBagNumber(from, memberId, rawAction, gymName) {
  // Check for pending pickup first
  const pendingPickup = await getDropAwaitingPickupConfirm(memberId)
  
  if (pendingPickup) {
    return sendPickupBlocked(from, pendingPickup.fields['Bag Number'], gymName)
  }
  
  // Normalize bag number
  let bagNumber = rawAction.toUpperCase()
  if (!bagNumber.startsWith('B')) {
    bagNumber = 'B' + bagNumber.padStart(3, '0')
  }
  
  console.log(`📦 Creating drop: ${bagNumber}`)
  
  try {
    // Create drop and update state in parallel
    const [drop] = await Promise.all([
      createDrop(memberId, bagNumber, gymName),
      updateMemberState(memberId, 'idle')
    ])
    
    // Calculate expected date
    const expectedDate = new Date()
    expectedDate.setHours(expectedDate.getHours() + 48)
    const formatted = expectedDate.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    })
    
    console.log(`✅ Drop created: ${drop?.id}`)
    await sendBagConfirmed(from, bagNumber, gymName, formatted)
    
  } catch (error) {
    console.error(`❌ Drop error: ${error.message}`)
    // Still mark as idle to prevent stuck state
    await updateMemberState(memberId, 'idle')
  }
}

async function handleMainMenu(from, action, ctx) {
  const { memberId, firstName, gymName, planName } = ctx
  
  switch (action) {
    case '1': // Check drops
    case 'CHECK_DROPS':
      return handleCheckDrops(from, memberId, ctx)
    
    case '2': // Track order
    case 'TRACK_ORDER':
      return handleTrackOrder(from, memberId, gymName)
    
    case '3': // Manage subscription
    case 'MANAGE_SUB':
      return handleManageSub(from, memberId, ctx)
    
    case '4': // My account
    case 'MY_ACCOUNT':
      return handleMyAccount(from, memberId, ctx)
    
    case '5': // Help
    case 'HELP':
      return Promise.all([
        updateMemberState(memberId, 'help_menu'),
        sendHelpMenu(from)
      ])
    
    default:
      return sendMainMenu(from, firstName)
  }
}

async function handleCheckDrops(from, memberId, ctx) {
  const { planName, signupDate } = ctx
  
  const dropsUsed = await getMemberDropsThisMonth(memberId)
  const totalDrops = planName === 'Unlimited' ? 16 : (planName === 'Essential' ? 10 : 1)
  const remaining = Math.max(0, totalDrops - dropsUsed)
  const renewDate = getNextBillingDate(signupDate)
  
  return Promise.all([
    updateMemberState(memberId, 'idle'),
    sendCheckDrops(from, planName, dropsUsed, totalDrops, remaining, renewDate)
  ])
}

async function handleTrackOrder(from, memberId, gymName) {
  const activeDrop = await getActiveDropByMember(memberId)
  
  await updateMemberState(memberId, 'idle')
  
  if (activeDrop) {
    const bagNumber = activeDrop.fields['Bag Number']
    const status = activeDrop.fields['Status']
    const expectedDate = activeDrop.fields['Ready Date'] || 'within 48 hours'
    return sendTrackActive(from, bagNumber, status, gymName, expectedDate)
  }
  
  return sendTrackNone(from)
}

async function handleManageSub(from, memberId, ctx) {
  const { planName, signupDate } = ctx
  const nextBilling = getNextBillingDate(signupDate)
  const price = planName === 'Unlimited' ? 48 : (planName === 'Essential' ? 30 : 5)
  
  return Promise.all([
    updateMemberState(memberId, 'subscription_menu'),
    sendManageSub(from, planName, price, nextBilling)
  ])
}

async function handleMyAccount(from, memberId, ctx) {
  const { firstName, email, gymName, planName, signupDate } = ctx
  
  const dropsUsed = await getMemberDropsThisMonth(memberId)
  const totalDrops = planName === 'Unlimited' ? 16 : (planName === 'Essential' ? 10 : 1)
  const remaining = Math.max(0, totalDrops - dropsUsed)
  const nextBilling = getNextBillingDate(signupDate)
  
  return Promise.all([
    updateMemberState(memberId, 'idle'),
    sendMyAccount(from, firstName, email, gymName, planName, remaining, totalDrops, nextBilling)
  ])
}

async function handleSubscriptionMenu(from, action, ctx) {
  const { memberId, firstName, gymName, planName, stripeSubId } = ctx
  
  switch (action) {
    case '1': // Pause
    case 'PAUSE_SUB':
      return Promise.all([
        updateMemberState(memberId, 'pause_menu'),
        sendPauseMenu(from)
      ])
    
    case '2': // Resume
    case 'RESUME_SUB':
      if (stripeSubId) {
        await resumeSubscription(stripeSubId)
      }
      return Promise.all([
        updateMemberState(memberId, 'idle'),
        sendResumeConfirmed(from)
      ])
    
    case '3': // Cancel
    case 'CANCEL_SUB':
      return Promise.all([
        updateMemberState(memberId, 'cancel_reason'),
        sendCancelReason(from)
      ])
    
    case '4': // Change gym
    case 'CHANGE_GYM':
      const gyms = await getGyms()
      const gymList = gyms.filter(g => g.name !== gymName).map(g => g.name)
      return Promise.all([
        updateMemberState(memberId, 'change_gym'),
        sendChangeGymMenu(from, gymName, gymList)
      ])
    
    case '5': // Change plan
    case 'CHANGE_PLAN':
      return Promise.all([
        updateMemberState(memberId, 'change_plan'),
        sendChangePlanMenu(from, planName)
      ])
    
    default:
      return sendMainMenu(from, firstName)
  }
}

async function handlePauseMenu(from, action, ctx) {
  const { memberId, firstName, stripeSubId } = ctx
  
  let days = 0
  if (action === '1') days = 14
  if (action === '2') days = 30
  
  if (days > 0 && stripeSubId) {
    const resumeDate = new Date()
    resumeDate.setDate(resumeDate.getDate() + days)
    const formatted = resumeDate.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
    
    await pauseSubscription(stripeSubId, days)
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendPauseConfirmed(from, formatted)
    ])
  }
  
  // Cancel or invalid - back to menu
  return Promise.all([
    updateMemberState(memberId, 'main_menu'),
    sendMainMenu(from, firstName)
  ])
}

async function handleCancelReason(from, action, ctx) {
  const { memberId, firstName } = ctx
  
  if (action === 'MENU') {
    return Promise.all([
      updateMemberState(memberId, 'main_menu'),
      sendMainMenu(from, firstName)
    ])
  }
  
  // Any reason triggers retention
  return Promise.all([
    updateMemberState(memberId, 'cancel_retention'),
    sendCancelRetention(from)
  ])
}

async function handleCancelRetention(from, action, ctx) {
  const { memberId, firstName, stripeSubId, signupDate } = ctx
  
  if (action === 'ACCEPT_OFFER' || action === '1') {
    if (stripeSubId) {
      await applyDiscount(stripeSubId, 20, 2)
    }
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendDiscountApplied(from)
    ])
  }
  
  if (action === 'CONFIRM_CANCEL' || action === '2') {
    if (stripeSubId) {
      await cancelSubscription(stripeSubId)
    }
    const dropsRemaining = await getMemberDropsThisMonth(ctx.memberId)
    const endDate = getNextBillingDate(signupDate)
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendCancelConfirmed(from, dropsRemaining, endDate)
    ])
  }
  
  return Promise.all([
    updateMemberState(memberId, 'main_menu'),
    sendMainMenu(from, firstName)
  ])
}

async function handleChangeGym(from, action, ctx) {
  const { memberId, firstName, gymName } = ctx
  
  if (action === 'MENU' || action === 'CANCEL') {
    return Promise.all([
      updateMemberState(memberId, 'main_menu'),
      sendMainMenu(from, firstName)
    ])
  }
  
  const gyms = await getGyms()
  const gymList = gyms.filter(g => g.name !== gymName)
  
  let selectedGym = null
  const numChoice = parseInt(action)
  
  if (!isNaN(numChoice) && numChoice >= 1 && numChoice <= gymList.length) {
    selectedGym = gymList[numChoice - 1]
  } else {
    selectedGym = gyms.find(g => g.name.toUpperCase() === action)
  }
  
  if (selectedGym) {
    console.log(`🏋️ Gym → ${selectedGym.name}`)
    return Promise.all([
      updateMember(memberId, { 'Gym': selectedGym.name }),
      updateMemberState(memberId, 'idle'),
      sendGymChanged(from, selectedGym.name)
    ])
  }
  
  return sendChangeGymMenu(from, gymName, gymList.map(g => g.name))
}

async function handleChangePlan(from, action, ctx) {
  const { memberId, firstName, planName, stripeSubId } = ctx
  
  if (action === 'MENU' || action === 'CANCEL') {
    return Promise.all([
      updateMemberState(memberId, 'main_menu'),
      sendMainMenu(from, firstName)
    ])
  }
  
  if (action === '1' || action === 'ESSENTIAL') {
    if (planName !== 'Essential' && stripeSubId) {
      await changeSubscriptionPlan(stripeSubId, 'essential')
      await updateMember(memberId, { 'Subscription Tier': 'Essential' })
      return Promise.all([
        updateMemberState(memberId, 'idle'),
        sendPlanChanged(from, 'Essential', 30, 10)
      ])
    }
  }
  
  if (action === '2' || action === 'UNLIMITED') {
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendPlanChanged(from, 'Unlimited', 0, 0, true)
    ])
  }
  
  return Promise.all([
    updateMemberState(memberId, 'main_menu'),
    sendMainMenu(from, firstName)
  ])
}

async function handleHelpMenu(from, action, ctx) {
  const { memberId, firstName, planName, signupDate } = ctx
  
  switch (action) {
    case '1': case '2': case '3': case '4': case '5': case '6': case '9':
      // Informational - template handles content
      return updateMemberState(memberId, 'idle')
    
    case '7': // Report issue
      return Promise.all([
        updateMemberState(memberId, 'select_issue_type'),
        sendIssueTypeMenu(from)
      ])
    
    case '8': // Billing
      const nextBilling = getNextBillingDate(signupDate)
      const price = planName === 'Unlimited' ? 48 : (planName === 'Essential' ? 30 : 5)
      return Promise.all([
        updateMemberState(memberId, 'idle'),
        sendBillingHelp(from, planName, price, nextBilling)
      ])
    
    default:
      if (action === 'MENU') {
        return Promise.all([
          updateMemberState(memberId, 'main_menu'),
          sendMainMenu(from, firstName)
        ])
      }
      return sendHelpMenu(from)
  }
}

async function handleIssueType(from, action, ctx) {
  const { memberId, firstName } = ctx
  
  if (action === 'MENU' || action === 'CANCEL') {
    return Promise.all([
      updateMemberState(memberId, 'main_menu'),
      sendMainMenu(from, firstName)
    ])
  }
  
  const issueTypes = {
    '1': 'Late Delivery',
    '2': 'Missing Bag',
    '3': 'Wrong Items',
    '5': 'Other'
  }
  
  if (action === '4') {
    // Damage - request photo
    return Promise.all([
      updateMemberState(memberId, 'awaiting_damage_photo'),
      sendDamagePhotoRequest(from)
    ])
  }
  
  const issueType = issueTypes[action]
  if (issueType) {
    return Promise.all([
      updateMember(memberId, { 'Pending Issue Type': issueType }),
      updateMemberState(memberId, 'awaiting_issue')
    ])
    // TODO: Send "please describe" prompt
  }
  
  return sendIssueTypeMenu(from)
}

async function handleIssueDescription(from, description, ctx) {
  const { memberId, pendingIssueType } = ctx
  
  const issue = await createIssue(memberId, pendingIssueType || 'Other', description)
  
  return Promise.all([
    updateMember(memberId, { 'Pending Issue Type': '' }),
    updateMemberState(memberId, 'idle'),
    sendIssueReported(from, issue.fields['Ticket ID'])
  ])
}

async function handleFeedbackDescription(from, description, ctx) {
  const { memberId } = ctx
  
  const issue = await createIssue(memberId, 'Feedback', description)
  
  return Promise.all([
    updateMemberState(memberId, 'idle'),
    sendIssueReported(from, issue.fields['Ticket ID'])
  ])
}

async function handleDamagePhoto(from, memberId, mediaUrl, description) {
  const issue = await createIssue(
    memberId,
    'Damage Claim',
    `Photo: ${mediaUrl}\n\nDescription: ${description || 'No description'}`,
    mediaUrl
  )
  
  console.log(`📸 Damage claim: ${issue.fields['Ticket ID']}`)
  
  return Promise.all([
    updateMemberState(memberId, 'idle'),
    sendDamageReceived(from, issue.fields['Ticket ID'])
  ])
}

// ============================================================================
// UTILITIES
// ============================================================================

function getNextBillingDate(signupDate) {
  if (!signupDate) return 'your next billing date'
  
  const signup = new Date(signupDate)
  const now = new Date()
  const dayOfMonth = signup.getDate()
  
  let billing = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
  if (billing <= now) {
    billing.setMonth(billing.getMonth() + 1)
  }
  
  return billing.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
