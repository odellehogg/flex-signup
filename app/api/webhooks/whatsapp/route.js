// app/api/webhooks/whatsapp/route.js
// FLEX WhatsApp MVP - Clean State Machine
// Handles all user interactions with minimal states

import { NextResponse } from 'next/server'
import {
  getMemberByPhone,
  updateMemberState,
  createDrop,
  getActiveDropsByMember,
  updateDrop,
  extractMemberContext,
} from '@/lib/airtable'
import {
  sendMainMenu,
  sendDropGuide,
  sendBagConfirmed,
  sendTrackSingle,
  sendTrackMultiple,
  sendTrackNone,
  sendAccountInfo,
  sendHelpMenu,
  sendSupportPhotoAsk,
  sendSupportConfirmed,
  sendInvalidBag,
  sendNotAMember,
  sendExtendedTime,
  sendExtensionDenied,
  sendError,
  sendPlainText,
} from '@/lib/whatsapp'
import { createSupportTicket, addPhotoToTicket } from '@/lib/support'

// ============================================================================
// CONVERSATION STATES (Only 5!)
// ============================================================================

const STATES = {
  IDLE: 'idle',                        // Default - show main menu
  AWAITING_BAG: 'awaiting_bag',        // Expecting bag number
  AWAITING_SUPPORT_DESC: 'awaiting_support_desc',  // Expecting issue description
  AWAITING_SUPPORT_PHOTO: 'awaiting_support_photo', // Expecting photo (optional)
  AWAITING_PICKUP_CONFIRM: 'awaiting_pickup_confirm', // Asked if they picked up
}

// ============================================================================
// COMMAND PATTERNS
// ============================================================================

