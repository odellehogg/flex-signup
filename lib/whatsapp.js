// lib/whatsapp.js
// WhatsApp message sending via Twilio templates with PLAIN TEXT FALLBACK
// UPDATED: Added detailed error logging to diagnose template variable mismatches
// Total templates: 44 (12 business-initiated, 32 conversational)

import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+447366907286'

// Template SIDs - populated after Meta approval
const TEMPLATES = {
  // =========================================================================
  // BUSINESS-INITIATED TEMPLATES (12)
  // =========================================================================
  WELCOME: process.env.TEMPLATE_WELCOME_SID,
  DROP_CONFIRMED: process.env.TEMPLATE_DROP_CONFIRMED_SID,
  READY_PICKUP: process.env.TEMPLATE_READY_PICKUP_SID,
  PICKUP_CONFIRMED: process.env.TEMPLATE_PICKUP_CONFIRMED_SID,
  REENGAGEMENT: process.env.TEMPLATE_REENGAGEMENT_SID,
  PAUSE_REMINDER: process.env.TEMPLATE_PAUSE_REMINDER_SID,
  PICKUP_CONFIRM_REQUEST: process.env.TEMPLATE_PICKUP_CONFIRM_REQUEST_SID,
  PICKUP_REMINDER: process.env.TEMPLATE_PICKUP_REMINDER_SID,
  PAYMENT_FAILED: process.env.TEMPLATE_PAYMENT_FAILED_SID,
  PAYMENT_RETRY_DAY3: process.env.TEMPLATE_PAYMENT_RETRY_DAY3_SID,
  PAYMENT_RETRY_DAY7: process.env.TEMPLATE_PAYMENT_RETRY_DAY7_SID,
  STUCK_BAG_ALERT: process.env.TEMPLATE_STUCK_BAG_ALERT_SID,
  
  // =========================================================================
  // CONVERSATIONAL TEMPLATES (32)
  // =========================================================================
  HOW_IT_WORKS: process.env.TEMPLATE_HOW_IT_WORKS_SID,
  DROP_GUIDE: process.env.TEMPLATE_DROP_GUIDE_SID,
  BAG_CONFIRMED: process.env.TEMPLATE_BAG_CONFIRMED_SID,
  INVALID_BAG: process.env.TEMPLATE_INVALID_BAG_SID,
  MAIN_MENU: process.env.TEMPLATE_MAIN_MENU_SID,
  CHECK_DROPS: process.env.TEMPLATE_CHECK_DROPS_SID,
  TRACK_ACTIVE: process.env.TEMPLATE_TRACK_ACTIVE_SID,
  TRACK_NONE: process.env.TEMPLATE_TRACK_NONE_SID,
  MANAGE_SUB: process.env.TEMPLATE_MANAGE_SUB_SID,
  PAUSE_MENU: process.env.TEMPLATE_PAUSE_MENU_SID,
  PAUSE_CONFIRMED: process.env.TEMPLATE_PAUSE_CONFIRMED_SID,
  RESUME_CONFIRMED: process.env.TEMPLATE_RESUME_CONFIRMED_SID,
  CANCEL_REASON: process.env.TEMPLATE_CANCEL_REASON_SID,
  CANCEL_RETENTION: process.env.TEMPLATE_CANCEL_RETENTION_SID,
  CANCEL_CONFIRMED: process.env.TEMPLATE_CANCEL_CONFIRMED_SID,
  DISCOUNT_APPLIED: process.env.TEMPLATE_DISCOUNT_APPLIED_SID,
  HELP_MENU: process.env.TEMPLATE_HELP_MENU_SID,
  FEEDBACK_GREAT: process.env.TEMPLATE_FEEDBACK_GREAT_SID,
  FEEDBACK_BAD: process.env.TEMPLATE_FEEDBACK_BAD_SID,
  ISSUE_REPORTED: process.env.TEMPLATE_ISSUE_REPORTED_SID,
  PICKUP_BLOCKED: process.env.TEMPLATE_PICKUP_BLOCKED_SID,
  PICKUP_CONFIRMED_THANKS: process.env.TEMPLATE_PICKUP_CONFIRMED_THANKS_SID,
  NOT_A_MEMBER: process.env.TEMPLATE_NOT_A_MEMBER_SID,
  MY_ACCOUNT: process.env.TEMPLATE_MY_ACCOUNT_SID,
  CHANGE_GYM_MENU: process.env.TEMPLATE_CHANGE_GYM_MENU_SID,
  GYM_CHANGED: process.env.TEMPLATE_GYM_CHANGED_SID,
  CHANGE_PLAN_MENU: process.env.TEMPLATE_CHANGE_PLAN_MENU_SID,
  PLAN_CHANGED: process.env.TEMPLATE_PLAN_CHANGED_SID,
  BILLING_HELP: process.env.TEMPLATE_BILLING_HELP_SID,
  ISSUE_TYPE_MENU: process.env.TEMPLATE_ISSUE_TYPE_MENU_SID,
  DAMAGE_PHOTO_REQUEST: process.env.TEMPLATE_DAMAGE_PHOTO_REQUEST_SID,
  DAMAGE_RECEIVED: process.env.TEMPLATE_DAMAGE_RECEIVED_SID,
}

