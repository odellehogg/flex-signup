// app/api/webhooks/whatsapp/route.js
// Updated to match confirmed Airtable schema - December 2024
// Optimized with parallel calls and proper error handling

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
  getGymByName,
  getPlanByName,
  extractMemberContext,
  createAuditLog,
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
// MAIN WEBHOOK HANDLER
// ============================================================================

export async function POST(request) {
  const startTime = Date.now()
  
  try {
    const formData = await request.formData()
    
    const messageData = {
      from: formData.get('From'),
      body: formData.get('Body')?.trim() || '',
      buttonPayload: formData.get('ButtonPayload') || '',
      numMedia: parseInt(formData.get('NumMedia') || '0'),
      mediaUrl: formData.get('MediaUrl0') || null,
    }

    console.log(`📱 Webhook received in ${Date.now() - startTime}ms`)

    await processMessage(messageData)
    
    console.log(`✅ Total time: ${Date.now() - startTime}ms`)
    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('❌ Webhook error:', error.message)
    return new Response('OK', { status: 200 })
  }
}

// ============================================================================
// MESSAGE PROCESSOR
// ============================================================================

async function processMessage(data) {
  const { from, body, buttonPayload, mediaUrl } = data
  
  const rawAction = buttonPayload || body
  const action = normalizeAction(rawAction)

  console.log(`🔄 Processing: "${rawAction}" → "${action}"`)

  // Get member
  const member = await getMemberByPhone(from)
  
  if (!member) {
    console.log(`❌ Unknown: ${from}`)
    await sendNotAMember(from)
    return
  }

  // Extract context using helper
  const ctx = extractMemberContext(member)
  
  console.log(`👤 ${ctx.firstName} | State: ${ctx.state} | Gym: ${ctx.gymName}`)

  // Route message
  await routeMessage(from, action, rawAction, ctx, mediaUrl)
}

// ============================================================================
// ACTION NORMALIZER
// ============================================================================

function normalizeAction(raw) {
  if (!raw) return ''
  
  const upper = raw.toUpperCase().trim()
  
  const map = {
    // Template button payloads
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
// MESSAGE ROUTER
// ============================================================================

async function routeMessage(from, action, rawAction, ctx, mediaUrl) {
  const { memberId, firstName, gymName, gymRecordId, state, stripeSubId, planName } = ctx

  // Photo handling
  if (mediaUrl && state === 'awaiting_damage_photo') {
    return handleDamagePhoto(from, memberId, mediaUrl, rawAction)
  }

  // Global actions
  if (['MENU', 'HI', 'HELLO', 'START', 'HOME'].includes(action)) {
    return Promise.all([
      updateMemberState(memberId, 'main_menu'),
      sendMainMenu(from, firstName)
    ])
  }

  if (['HELP', '?'].includes(action)) {
    return Promise.all([
      updateMemberState(memberId, 'help_menu'),
      sendHelpMenu(from)
    ])
  }

  if (action === 'HOW_IT_WORKS') {
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendHowItWorks(from)
    ])
  }

  // Pickup confirmation
  if (action === 'CONFIRM_PICKUP') {
    return handlePickupConfirm(from, memberId, firstName)
  }

  if (action === 'NOT_COLLECTED') {
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendMainMenu(from, firstName)
    ])
  }

  // Drop flow
  if (action === 'DROP') {
    return handleStartDrop(from, memberId, gymName)
  }

  // Bag number
  if (/^B?\d{3,4}$/i.test(rawAction)) {
    return handleBagNumber(from, memberId, rawAction, gymName, gymRecordId)
  }

  if (state === 'awaiting_bag_number') {
    return sendInvalidBag(from)
  }

  // State-based routing
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

  // Feedback buttons
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

  // Direct actions
  if (action === 'TRACK_ORDER') {
    return handleTrackOrder(from, memberId, gymName)
  }

  if (action === 'MANAGE_SUB') {
    return handleManageSub(from, memberId, ctx)
  }

  if (action === 'CHECK_DROPS') {
    return handleCheckDrops(from, memberId, ctx)
  }

  // Default
  console.log(`⚠️ Unhandled: "${action}" in state "${state}"`)
  return Promise.all([
    updateMemberState(memberId, 'main_menu'),
    sendMainMenu(from, firstName)
  ])
}

// ============================================================================
// HANDLERS
// ============================================================================

async function handlePickupConfirm(from, memberId, firstName) {
  const pendingPickup = await getDropAwaitingPickupConfirm(memberId)
  
  if (pendingPickup) {
    console.log(`✅ Confirming pickup: ${pendingPickup.fields['Bag Number']}`)
    return Promise.all([
      updateDropStatus(pendingPickup.id, 'Collected'),
      updateMemberState(memberId, 'idle'),
      sendPickupConfirmedThanks(from),
      createAuditLog('Status Changed', 'WhatsApp', 'Drop', pendingPickup.id, 'Collected')
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
    return sendPickupBlocked(from, pendingPickup.fields['Bag Number'], gymName)
  }
  
  return Promise.all([
    updateMemberState(memberId, 'awaiting_bag_number'),
    sendDropGuide(from, gymName)
  ])
}

async function handleBagNumber(from, memberId, rawAction, gymName, gymRecordId) {
  const pendingPickup = await getDropAwaitingPickupConfirm(memberId)
  
  if (pendingPickup) {
    return sendPickupBlocked(from, pendingPickup.fields['Bag Number'], gymName)
  }
  
  // Normalize bag number
  let bagNumber = rawAction.toUpperCase()
  if (!bagNumber.startsWith('B')) {
    bagNumber = 'B' + bagNumber.padStart(3, '0')
  }
  
  console.log(`📦 Creating drop: ${bagNumber} at ${gymName}`)
  
  try {
    const [drop] = await Promise.all([
      createDrop(memberId, bagNumber, gymRecordId),
      updateMemberState(memberId, 'idle')
    ])
    
    // Calculate expected date (48 hours)
    const expectedDate = new Date()
    expectedDate.setHours(expectedDate.getHours() + 48)
    const formatted = expectedDate.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    })
    
    console.log(`✅ Drop created: ${drop?.id}`)
    await sendBagConfirmed(from, bagNumber, gymName, formatted)
    
    // Audit log
    await createAuditLog('Drop Created', 'WhatsApp', 'Drop', drop?.id || 'unknown', bagNumber)
    
  } catch (error) {
    console.error(`❌ Drop error: ${error.message}`)
    await updateMemberState(memberId, 'idle')
  }
}

