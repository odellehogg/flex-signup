// lib/whatsapp.js
// FLEX WhatsApp MVP - Simplified to 12 templates
// All templates have plain text fallbacks for reliability

import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+447366907286'

// ============================================================================
// TEMPLATE SIDS (12 Total)
// ============================================================================

const TEMPLATES = {
  // Business-initiated (require 24hr window or pre-approval)
  WELCOME: process.env.TEMPLATE_WELCOME_SID,
  READY_PICKUP: process.env.TEMPLATE_READY_PICKUP_SID,
  
  // User-initiated (within 24hr session)
  MAIN_MENU: process.env.TEMPLATE_MAIN_MENU_SID,
  DROP_GUIDE: process.env.TEMPLATE_DROP_GUIDE_SID,
  BAG_CONFIRMED: process.env.TEMPLATE_BAG_CONFIRMED_SID,
  TRACK_SINGLE: process.env.TEMPLATE_TRACK_SINGLE_SID,
  TRACK_MULTIPLE: process.env.TEMPLATE_TRACK_MULTIPLE_SID,
  TRACK_NONE: process.env.TEMPLATE_TRACK_NONE_SID,
  ACCOUNT_INFO: process.env.TEMPLATE_ACCOUNT_INFO_SID,
  HELP_MENU: process.env.TEMPLATE_HELP_MENU_SID,
  SUPPORT_PHOTO_ASK: process.env.TEMPLATE_SUPPORT_PHOTO_ASK_SID,
  SUPPORT_CONFIRMED: process.env.TEMPLATE_SUPPORT_CONFIRMED_SID,
}

// ============================================================================
// PLAIN TEXT FALLBACKS (Always work, no template approval needed)
// ============================================================================

const FALLBACKS = {
  WELCOME: (v) => 
    `Welcome to FLEX, ${v.firstName}! 🎽\n\n` +
    `Your ${v.planName} plan is active at ${v.gymName}.\n\n` +
    `Ready to drop off your first bag of gym clothes?\n\n` +
    `Reply:\n` +
    `1️⃣ HOW - How it works\n` +
    `2️⃣ DROP - Start my first drop`,

  READY_PICKUP: (v) =>
    `Your clothes are ready! 🎉\n\n` +
    `Bag ${v.bagNumber} is at ${v.gymName} reception.\n` +
    `Available until ${v.availableUntil}.\n\n` +
    `Just ask staff for your FLEX bag.\n\n` +
    `Reply:\n` +
    `1️⃣ OMW - I'm on my way\n` +
    `2️⃣ MORE - Need more time`,

  MAIN_MENU: (v) =>
    `Hey ${v.firstName}! 👋 What would you like to do?\n\n` +
    `Reply:\n` +
    `1️⃣ DROP - Start a drop\n` +
    `2️⃣ TRACK - Track my bag\n` +
    `3️⃣ ACCOUNT - My account\n` +
    `4️⃣ HELP - Get help`,

  DROP_GUIDE: (v) =>
    `Making a drop at ${v.gymName}:\n\n` +
    `1️⃣ Grab a FLEX bag from reception\n` +
    `2️⃣ Fill with gym clothes (no shoes)\n` +
    `3️⃣ Note the bag number on the tag\n` +
    `4️⃣ Leave at reception before 6pm\n\n` +
    `📝 Reply with your bag number (e.g. B042 or just 42)`,

  BAG_CONFIRMED: (v) =>
    `Got it! ✅\n\n` +
    `Bag ${v.bagNumber} logged at ${v.gymName}.\n` +
    `Expected ready: ${v.expectedDate}\n\n` +
    `We'll text you when it's ready for pickup.\n\n` +
    `Reply:\n` +
    `1️⃣ TRACK - Track this bag\n` +
    `2️⃣ MENU - Main menu`,

  TRACK_SINGLE: (v) =>
    `📦 Bag ${v.bagNumber}\n\n` +
    `Status: ${v.status} ${v.statusEmoji}\n` +
    `${v.statusDetail}\n` +
    `Expected: ${v.expectedDate}\n\n` +
    `Reply:\n` +
    `1️⃣ REFRESH - Check again\n` +
    `2️⃣ MENU - Main menu`,

  TRACK_MULTIPLE: (v) =>
    `You have ${v.count} active drops:\n\n` +
    `${v.dropsList}\n\n` +
    `Reply with a bag number to see details, or:\n` +
    `MENU - Main menu`,

  TRACK_NONE: (v) =>
    `You don't have any active drops right now.\n\n` +
    `Drops this month: ${v.used}/${v.total}\n\n` +
    `Reply:\n` +
    `1️⃣ DROP - Start a drop\n` +
    `2️⃣ MENU - Main menu`,

  ACCOUNT_INFO: (v) =>
    `👤 Your FLEX Account\n\n` +
    `Plan: ${v.planName}\n` +
    `Gym: ${v.gymName}\n` +
    `Drops: ${v.used}/${v.total} used this month\n` +
    `Renews: ${v.renewDate}\n\n` +
    `Need to update billing or change your plan?\n` +
    `👉 ${v.portalUrl}\n\n` +
    `Reply:\n` +
    `1️⃣ MENU - Main menu`,

  HELP_MENU: () =>
    `How can we help? 🤝\n\n` +
    `Reply:\n` +
    `1️⃣ DAMAGED - Report damaged item\n` +
    `2️⃣ MISSING - Missing item/bag\n` +
    `3️⃣ BILLING - Billing question\n` +
    `4️⃣ OTHER - Something else\n` +
    `5️⃣ MENU - Main menu`,

  SUPPORT_PHOTO_ASK: (v) =>
    `Got it - ${v.issueType}.\n\n` +
    `Please describe what happened in one message.\n\n` +
    `${v.photoPrompt}\n\n` +
    `Or reply SKIP to continue without a photo.`,

  SUPPORT_CONFIRMED: (v) =>
    `Ticket created! ✅\n\n` +
    `Reference: #${v.ticketId}\n\n` +
    `We've sent details to ${v.email}.\n` +
    `Our team will respond within 24 hours.\n\n` +
    `We'll ping you here when there's an update.\n\n` +
    `Reply MENU for main menu`,

  // Additional utility messages
  INVALID_BAG: () =>
    `Hmm, I didn't recognize that bag number. 🤔\n\n` +
    `Please enter a number like B042 or just 42.\n\n` +
    `Reply MENU to go back.`,

  NOT_A_MEMBER: () =>
    `Hi! 👋\n\n` +
    `I don't recognize this number.\n\n` +
    `Join FLEX for gym clothes laundry made easy:\n` +
    `👉 https://flexlaundry.co.uk/join\n\n` +
    `Already a member? Make sure you signed up with this phone number.`,

  EXTENDED_TIME: (v) =>
    `No problem! ⏰\n\n` +
    `Bag ${v.bagNumber} availability extended until ${v.newDate}.\n\n` +
    `See you soon!\n\n` +
    `Reply MENU for main menu`,

  EXTENSION_DENIED: (v) =>
    `We can only extend once per bag. 😕\n\n` +
    `Bag ${v.bagNumber} is at ${v.gymName}.\n\n` +
    `Having trouble collecting?\n\n` +
    `Reply:\n` +
    `1️⃣ HELP - Get support\n` +
    `2️⃣ MENU - Main menu`,

  ERROR: () =>
    `Oops! Something went wrong. 😅\n\n` +
    `Reply MENU to start fresh, or HELP if you need assistance.`,
}