// ============================================================================
// PLAIN TEXT FALLBACKS
// Used when templates aren't configured or fail
// ============================================================================

const PLAIN_TEXT_FALLBACKS = {
  WELCOME: (vars) => 
    `Welcome to FLEX, ${vars['1']}! 🎉\n\n` +
    `Your ${vars['2']} plan is now active at ${vars['3']}.\n\n` +
    `Ready to drop off your first bag of gym clothes?\n\n` +
    `Reply:\n` +
    `1️⃣ How it works\n` +
    `2️⃣ Make first drop`,

  DROP_CONFIRMED: (vars) =>
    `Got your FLEX bag! ✅\n\n` +
    `Bag ${vars['1']} dropped at ${vars['2']}.\n` +
    `Expected ready by ${vars['3']}.\n\n` +
    `We'll text you when your clothes are ready for pickup.\n\n` +
    `Reply:\n` +
    `1️⃣ Track my order\n` +
    `0️⃣ Main menu`,

  READY_PICKUP: (vars) =>
    `Your clothes are ready! 👕✨\n\n` +
    `Bag ${vars['1']} is waiting at ${vars['2']} reception.\n` +
    `Available until ${vars['3']}.\n\n` +
    `Just ask for your FLEX bag.\n\n` +
    `Reply:\n` +
    `1️⃣ On my way\n` +
    `2️⃣ Need more time`,

  PICKUP_CONFIRMED: () =>
    `Pickup confirmed! Enjoy your fresh gym clothes. 💪\n\n` +
    `Quick question - how was your FLEX experience this time?\n\n` +
    `Reply:\n` +
    `1️⃣ 😊 Great\n` +
    `2️⃣ 😐 OK\n` +
    `3️⃣ 😞 Not good`,

  REENGAGEMENT: (vars) =>
    `Hey ${vars['1']}! 👋\n\n` +
    `We haven't seen your gym clothes lately.\n\n` +
    `You still have ${vars['2']} drops remaining - they expire on ${vars['3']}.\n\n` +
    `Ready to make a drop?\n\n` +
    `Reply:\n` +
    `1️⃣ How to drop\n` +
    `2️⃣ Taking a break`,

  PAUSE_REMINDER: (vars) =>
    `Hi ${vars['1']}! 👋\n\n` +
    `Your FLEX subscription will resume on ${vars['2']}.\n` +
    `Your card will be charged then.\n\n` +
    `Reply:\n` +
    `1️⃣ Resume now\n` +
    `2️⃣ Extend pause`,

  PICKUP_CONFIRM_REQUEST: (vars) =>
    `Hey! 👋\n\n` +
    `Bag ${vars['1']} has been ready at ${vars['2']} for a day now.\n\n` +
    `Have you collected it?\n\n` +
    `Reply:\n` +
    `1️⃣ Yes, collected\n` +
    `2️⃣ Not yet`,

  PICKUP_REMINDER: (vars) =>
    `Friendly reminder! 📦\n\n` +
    `Bag ${vars['1']} is still waiting at ${vars['2']}.\n\n` +
    `Please collect it soon so we can keep the service running smoothly.\n\n` +
    `Reply:\n` +
    `1️⃣ On my way\n` +
    `2️⃣ Need help`,

  PAYMENT_FAILED: (vars) =>
    `Hi ${vars['1']},\n\n` +
    `We couldn't process your payment. 😕\n\n` +
    `Please update your card here:\n${vars['2']}\n\n` +
    `Reply HELP if you need assistance.`,

  PAYMENT_RETRY_DAY3: (vars) =>
    `Hi ${vars['1']},\n\n` +
    `Just a reminder - we still need to update your payment method.\n\n` +
    `Update here: ${vars['2']}\n\n` +
    `Your service will pause in 4 days if not updated.`,

  PAYMENT_RETRY_DAY7: (vars) =>
    `Hi ${vars['1']},\n\n` +
    `Final reminder - your FLEX subscription will pause tomorrow.\n\n` +
    `Update your payment here: ${vars['2']}\n\n` +
    `Reply HELP if you need assistance.`,

  STUCK_BAG_ALERT: (vars) =>
    `⚠️ ALERT: Bag ${vars['1']} at ${vars['2']}\n\n` +
    `Status: ${vars['3']}\n` +
    `Time in status: ${vars['4']} hours\n\n` +
    `Please investigate.`,

  HOW_IT_WORKS: () =>
    `Here's how FLEX works:\n\n` +
    `1️⃣ Drop your sweaty clothes in a FLEX bag at your gym reception\n` +
    `2️⃣ We collect and wash with activewear-safe products\n` +
    `3️⃣ Pick up fresh clothes from reception within 48 hours\n\n` +
    `That's it! No washing, no waiting. 🎉\n\n` +
    `Reply:\n` +
    `1️⃣ Make first drop\n` +
    `0️⃣ Main menu`,

  DROP_GUIDE: (vars) =>
    `Making a drop at ${vars['1']}:\n\n` +
    `1️⃣ Go to reception and ask for a FLEX bag\n` +
    `2️⃣ Fill with gym clothes (tops, shorts, leggings, sports bras, towels, socks - no shoes)\n` +
    `3️⃣ Note the bag number on the tag\n` +
    `4️⃣ Leave at reception before 6pm\n\n` +
    `📝 Reply with your bag number (e.g. B042 or 042)`,

  BAG_CONFIRMED: (vars) =>
    `Got it! ✅\n\n` +
    `Bag ${vars['1']} logged at ${vars['2']}.\n` +
    `Expected ready: ${vars['3']}\n\n` +
    `We'll text you when it's ready for pickup.\n\n` +
    `Reply:\n` +
    `1️⃣ Track status\n` +
    `0️⃣ Main menu`,

  INVALID_BAG: () =>
    `Hmm, I didn't recognize that bag number. 🤔\n\n` +
    `Please enter a number like B042 or just 042.\n\n` +
    `Reply:\n` +
    `1️⃣ Get help\n` +
    `0️⃣ Main menu`,

  MAIN_MENU: (vars) =>
    `Hi ${vars['1']}! How can I help you today?\n\n` +
    `Reply:\n` +
    `1️⃣ Check my drops\n` +
    `2️⃣ Track my order\n` +
    `3️⃣ Manage subscription\n` +
    `4️⃣ My account\n` +
    `5️⃣ Get help`,

  CHECK_DROPS: (vars) =>
    `📊 Your ${vars['1']} plan:\n\n` +
    `Used: ${vars['2']} of ${vars['3']} drops\n` +
    `Remaining: ${vars['4']} drops\n` +
    `Renews: ${vars['5']}\n\n` +
    `Reply:\n` +
    `1️⃣ Make a drop\n` +
    `0️⃣ Main menu`,

  TRACK_ACTIVE: (vars) =>
    `📦 Bag ${vars['1']}\n\n` +
    `Status: ${vars['2']}\n` +
    `Location: ${vars['3']}\n` +
    `Expected: ${vars['4']}\n\n` +
    `Reply:\n` +
    `1️⃣ Refresh\n` +
    `0️⃣ Main menu`,

  TRACK_NONE: () =>
    `You don't have any active drops right now.\n\n` +
    `Ready to drop off your gym clothes?\n\n` +
    `Reply:\n` +
    `1️⃣ Start a drop\n` +
    `0️⃣ Main menu`,

  MANAGE_SUB: (vars) =>
    `Your subscription:\n\n` +
    `Plan: ${vars['1']}\n` +
    `Price: £${vars['2']}/month\n` +
    `Next billing: ${vars['3']}\n\n` +
    `Reply:\n` +
    `1️⃣ Pause subscription\n` +
    `2️⃣ Resume subscription\n` +
    `3️⃣ Cancel subscription\n` +
    `4️⃣ Change gym\n` +
    `5️⃣ Change plan\n` +
    `0️⃣ Main menu`,

  PAUSE_MENU: () =>
    `How long would you like to pause?\n\n` +
    `Reply:\n` +
    `1️⃣ 2 weeks\n` +
    `2️⃣ 1 month\n` +
    `0️⃣ Never mind`,

  PAUSE_CONFIRMED: (vars) =>
    `Your subscription is paused. ✅\n\n` +
    `It will resume on ${vars['1']}.\n\n` +
    `Reply:\n` +
    `1️⃣ Resume now\n` +
    `0️⃣ Main menu`,

  RESUME_CONFIRMED: () =>
    `Welcome back! 🎉\n\n` +
    `Your subscription is active again.\n\n` +
    `Reply:\n` +
    `1️⃣ Make a drop\n` +
    `0️⃣ Main menu`,

  CANCEL_REASON: () =>
    `We're sorry to see you go. 😢\n\n` +
    `Mind telling us why?\n\n` +
    `Reply:\n` +
    `1️⃣ Too expensive\n` +
    `2️⃣ Not using it enough\n` +
    `3️⃣ Service issues\n` +
    `4️⃣ Other reason\n` +
    `0️⃣ Never mind`,

  CANCEL_RETENTION: () =>
    `Wait! 🛑\n\n` +
    `What if we offered you 20% off for 2 months?\n\n` +
    `Reply:\n` +
    `1️⃣ Accept offer\n` +
    `2️⃣ Cancel anyway\n` +
    `0️⃣ Never mind`,

  CANCEL_CONFIRMED: (vars) =>
    `Your subscription is cancelled.\n\n` +
    `You have ${vars['1']} drops remaining until ${vars['2']}.\n\n` +
    `We hope to see you again! 👋\n\n` +
    `Reply:\n` +
    `1️⃣ Resubscribe\n` +
    `0️⃣ Goodbye`,

  DISCOUNT_APPLIED: () =>
    `Great choice! 🎉\n\n` +
    `20% off has been applied to your next 2 months.\n\n` +
    `Thanks for staying with FLEX!\n\n` +
    `Reply:\n` +
    `1️⃣ Make a drop\n` +
    `0️⃣ Main menu`,

  HELP_MENU: () =>
    `How can we help?\n\n` +
    `Reply:\n` +
    `1️⃣ How does FLEX work?\n` +
    `2️⃣ What can I include?\n` +
    `3️⃣ Turnaround time?\n` +
    `4️⃣ What if something's damaged?\n` +
    `5️⃣ How do I pause/cancel?\n` +
    `6️⃣ Gym locations\n` +
    `7️⃣ Report an issue\n` +
    `8️⃣ Billing questions\n` +
    `9️⃣ Contact support\n` +
    `0️⃣ Main menu`,

  FEEDBACK_GREAT: (vars) =>
    `Awesome! Thanks for the feedback. 🙏\n\n` +
    `Love FLEX? Share your referral code with friends:\n` +
    `${vars['1'] || 'FLEX10'}\n\n` +
    `They get 10% off, you get a free drop!\n\n` +
    `Reply:\n` +
    `0️⃣ Main menu`,

  FEEDBACK_BAD: () =>
    `We're sorry to hear that. 😔\n\n` +
    `Please tell us what went wrong and we'll make it right.\n\n` +
    `Just type your feedback below:`,

  ISSUE_REPORTED: (vars) =>
    `Got it. Ticket #${vars['1']} created. ✅\n\n` +
    `Our team will respond within 24 hours.\n\n` +
    `We'll make this right. 💪\n\n` +
    `Reply:\n` +
    `0️⃣ Main menu`,

  PICKUP_BLOCKED: (vars) =>
    `Hold on! 🛑\n\n` +
    `You have bag ${vars['1']} ready at ${vars['2']}.\n\n` +
    `Please confirm you've collected it before starting a new drop.\n\n` +
    `Reply:\n` +
    `1️⃣ Yes, I've collected it\n` +
    `2️⃣ I haven't collected yet`,

  PICKUP_CONFIRMED_THANKS: () =>
    `Thanks for confirming! ✅\n\n` +
    `Enjoy your fresh gym clothes. 💪\n\n` +
    `Reply:\n` +
    `1️⃣ Make another drop\n` +
    `0️⃣ Main menu`,

  NOT_A_MEMBER: () =>
    `Hi! 👋\n\n` +
    `I don't recognize your number. Are you a FLEX member?\n\n` +
    `Join FLEX for gym clothes laundry made easy:\n` +
    `https://flexlaundry.co.uk/join\n\n` +
    `Already a member? Make sure you signed up with this phone number.`,

  MY_ACCOUNT: (vars) =>
    `👤 Your Account\n\n` +
    `Name: ${vars['1']}\n` +
    `Email: ${vars['2']}\n` +
    `Gym: ${vars['3']}\n` +
    `Plan: ${vars['4']}\n` +
    `Drops: ${vars['5']} of ${vars['6']} remaining\n` +
    `Next billing: ${vars['7']}\n\n` +
    `Reply:\n` +
    `1️⃣ Change gym\n` +
    `2️⃣ Change plan\n` +
    `0️⃣ Main menu`,

  CHANGE_GYM_MENU: (vars) =>
    `Current gym: ${vars['1']}\n\n` +
    `Available gyms:\n${vars['2']}\n\n` +
    `Reply with the number of your new gym, or:\n` +
    `0️⃣ Cancel`,

  GYM_CHANGED: (vars) =>
    `Gym updated! ✅\n\n` +
    `Your new gym: ${vars['1']}\n\n` +
    `Your next drop will be at this location.\n\n` +
    `Reply:\n` +
    `0️⃣ Main menu`,

  CHANGE_PLAN_MENU: (vars) =>
    `Current plan: ${vars['1']}\n\n` +
    `Available plans:\n` +
    `1️⃣ Essential - £30/month (10 drops)\n` +
    `2️⃣ Unlimited - Coming soon!\n\n` +
    `Reply:\n` +
    `1️⃣ Switch to Essential\n` +
    `0️⃣ Cancel`,

  PLAN_CHANGED: (vars) =>
    vars['1'] === 'unavailable' 
      ? `Sorry, that plan isn't available yet.\n\nWe'll let you know when it launches!\n\nReply:\n0️⃣ Main menu`
      : `Plan updated! ✅\n\nNew plan: ${vars['1']}\nPrice: £${vars['2']}/month\nDrops: ${vars['3']}/month\n\nReply:\n0️⃣ Main menu`,

  BILLING_HELP: (vars) =>
    `💳 Billing Info\n\n` +
    `Plan: ${vars['1']}\n` +
    `Price: £${vars['2']}/month\n` +
    `Next charge: ${vars['3']}\n\n` +
    `Need to update your card?\n` +
    `Visit: https://flexlaundry.co.uk/portal\n\n` +
    `Reply:\n` +
    `0️⃣ Main menu`,

  ISSUE_TYPE_MENU: () =>
    `What type of issue?\n\n` +
    `Reply:\n` +
    `1️⃣ Late delivery\n` +
    `2️⃣ Missing bag\n` +
    `3️⃣ Wrong items returned\n` +
    `4️⃣ Damage to clothes\n` +
    `5️⃣ Other issue\n` +
    `0️⃣ Cancel`,

  DAMAGE_PHOTO_REQUEST: () =>
    `We're sorry about the damage. 😔\n\n` +
    `Please send a photo of the damaged item(s) and describe what happened.\n\n` +
    `This helps us investigate and make it right.`,

  DAMAGE_RECEIVED: (vars) =>
    `Photo received. ✅\n\n` +
    `Ticket #${vars['1']} created for your damage claim.\n\n` +
    `Our team will review and respond within 24 hours.\n\n` +
    `Reply:\n` +
    `0️⃣ Main menu`,
}