const COMMANDS = {
  // Main menu triggers
  MENU: /^(menu|home|start|hi|hello|hey)$/i,
  
  // Drop flow
  DROP: /^(drop|1|start drop|make drop)$/i,
  
  // Track flow  
  TRACK: /^(track|2|status|where|my bag)$/i,
  REFRESH: /^(refresh|again|update)$/i,
  
  // Account
  ACCOUNT: /^(account|3|my account|profile|plan)$/i,
  
  // Help flow
  HELP: /^(help|4|support|issue|problem)$/i,
  DAMAGED: /^(damaged|1|damage|broken|ripped|torn)$/i,
  MISSING: /^(missing|2|lost|gone|cant find)$/i,
  BILLING: /^(billing|3|payment|charge|refund)$/i,
  OTHER: /^(other|4|something else)$/i,
  SKIP: /^(skip|no photo|none)$/i,
  
  // How it works
  HOW: /^(how|how it works|explain)$/i,
  
  // Ready for pickup responses
  OMW: /^(omw|on my way|coming|1|yes|collected|got it)$/i,
  MORE_TIME: /^(more|more time|2|extend|later|not yet)$/i,
  
  // Bag number pattern (B042, 042, 42, etc.)
  BAG_NUMBER: /^[Bb]?0*(\d{1,4})$/,
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

export async function POST(request) {
  const startTime = Date.now()
  
  try {
    // Parse Twilio webhook
    const formData = await request.formData()
    const from = formData.get('From')
    const body = (formData.get('Body') || '').trim()
    const numMedia = parseInt(formData.get('NumMedia') || '0')
    const mediaUrl = formData.get('MediaUrl0') // First media attachment
    const buttonPayload = formData.get('ButtonPayload') // For template buttons

    console.log(`📱 WhatsApp from ${from}: "${body}" (media: ${numMedia})`)

    // Get member
    const member = await getMemberByPhone(from)
    
    if (!member) {
      await sendNotAMember(from)
      return respond()
    }

    const ctx = extractMemberContext(member)
    const input = buttonPayload || body
    const state = ctx.state || STATES.IDLE

    console.log(`👤 ${ctx.firstName} | State: ${state} | Input: "${input}"`)

    // Route to handler based on state
    await handleMessage(from, ctx, input, state, mediaUrl)

    const elapsed = Date.now() - startTime
    console.log(`⚡ Response time: ${elapsed}ms`)

    return respond()

  } catch (error) {
    console.error('❌ Webhook error:', error)
    
    // Try to send error message
    try {
      const formData = await request.formData()
      const from = formData.get('From')
      if (from) await sendError(from)
    } catch (e) {
      // Ignore
    }
    
    return respond()
  }
}

// ============================================================================
// MESSAGE ROUTER
// ============================================================================

async function handleMessage(phone, ctx, input, state, mediaUrl) {
  const { memberId, firstName, gymName } = ctx

  // -------------------------------------------------------------------------
  // STATE: Awaiting Bag Number
  // -------------------------------------------------------------------------
  if (state === STATES.AWAITING_BAG) {
    // Check for menu escape
    if (COMMANDS.MENU.test(input)) {
      await updateMemberState(memberId, STATES.IDLE)
      return sendMainMenu(phone, firstName)
    }
    
    // Try to parse bag number
    const bagMatch = input.match(COMMANDS.BAG_NUMBER)
    if (bagMatch) {
      const bagNum = bagMatch[1].padStart(3, '0')
      const bagNumber = `B${bagNum}`
      
      // Create drop in Airtable
      await createDrop(memberId, bagNumber, ctx.gymRecordId)
      
      // Calculate expected date (48 hours)
      const expected = new Date()
      expected.setHours(expected.getHours() + 48)
      const expectedDate = expected.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
      
      await updateMemberState(memberId, STATES.IDLE)
      return sendBagConfirmed(phone, bagNumber, gymName, expectedDate)
    }
    
    // Invalid bag number
    return sendInvalidBag(phone)
  }

  // -------------------------------------------------------------------------
  // STATE: Awaiting Support Description
  // -------------------------------------------------------------------------
  if (state === STATES.AWAITING_SUPPORT_DESC) {
    // Check for menu escape
    if (COMMANDS.MENU.test(input)) {
      await updateMemberState(memberId, STATES.IDLE)
      return sendMainMenu(phone, firstName)
    }
    
    // Store description and ask for photo
    const issueType = ctx.pendingIssueType || 'Other'
    
    // Save description temporarily (we'll use it when creating ticket)
    await updateMember(memberId, { 
      'Pending Issue Description': input,
    })
    
    // For damage/missing, ask for photo. Otherwise create ticket immediately
    if (['Damaged Item', 'Missing Item'].includes(issueType)) {
      await updateMemberState(memberId, STATES.AWAITING_SUPPORT_PHOTO)
      return sendSupportPhotoAsk(phone, issueType)
    }
    
    // Create ticket without photo
    const ticket = await createSupportTicket({
      memberId,
      memberEmail: ctx.email,
      memberName: firstName,
      memberPhone: phone,
      issueType,
      description: input,
    })
    
    await updateMemberState(memberId, STATES.IDLE)
    await updateMember(memberId, { 
      'Pending Issue Type': null,
      'Pending Issue Description': null,
    })
    
    return sendSupportConfirmed(phone, ticket.ticketId, ctx.email)
  }

  // -------------------------------------------------------------------------
  // STATE: Awaiting Support Photo
  // -------------------------------------------------------------------------
  if (state === STATES.AWAITING_SUPPORT_PHOTO) {
    const issueType = ctx.pendingIssueType || 'Other'
    const description = ctx.pendingDescription || 'No description provided'
    
    // Check for skip
    if (COMMANDS.SKIP.test(input) || COMMANDS.MENU.test(input)) {
      // Create ticket without photo
      const ticket = await createSupportTicket({
        memberId,
        memberEmail: ctx.email,
        memberName: firstName,
        memberPhone: phone,
        issueType,
        description,
      })
      
      await updateMemberState(memberId, STATES.IDLE)
      await updateMember(memberId, { 
        'Pending Issue Type': null,
        'Pending Issue Description': null,
      })
      
      return sendSupportConfirmed(phone, ticket.ticketId, ctx.email)
    }
    
    // Check for photo
    if (mediaUrl) {
      // Create ticket with photo
      const ticket = await createSupportTicket({
        memberId,
        memberEmail: ctx.email,
        memberName: firstName,
        memberPhone: phone,
        issueType,
        description,
        photoUrl: mediaUrl,
      })
      
      await updateMemberState(memberId, STATES.IDLE)
      await updateMember(memberId, { 
        'Pending Issue Type': null,
        'Pending Issue Description': null,
      })
      
      return sendSupportConfirmed(phone, ticket.ticketId, ctx.email)
    }
    
    // No photo, treat as additional description
    const updatedDesc = `${description}\n\nAdditional: ${input}`
    
    const ticket = await createSupportTicket({
      memberId,
      memberEmail: ctx.email,
      memberName: firstName,
      memberPhone: phone,
      issueType,
      description: updatedDesc,
    })
    
    await updateMemberState(memberId, STATES.IDLE)
    await updateMember(memberId, { 
      'Pending Issue Type': null,
      'Pending Issue Description': null,
    })
    
    return sendSupportConfirmed(phone, ticket.ticketId, ctx.email)
  }

  // -------------------------------------------------------------------------
  // STATE: IDLE - Main command routing
  // -------------------------------------------------------------------------

  // Drop command
  if (COMMANDS.DROP.test(input)) {
    await updateMemberState(memberId, STATES.AWAITING_BAG)
    return sendDropGuide(phone, gymName)
  }

  // Track command
  if (COMMANDS.TRACK.test(input) || COMMANDS.REFRESH.test(input)) {
    return handleTrack(phone, ctx)
  }

  // Account command
  if (COMMANDS.ACCOUNT.test(input)) {
    return handleAccount(phone, ctx)
  }

  // Help command
  if (COMMANDS.HELP.test(input)) {
    return sendHelpMenu(phone)
  }

  // How it works
  if (COMMANDS.HOW.test(input)) {
    return sendPlainText(phone, 
      `Here's how FLEX works:\n\n` +
      `1️⃣ Drop your sweaty clothes in a FLEX bag at ${gymName} reception\n` +
      `2️⃣ We collect and wash with activewear-safe products\n` +
      `3️⃣ Pick up fresh clothes from reception within 48 hours\n\n` +
      `That's it! No washing, no waiting. 🎉\n\n` +
      `Reply DROP to start, or MENU for options.`
    )
  }

  // Support issue types
  if (COMMANDS.DAMAGED.test(input)) {
    await updateMember(memberId, { 'Pending Issue Type': 'Damaged Item' })
    await updateMemberState(memberId, STATES.AWAITING_SUPPORT_DESC)
    return sendPlainText(phone,
      `Sorry to hear about the damage. 😔\n\n` +
      `Please describe what happened in one message.\n` +
      `For example: "My black Nike leggings have a tear near the waistband"\n\n` +
      `Or reply MENU to go back.`
    )
  }

  if (COMMANDS.MISSING.test(input)) {
    await updateMember(memberId, { 'Pending Issue Type': 'Missing Item' })
    await updateMemberState(memberId, STATES.AWAITING_SUPPORT_DESC)
    return sendPlainText(phone,
      `Oh no! Let's find your missing item. 🔍\n\n` +
      `Please describe what's missing:\n` +
      `- What item(s)?\n` +
      `- Which bag number?\n` +
      `- When did you drop it off?\n\n` +
      `Or reply MENU to go back.`
    )
  }

  if (COMMANDS.BILLING.test(input)) {
    await updateMember(memberId, { 'Pending Issue Type': 'Billing Issue' })
    await updateMemberState(memberId, STATES.AWAITING_SUPPORT_DESC)
    return sendPlainText(phone,
      `Let's sort out your billing question. 💳\n\n` +
      `Please describe the issue:\n` +
      `- Unexpected charge?\n` +
      `- Payment failed?\n` +
      `- Refund request?\n\n` +
      `Or reply MENU to go back.`
    )
  }

  if (COMMANDS.OTHER.test(input)) {
    await updateMember(memberId, { 'Pending Issue Type': 'Other' })
    await updateMemberState(memberId, STATES.AWAITING_SUPPORT_DESC)
    return sendPlainText(phone,
      `No problem, we're here to help! 🤝\n\n` +
      `Please describe your issue or question in one message.\n\n` +
      `Or reply MENU to go back.`
    )
  }

  // Ready pickup responses (from notification)
  if (COMMANDS.OMW.test(input)) {
    return sendPlainText(phone, 
      `Great! See you soon! 👋\n\n` +
      `Your bag will be at ${gymName} reception.\n\n` +
      `Reply MENU for main menu.`
    )
  }

  if (COMMANDS.MORE_TIME.test(input)) {
    return handleExtendTime(phone, ctx)
  }

  // Check if input looks like a bag number (even in IDLE state)
  const bagMatch = input.match(COMMANDS.BAG_NUMBER)
  if (bagMatch) {
    // User sent bag number directly - start drop flow
    const bagNum = bagMatch[1].padStart(3, '0')
    const bagNumber = `B${bagNum}`
    
    await createDrop(memberId, bagNumber, ctx.gymRecordId)
    
    const expected = new Date()
    expected.setHours(expected.getHours() + 48)
    const expectedDate = expected.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    
    return sendBagConfirmed(phone, bagNumber, gymName, expectedDate)
  }

  // Default: show main menu
  return sendMainMenu(phone, firstName)
}

// ============================================================================
// HELPER HANDLERS
// ============================================================================

async function handleTrack(phone, ctx) {
  const { memberId, firstName } = ctx
  
  // Get active drops for member
  const drops = await getActiveDropsByMember(memberId)
  
  if (!drops || drops.length === 0) {
    const used = ctx.dropsUsed || 0
    const total = ctx.dropsAllowed || 10
    return sendTrackNone(phone, used, total)
  }
  
  if (drops.length === 1) {
    const drop = drops[0]
    const bagNumber = drop.fields['Bag Number']
    const status = drop.fields['Status']
    
    const statusDetails = {
      'Dropped': 'Waiting for collection from gym',
      'In Transit': 'On the way to our laundry facility',
      'At Laundry': 'Being professionally cleaned',
      'Ready': 'Ready for pickup at reception! ✅',
    }
    
    const statusDetail = statusDetails[status] || status
    
    // Calculate expected date
    const dropDate = new Date(drop.fields['Drop Date'])
    const expected = new Date(dropDate)
    expected.setHours(expected.getHours() + 48)
    const expectedDate = expected.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    
    return sendTrackSingle(phone, bagNumber, status, statusDetail, expectedDate)
  }
  
  // Multiple active drops
  const dropSummaries = drops.map(d => ({
    bagNumber: d.fields['Bag Number'],
    status: d.fields['Status'],
  }))
  
  return sendTrackMultiple(phone, dropSummaries)
}

async function handleAccount(phone, ctx) {
  const {
    planName,
    gymName,
    dropsUsed,
    dropsAllowed,
    stripeCustomerId,
  } = ctx
  
  // Calculate renew date (approximate - next month)
  const now = new Date()
  const renewDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const renewDateStr = renewDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
  
  // Generate portal URL
  const portalUrl = stripeCustomerId 
    ? `https://flexlaundry.co.uk/portal?customer=${stripeCustomerId}`
    : 'https://flexlaundry.co.uk/portal'
  
  return sendAccountInfo(phone, {
    planName,
    gymName,
    used: dropsUsed || 0,
    total: dropsAllowed || 10,
    renewDate: renewDateStr,
    portalUrl,
  })
}

async function handleExtendTime(phone, ctx) {
  const { memberId, gymName } = ctx
  
  // Get ready drops
  const drops = await getActiveDropsByMember(memberId)
  const readyDrop = drops?.find(d => d.fields['Status'] === 'Ready')
  
  if (!readyDrop) {
    return sendMainMenu(phone, ctx.firstName)
  }
  
  const bagNumber = readyDrop.fields['Bag Number']
  const alreadyExtended = readyDrop.fields['Extended']
  
  if (alreadyExtended) {
    return sendExtensionDenied(phone, bagNumber, gymName)
  }
  
  // Extend by 24 hours
  const newDate = new Date()
  newDate.setHours(newDate.getHours() + 24)
  const newDateStr = newDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  
  await updateDrop(readyDrop.id, {
    'Extended': true,
    'Available Until': newDate.toISOString(),
  })
  
  return sendExtendedTime(phone, bagNumber, newDateStr)
}

// ============================================================================
// AIRTABLE HELPERS (imported from airtable.js, but we need updateMember here)
// ============================================================================

async function updateMember(memberId, fields) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
  
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members/${memberId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  )
  
  if (!response.ok) {
    const error = await response.text()
    console.error(`updateMember error: ${error}`)
  }
  
  return response.json()
}

// ============================================================================
// TWILIO RESPONSE HELPER
// ============================================================================

function respond() {
  // Return empty TwiML - we send messages directly via Twilio API
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    }
  )
}

// ============================================================================
// GET HANDLER (Health check)
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'whatsapp-webhook',
    version: 'MVP-1.0',
    states: Object.values(STATES),
  })
}