// ============================================================================
// CORE SEND FUNCTIONS
// ============================================================================

/**
 * Send plain text message (always works)
 */
export async function sendPlainText(to, body) {
  const toNumber = formatPhone(to)
  
  try {
    const message = await client.messages.create({
      from: FROM,
      to: toNumber,
      body: body,
    })
    console.log(`✅ Sent plain text to ${toNumber}: ${message.sid}`)
    return message
  } catch (error) {
    console.error(`❌ Failed to send to ${toNumber}:`, error.message)
    throw error
  }
}

/**
 * Send template with automatic plain text fallback
 */
async function sendWithFallback(to, templateSid, templateKey, variables) {
  const toNumber = formatPhone(to)
  
  // If no template SID, use fallback immediately
  if (!templateSid) {
    console.log(`⚠️ No SID for ${templateKey}, using fallback`)
    return sendPlainText(to, FALLBACKS[templateKey](variables))
  }

  try {
    // Try template first
    const messageOptions = {
      from: FROM,
      to: toNumber,
      contentSid: templateSid,
    }

    // Add variables if any
    const varKeys = Object.keys(variables).filter(k => !isNaN(k))
    if (varKeys.length > 0) {
      const templateVars = {}
      varKeys.forEach(k => {
        templateVars[k] = String(variables[k] || '')
      })
      messageOptions.contentVariables = JSON.stringify(templateVars)
    }

    const message = await client.messages.create(messageOptions)
    console.log(`✅ Sent template ${templateKey}: ${message.sid}`)
    return message

  } catch (error) {
    console.error(`❌ Template ${templateKey} failed:`, error.message)
    console.log(`🔄 Falling back to plain text for ${templateKey}`)
    
    // Fallback to plain text
    if (FALLBACKS[templateKey]) {
      return sendPlainText(to, FALLBACKS[templateKey](variables))
    }
    
    throw error
  }
}

/**
 * Format phone number for WhatsApp
 */
function formatPhone(phone) {
  if (phone.startsWith('whatsapp:')) return phone
  
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle UK numbers
  if (cleaned.startsWith('0')) {
    cleaned = '44' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('44') && cleaned.length === 10) {
    cleaned = '44' + cleaned
  }
  
  return `whatsapp:+${cleaned}`
}

// ============================================================================
// EXPORTED MESSAGE FUNCTIONS
// ============================================================================

// --- Business-Initiated (Outbound notifications) ---