// ============================================================================
// CORE SEND FUNCTION WITH PLAIN TEXT FALLBACK
// ============================================================================

async function sendPlainText(to, body) {
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  
  try {
    const message = await client.messages.create({
      from: FROM,
      to: toNumber,
      body: body,
    })
    console.log(`✅ Plain text sent: ${message.sid}`)
    return message
  } catch (error) {
    console.error(`❌ Plain text failed:`, error.message)
    throw error
  }
}

async function sendTemplate(to, contentSid, variables = {}, templateKey = null) {
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  // If no template SID configured, use plain text fallback immediately
  if (!contentSid) {
    console.warn(`⚠️ No SID for ${templateKey || 'unknown'}, using plain text fallback`)
    
    if (templateKey && PLAIN_TEXT_FALLBACKS[templateKey]) {
      const fallbackText = PLAIN_TEXT_FALLBACKS[templateKey](variables)
      return sendPlainText(to, fallbackText)
    }
    
    return sendPlainText(to, 
      `Thanks for your message!\n\n` +
      `Reply:\n` +
      `1️⃣ Make a drop\n` +
      `2️⃣ Track order\n` +
      `3️⃣ Get help\n` +
      `0️⃣ Main menu`
    )
  }

  // Log what we're about to send (for debugging)
  const varCount = Object.keys(variables).length
  console.log(`📤 Sending template ${templateKey}: SID=${contentSid.substring(0,10)}..., vars=${varCount}: ${JSON.stringify(variables)}`)

  try {
    // Build the message options
    const messageOptions = {
      from: FROM,
      to: toNumber,
      contentSid,
    }
    
    // Only include contentVariables if there are variables to send
    // Some templates don't expect any variables
    if (varCount > 0) {
      messageOptions.contentVariables = JSON.stringify(variables)
    }
    
    const message = await client.messages.create(messageOptions)
    console.log(`✅ Template ${templateKey} sent: ${message.sid}`)
    return message
    
  } catch (error) {
    // Enhanced error logging
    console.error(`❌ Template ${templateKey} FAILED`)
    console.error(`   SID: ${contentSid}`)
    console.error(`   Variables sent: ${JSON.stringify(variables)}`)
    console.error(`   Error: ${error.message}`)
    if (error.code) console.error(`   Code: ${error.code}`)
    if (error.moreInfo) console.error(`   More info: ${error.moreInfo}`)
    
    // Try plain text fallback
    if (templateKey && PLAIN_TEXT_FALLBACKS[templateKey]) {
      console.log(`🔄 Falling back to plain text for ${templateKey}`)
      try {
        const fallbackText = PLAIN_TEXT_FALLBACKS[templateKey](variables)
        return sendPlainText(to, fallbackText)
      } catch (fallbackError) {
        console.error(`❌ Plain text fallback also failed:`, fallbackError.message)
        throw fallbackError
      }
    }
    
    throw error
  }
}