async function handleMainMenu(from, action, ctx) {
  const { memberId, firstName } = ctx
  
  switch (action) {
    case '1':
    case 'CHECK_DROPS':
      return handleCheckDrops(from, memberId, ctx)
    case '2':
    case 'TRACK_ORDER':
      return handleTrackOrder(from, memberId, ctx.gymName)
    case '3':
    case 'MANAGE_SUB':
      return handleManageSub(from, memberId, ctx)
    case '4':
    case 'MY_ACCOUNT':
      return handleMyAccount(from, memberId, ctx)
    case '5':
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
  const { planName, signupDate, dropsAllowed } = ctx
  
  const dropsUsed = await getMemberDropsThisMonth(memberId)
  const remaining = Math.max(0, dropsAllowed - dropsUsed)
  const renewDate = getNextBillingDate(signupDate)
  
  return Promise.all([
    updateMemberState(memberId, 'idle'),
    sendCheckDrops(from, planName, dropsUsed, dropsAllowed, remaining, renewDate)
  ])
}

async function handleTrackOrder(from, memberId, gymName) {
  const activeDrop = await getActiveDropByMember(memberId)
  
  await updateMemberState(memberId, 'idle')
  
  if (activeDrop) {
    return sendTrackActive(
      from,
      activeDrop.fields['Bag Number'],
      activeDrop.fields['Status'],
      gymName,
      activeDrop.fields['Ready Date'] || 'within 48 hours'
    )
  }
  
  return sendTrackNone(from)
}

async function handleManageSub(from, memberId, ctx) {
  const { planName, signupDate } = ctx
  const nextBilling = getNextBillingDate(signupDate)
  
  // Get price from plan name
  const plan = await getPlanByName(planName)
  const price = plan?.price || (planName === 'Unlimited' ? 48 : planName === 'Essential' ? 30 : 5)
  
  return Promise.all([
    updateMemberState(memberId, 'subscription_menu'),
    sendManageSub(from, planName, price, nextBilling)
  ])
}

async function handleMyAccount(from, memberId, ctx) {
  const { firstName, email, gymName, planName, signupDate, dropsAllowed } = ctx
  
  const dropsUsed = await getMemberDropsThisMonth(memberId)
  const remaining = Math.max(0, dropsAllowed - dropsUsed)
  const nextBilling = getNextBillingDate(signupDate)
  
  return Promise.all([
    updateMemberState(memberId, 'idle'),
    sendMyAccount(from, firstName, email, gymName, planName, remaining, dropsAllowed, nextBilling)
  ])
}

async function handleSubscriptionMenu(from, action, ctx) {
  const { memberId, firstName, gymName, planName, stripeSubId } = ctx
  
  switch (action) {
    case '1':
    case 'PAUSE_SUB':
      return Promise.all([
        updateMemberState(memberId, 'pause_menu'),
        sendPauseMenu(from)
      ])
    
    case '2':
    case 'RESUME_SUB':
      if (stripeSubId) await resumeSubscription(stripeSubId)
      return Promise.all([
        updateMemberState(memberId, 'idle'),
        sendResumeConfirmed(from)
      ])
    
    case '3':
    case 'CANCEL_SUB':
      return Promise.all([
        updateMemberState(memberId, 'cancel_reason'),
        sendCancelReason(from)
      ])
    
    case '4':
    case 'CHANGE_GYM':
      const gyms = await getGyms()
      const gymList = gyms.filter(g => g.name !== gymName).map(g => g.name)
      return Promise.all([
        updateMemberState(memberId, 'change_gym'),
        sendChangeGymMenu(from, gymName, gymList)
      ])
    
    case '5':
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
  
  return Promise.all([
    updateMemberState(memberId, 'cancel_retention'),
    sendCancelRetention(from)
  ])
}

async function handleCancelRetention(from, action, ctx) {
  const { memberId, firstName, stripeSubId, signupDate, dropsAllowed } = ctx
  
  if (action === 'ACCEPT_OFFER' || action === '1') {
    if (stripeSubId) await applyDiscount(stripeSubId, 20, 2)
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendDiscountApplied(from)
    ])
  }
  
  if (action === 'CONFIRM_CANCEL' || action === '2') {
    if (stripeSubId) await cancelSubscription(stripeSubId)
    const dropsUsed = await getMemberDropsThisMonth(ctx.memberId)
    const remaining = Math.max(0, dropsAllowed - dropsUsed)
    const endDate = getNextBillingDate(signupDate)
    return Promise.all([
      updateMemberState(memberId, 'idle'),
      sendCancelConfirmed(from, remaining, endDate)
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
      updateMember(memberId, { 'Gym': [selectedGym.id] }),
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
      return updateMemberState(memberId, 'idle')
    
    case '7':
      return Promise.all([
        updateMemberState(memberId, 'select_issue_type'),
        sendIssueTypeMenu(from)
      ])
    
    case '8':
      const plan = await getPlanByName(planName)
      const price = plan?.price || 30
      const nextBilling = getNextBillingDate(signupDate)
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