export async function sendWelcome(to, firstName, planName, gymName) {
  return sendWithFallback(to, TEMPLATES.WELCOME, 'WELCOME', {
    firstName, planName, gymName,
    '1': firstName,
    '2': planName,
    '3': gymName,
  })
}

export async function sendReadyPickup(to, bagNumber, gymName, availableUntil) {
  return sendWithFallback(to, TEMPLATES.READY_PICKUP, 'READY_PICKUP', {
    bagNumber, gymName, availableUntil,
    '1': bagNumber,
    '2': gymName,
    '3': availableUntil,
  })
}

// --- User-Initiated (Responses within conversation) ---

export async function sendMainMenu(to, firstName) {
  return sendWithFallback(to, TEMPLATES.MAIN_MENU, 'MAIN_MENU', {
    firstName,
    '1': firstName,
  })
}

export async function sendDropGuide(to, gymName) {
  return sendWithFallback(to, TEMPLATES.DROP_GUIDE, 'DROP_GUIDE', {
    gymName,
    '1': gymName,
  })
}

export async function sendBagConfirmed(to, bagNumber, gymName, expectedDate) {
  return sendWithFallback(to, TEMPLATES.BAG_CONFIRMED, 'BAG_CONFIRMED', {
    bagNumber, gymName, expectedDate,
    '1': bagNumber,
    '2': gymName,
    '3': expectedDate,
  })
}

export async function sendTrackSingle(to, bagNumber, status, statusDetail, expectedDate) {
  const statusEmojis = {
    'Dropped': '📥',
    'In Transit': '🚚',
    'At Laundry': '🧺',
    'Ready': '✅',
  }
  
  return sendWithFallback(to, TEMPLATES.TRACK_SINGLE, 'TRACK_SINGLE', {
    bagNumber, 
    status, 
    statusEmoji: statusEmojis[status] || '📦',
    statusDetail,
    expectedDate,
    '1': bagNumber,
    '2': status,
    '3': statusDetail,
    '4': expectedDate,
  })
}

export async function sendTrackMultiple(to, drops) {
  const dropsList = drops.map((d, i) => 
    `📦 ${d.bagNumber} - ${d.status}${d.status === 'Ready' ? ' ✅' : ''}`
  ).join('\n')
  
  return sendWithFallback(to, TEMPLATES.TRACK_MULTIPLE, 'TRACK_MULTIPLE', {
    count: drops.length,
    dropsList,
    '1': String(drops.length),
    '2': dropsList,
  })
}

export async function sendTrackNone(to, used, total) {
  return sendWithFallback(to, TEMPLATES.TRACK_NONE, 'TRACK_NONE', {
    used: String(used),
    total: String(total),
    '1': String(used),
    '2': String(total),
  })
}

export async function sendAccountInfo(to, { planName, gymName, used, total, renewDate, portalUrl }) {
  return sendWithFallback(to, TEMPLATES.ACCOUNT_INFO, 'ACCOUNT_INFO', {
    planName, gymName, used, total, renewDate,
    portalUrl: portalUrl || 'https://flexlaundry.co.uk/portal',
    '1': planName,
    '2': gymName,
    '3': String(used),
    '4': String(total),
    '5': renewDate,
  })
}

export async function sendHelpMenu(to) {
  return sendWithFallback(to, TEMPLATES.HELP_MENU, 'HELP_MENU', {})
}

export async function sendSupportPhotoAsk(to, issueType) {
  const photoPrompts = {
    'Damaged Item': 'If you have a photo of the damage, please send it now.',
    'Missing Item': 'If you have any photos that might help, please send them.',
    'Billing Issue': '',
    'Other': '',
  }
  
  return sendWithFallback(to, TEMPLATES.SUPPORT_PHOTO_ASK, 'SUPPORT_PHOTO_ASK', {
    issueType,
    photoPrompt: photoPrompts[issueType] || '',
    '1': issueType,
  })
}

export async function sendSupportConfirmed(to, ticketId, email) {
  return sendWithFallback(to, TEMPLATES.SUPPORT_CONFIRMED, 'SUPPORT_CONFIRMED', {
    ticketId,
    email,
    '1': ticketId,
    '2': email,
  })
}

// --- Utility Messages (Plain text only) ---

export async function sendInvalidBag(to) {
  return sendPlainText(to, FALLBACKS.INVALID_BAG())
}

export async function sendNotAMember(to) {
  return sendPlainText(to, FALLBACKS.NOT_A_MEMBER())
}

export async function sendExtendedTime(to, bagNumber, newDate) {
  return sendPlainText(to, FALLBACKS.EXTENDED_TIME({ bagNumber, newDate }))
}

export async function sendExtensionDenied(to, bagNumber, gymName) {
  return sendPlainText(to, FALLBACKS.EXTENSION_DENIED({ bagNumber, gymName }))
}

export async function sendError(to) {
  return sendPlainText(to, FALLBACKS.ERROR())
}

// ============================================================================
// EXPORTS
// ============================================================================

export { TEMPLATES, FALLBACKS, formatPhone }