// ============================================================================
// BUSINESS-INITIATED TEMPLATES (12)
// ============================================================================

export async function sendWelcome(to, firstName, planName, gymName) {
  return sendTemplate(to, TEMPLATES.WELCOME, {
    '1': String(firstName || ''),
    '2': String(planName || ''),
    '3': String(gymName || ''),
  }, 'WELCOME')
}

export async function sendDropConfirmed(to, bagNumber, gymName, expectedDate) {
  return sendTemplate(to, TEMPLATES.DROP_CONFIRMED, {
    '1': String(bagNumber || ''),
    '2': String(gymName || ''),
    '3': String(expectedDate || ''),
  }, 'DROP_CONFIRMED')
}

export async function sendReadyPickup(to, bagNumber, gymName, availableUntil) {
  return sendTemplate(to, TEMPLATES.READY_PICKUP, {
    '1': String(bagNumber || ''),
    '2': String(gymName || ''),
    '3': String(availableUntil || ''),
  }, 'READY_PICKUP')
}

export async function sendPickupConfirmed(to) {
  return sendTemplate(to, TEMPLATES.PICKUP_CONFIRMED, {}, 'PICKUP_CONFIRMED')
}

export async function sendReengagement(to, firstName, dropsRemaining, expiryDate) {
  return sendTemplate(to, TEMPLATES.REENGAGEMENT, {
    '1': String(firstName || ''),
    '2': String(dropsRemaining || '0'),
    '3': String(expiryDate || ''),
  }, 'REENGAGEMENT')
}

export async function sendPauseReminder(to, firstName, resumeDate) {
  return sendTemplate(to, TEMPLATES.PAUSE_REMINDER, {
    '1': String(firstName || ''),
    '2': String(resumeDate || ''),
  }, 'PAUSE_REMINDER')
}

export async function sendPickupConfirmRequest(to, bagNumber, gymName) {
  return sendTemplate(to, TEMPLATES.PICKUP_CONFIRM_REQUEST, {
    '1': String(bagNumber || ''),
    '2': String(gymName || ''),
  }, 'PICKUP_CONFIRM_REQUEST')
}

export async function sendPickupReminder(to, bagNumber, gymName) {
  return sendTemplate(to, TEMPLATES.PICKUP_REMINDER, {
    '1': String(bagNumber || ''),
    '2': String(gymName || ''),
  }, 'PICKUP_REMINDER')
}

export async function sendPaymentFailed(to, firstName, updateUrl) {
  return sendTemplate(to, TEMPLATES.PAYMENT_FAILED, {
    '1': String(firstName || ''),
    '2': String(updateUrl || ''),
  }, 'PAYMENT_FAILED')
}

export async function sendPaymentRetryDay3(to, firstName, updateUrl) {
  return sendTemplate(to, TEMPLATES.PAYMENT_RETRY_DAY3, {
    '1': String(firstName || ''),
    '2': String(updateUrl || ''),
  }, 'PAYMENT_RETRY_DAY3')
}

export async function sendPaymentRetryDay7(to, firstName, updateUrl) {
  return sendTemplate(to, TEMPLATES.PAYMENT_RETRY_DAY7, {
    '1': String(firstName || ''),
    '2': String(updateUrl || ''),
  }, 'PAYMENT_RETRY_DAY7')
}

export async function sendStuckBagAlert(to, bagNumber, gymName, status, hoursSince) {
  return sendTemplate(to, TEMPLATES.STUCK_BAG_ALERT, {
    '1': String(bagNumber || ''),
    '2': String(gymName || ''),
    '3': String(status || ''),
    '4': String(hoursSince || '0'),
  }, 'STUCK_BAG_ALERT')
}

// ============================================================================
// CONVERSATIONAL TEMPLATES (32)
// ============================================================================

export async function sendHowItWorks(to) {
  return sendTemplate(to, TEMPLATES.HOW_IT_WORKS, {}, 'HOW_IT_WORKS')
}

export async function sendDropGuide(to, gymName) {
  return sendTemplate(to, TEMPLATES.DROP_GUIDE, {
    '1': String(gymName || ''),
  }, 'DROP_GUIDE')
}

export async function sendBagConfirmed(to, bagNumber, gymName, expectedDate) {
  return sendTemplate(to, TEMPLATES.BAG_CONFIRMED, {
    '1': String(bagNumber || ''),
    '2': String(gymName || ''),
    '3': String(expectedDate || ''),
  }, 'BAG_CONFIRMED')
}

export async function sendInvalidBag(to) {
  return sendTemplate(to, TEMPLATES.INVALID_BAG, {}, 'INVALID_BAG')
}

export async function sendMainMenu(to, firstName) {
  return sendTemplate(to, TEMPLATES.MAIN_MENU, {
    '1': String(firstName || ''),
  }, 'MAIN_MENU')
}

export async function sendCheckDrops(to, planName, usedDrops, totalDrops, remainingDrops, renewDate) {
  return sendTemplate(to, TEMPLATES.CHECK_DROPS, {
    '1': String(planName || ''),
    '2': String(usedDrops || '0'),
    '3': String(totalDrops || '0'),
    '4': String(remainingDrops || '0'),
    '5': String(renewDate || ''),
  }, 'CHECK_DROPS')
}

export async function sendTrackActive(to, bagNumber, status, gymName, expectedDate) {
  return sendTemplate(to, TEMPLATES.TRACK_ACTIVE, {
    '1': String(bagNumber || ''),
    '2': String(status || ''),
    '3': String(gymName || ''),
    '4': String(expectedDate || ''),
  }, 'TRACK_ACTIVE')
}

export async function sendTrackNone(to) {
  return sendTemplate(to, TEMPLATES.TRACK_NONE, {}, 'TRACK_NONE')
}

export async function sendManageSub(to, planName, price, nextBillingDate) {
  return sendTemplate(to, TEMPLATES.MANAGE_SUB, {
    '1': String(planName || ''),
    '2': String(price || '0'),
    '3': String(nextBillingDate || ''),
  }, 'MANAGE_SUB')
}

export async function sendPauseMenu(to) {
  return sendTemplate(to, TEMPLATES.PAUSE_MENU, {}, 'PAUSE_MENU')
}

export async function sendPauseConfirmed(to, resumeDate) {
  return sendTemplate(to, TEMPLATES.PAUSE_CONFIRMED, {
    '1': String(resumeDate || ''),
  }, 'PAUSE_CONFIRMED')
}

export async function sendResumeConfirmed(to) {
  return sendTemplate(to, TEMPLATES.RESUME_CONFIRMED, {}, 'RESUME_CONFIRMED')
}

export async function sendCancelReason(to) {
  return sendTemplate(to, TEMPLATES.CANCEL_REASON, {}, 'CANCEL_REASON')
}

export async function sendCancelRetention(to) {
  return sendTemplate(to, TEMPLATES.CANCEL_RETENTION, {}, 'CANCEL_RETENTION')
}

export async function sendCancelConfirmed(to, remainingDrops, endDate) {
  return sendTemplate(to, TEMPLATES.CANCEL_CONFIRMED, {
    '1': String(remainingDrops || '0'),
    '2': String(endDate || ''),
  }, 'CANCEL_CONFIRMED')
}

export async function sendDiscountApplied(to) {
  return sendTemplate(to, TEMPLATES.DISCOUNT_APPLIED, {}, 'DISCOUNT_APPLIED')
}

export async function sendHelpMenu(to) {
  return sendTemplate(to, TEMPLATES.HELP_MENU, {}, 'HELP_MENU')
}

export async function sendFeedbackGreat(to, referralCode) {
  return sendTemplate(to, TEMPLATES.FEEDBACK_GREAT, {
    '1': String(referralCode || 'FLEX10'),
  }, 'FEEDBACK_GREAT')
}

export async function sendFeedbackBad(to) {
  return sendTemplate(to, TEMPLATES.FEEDBACK_BAD, {}, 'FEEDBACK_BAD')
}

export async function sendIssueReported(to, ticketId) {
  return sendTemplate(to, TEMPLATES.ISSUE_REPORTED, {
    '1': String(ticketId || ''),
  }, 'ISSUE_REPORTED')
}

export async function sendPickupBlocked(to, bagNumber, gymName) {
  return sendTemplate(to, TEMPLATES.PICKUP_BLOCKED, {
    '1': String(bagNumber || ''),
    '2': String(gymName || ''),
  }, 'PICKUP_BLOCKED')
}

export async function sendPickupConfirmedThanks(to) {
  return sendTemplate(to, TEMPLATES.PICKUP_CONFIRMED_THANKS, {}, 'PICKUP_CONFIRMED_THANKS')
}

export async function sendNotAMember(to) {
  return sendTemplate(to, TEMPLATES.NOT_A_MEMBER, {}, 'NOT_A_MEMBER')
}

export async function sendMyAccount(to, firstName, email, gymName, planName, remaining, total, nextBilling) {
  return sendTemplate(to, TEMPLATES.MY_ACCOUNT, {
    '1': String(firstName || ''),
    '2': String(email || ''),
    '3': String(gymName || ''),
    '4': String(planName || ''),
    '5': String(remaining || '0'),
    '6': String(total || '0'),
    '7': String(nextBilling || ''),
  }, 'MY_ACCOUNT')
}

export async function sendChangeGymMenu(to, currentGym, availableGyms) {
  const gymList = availableGyms.map((g, i) => `${i + 1}. ${g}`).join('\n')
  return sendTemplate(to, TEMPLATES.CHANGE_GYM_MENU, {
    '1': String(currentGym || ''),
    '2': gymList,
  }, 'CHANGE_GYM_MENU')
}

export async function sendGymChanged(to, newGymName) {
  return sendTemplate(to, TEMPLATES.GYM_CHANGED, {
    '1': String(newGymName || ''),
  }, 'GYM_CHANGED')
}

export async function sendChangePlanMenu(to, currentPlan) {
  return sendTemplate(to, TEMPLATES.CHANGE_PLAN_MENU, {
    '1': String(currentPlan || ''),
  }, 'CHANGE_PLAN_MENU')
}

export async function sendPlanChanged(to, newPlan, price, drops, unavailable = false) {
  if (unavailable) {
    return sendTemplate(to, TEMPLATES.PLAN_CHANGED, {
      '1': 'unavailable',
      '2': '0',
      '3': '0',
    }, 'PLAN_CHANGED')
  }
  return sendTemplate(to, TEMPLATES.PLAN_CHANGED, {
    '1': String(newPlan || ''),
    '2': String(price || '0'),
    '3': String(drops || '0'),
  }, 'PLAN_CHANGED')
}

export async function sendBillingHelp(to, planName, price, nextBilling) {
  return sendTemplate(to, TEMPLATES.BILLING_HELP, {
    '1': String(planName || ''),
    '2': String(price || '0'),
    '3': String(nextBilling || ''),
  }, 'BILLING_HELP')
}

export async function sendIssueTypeMenu(to) {
  return sendTemplate(to, TEMPLATES.ISSUE_TYPE_MENU, {}, 'ISSUE_TYPE_MENU')
}

export async function sendDamagePhotoRequest(to) {
  return sendTemplate(to, TEMPLATES.DAMAGE_PHOTO_REQUEST, {}, 'DAMAGE_PHOTO_REQUEST')
}

export async function sendDamageReceived(to, ticketId) {
  return sendTemplate(to, TEMPLATES.DAMAGE_RECEIVED, {
    '1': String(ticketId || ''),
  }, 'DAMAGE_RECEIVED')
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { sendPlainText, TEMPLATES, PLAIN_TEXT_FALLBACKS }
