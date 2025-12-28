// lib/whatsapp.js
// WhatsApp message sending via Twilio templates with email fallback
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
  // NEW templates
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
// CORE SEND FUNCTION WITH EMAIL FALLBACK SUPPORT
// ============================================================================

async function sendTemplate(to, contentSid, variables = {}, emailFallback = null) {
  // Ensure WhatsApp format
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  // If no template SID configured, try email fallback
  if (!contentSid) {
    console.warn('Template SID not configured, attempting email fallback')
    if (emailFallback) {
      try {
        await emailFallback()
        console.log('✅ Email fallback sent successfully')
        return { fallback: 'email' }
      } catch (emailError) {
        console.error('❌ Email fallback also failed:', emailError.message)
        throw new Error('Both WhatsApp and email failed')
      }
    }
    throw new Error('Template SID not configured and no email fallback')
  }

  try {
    const message = await client.messages.create({
      from: FROM,
      to: toNumber,
      contentSid,
      contentVariables: JSON.stringify(variables),
    })
    console.log(`✅ WhatsApp sent: ${message.sid}`)
    return message
  } catch (error) {
    console.error(`❌ WhatsApp failed:`, error.message)
    
    // Try email fallback if provided
    if (emailFallback) {
      try {
        await emailFallback()
        console.log('✅ Email fallback sent successfully')
        return { fallback: 'email' }
      } catch (emailError) {
        console.error('❌ Email fallback also failed:', emailError.message)
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
    1: firstName,
    2: planName,
    3: gymName,
  })
}

export async function sendDropConfirmed(to, bagNumber, gymName, expectedDate) {
  return sendTemplate(to, TEMPLATES.DROP_CONFIRMED, {
    1: bagNumber,
    2: gymName,
    3: expectedDate,
  })
}

export async function sendReadyPickup(to, bagNumber, gymName, availableUntil) {
  return sendTemplate(to, TEMPLATES.READY_PICKUP, {
    1: bagNumber,
    2: gymName,
    3: availableUntil,
  })
}

export async function sendPickupConfirmed(to) {
  return sendTemplate(to, TEMPLATES.PICKUP_CONFIRMED, {})
}

export async function sendReengagement(to, firstName, dropsRemaining, expiryDate) {
  return sendTemplate(to, TEMPLATES.REENGAGEMENT, {
    1: firstName,
    2: String(dropsRemaining),
    3: expiryDate,
  })
}

export async function sendPauseReminder(to, firstName, resumeDate) {
  return sendTemplate(to, TEMPLATES.PAUSE_REMINDER, {
    1: firstName,
    2: resumeDate,
  })
}

export async function sendPickupConfirmRequest(to, bagNumber, gymName) {
  return sendTemplate(to, TEMPLATES.PICKUP_CONFIRM_REQUEST, {
    1: bagNumber,
    2: gymName,
  })
}

export async function sendPickupReminder(to, bagNumber, gymName) {
  return sendTemplate(to, TEMPLATES.PICKUP_REMINDER, {
    1: bagNumber,
    2: gymName,
  })
}

// Payment retry messages (NEW)
export async function sendPaymentFailed(to, firstName, updateUrl) {
  return sendTemplate(to, TEMPLATES.PAYMENT_FAILED, {
    1: firstName,
    2: updateUrl,
  })
}

export async function sendPaymentRetryDay3(to, firstName, updateUrl) {
  return sendTemplate(to, TEMPLATES.PAYMENT_RETRY_DAY3, {
    1: firstName,
    2: updateUrl,
  })
}

export async function sendPaymentRetryDay7(to, firstName, updateUrl) {
  return sendTemplate(to, TEMPLATES.PAYMENT_RETRY_DAY7, {
    1: firstName,
    2: updateUrl,
  })
}

// Stuck bag alert for ops (NEW)
export async function sendStuckBagAlert(to, bagNumber, gymName, status, hoursSince) {
  return sendTemplate(to, TEMPLATES.STUCK_BAG_ALERT, {
    1: bagNumber,
    2: gymName,
    3: status,
    4: String(hoursSince),
  })
}

// ============================================================================
// CONVERSATIONAL TEMPLATES (32)
// ============================================================================

export async function sendHowItWorks(to) {
  return sendTemplate(to, TEMPLATES.HOW_IT_WORKS, {})
}

export async function sendDropGuide(to, gymName) {
  return sendTemplate(to, TEMPLATES.DROP_GUIDE, {
    1: gymName,
  })
}

export async function sendBagConfirmed(to, bagNumber, gymName, expectedDate) {
  return sendTemplate(to, TEMPLATES.BAG_CONFIRMED, {
    1: bagNumber,
    2: gymName,
    3: expectedDate,
  })
}

export async function sendInvalidBag(to) {
  return sendTemplate(to, TEMPLATES.INVALID_BAG, {})
}

export async function sendMainMenu(to, firstName) {
  return sendTemplate(to, TEMPLATES.MAIN_MENU, {
    1: firstName,
  })
}

export async function sendCheckDrops(to, planName, usedDrops, totalDrops, remainingDrops, renewDate) {
  return sendTemplate(to, TEMPLATES.CHECK_DROPS, {
    1: planName,
    2: String(usedDrops),
    3: String(totalDrops),
    4: String(remainingDrops),
    5: renewDate,
  })
}

export async function sendTrackActive(to, bagNumber, status, gymName, expectedDate) {
  return sendTemplate(to, TEMPLATES.TRACK_ACTIVE, {
    1: bagNumber,
    2: status,
    3: gymName,
    4: expectedDate,
  })
}

export async function sendTrackNone(to) {
  return sendTemplate(to, TEMPLATES.TRACK_NONE, {})
}

export async function sendManageSub(to, planName, price, nextBillingDate) {
  return sendTemplate(to, TEMPLATES.MANAGE_SUB, {
    1: planName,
    2: String(price),
    3: nextBillingDate,
  })
}

export async function sendPauseMenu(to) {
  return sendTemplate(to, TEMPLATES.PAUSE_MENU, {})
}

export async function sendPauseConfirmed(to, resumeDate) {
  return sendTemplate(to, TEMPLATES.PAUSE_CONFIRMED, {
    1: resumeDate,
  })
}

export async function sendResumeConfirmed(to) {
  return sendTemplate(to, TEMPLATES.RESUME_CONFIRMED, {})
}

export async function sendCancelReason(to) {
  return sendTemplate(to, TEMPLATES.CANCEL_REASON, {})
}

export async function sendCancelRetention(to) {
  return sendTemplate(to, TEMPLATES.CANCEL_RETENTION, {})
}

export async function sendCancelConfirmed(to, remainingDrops, endDate) {
  return sendTemplate(to, TEMPLATES.CANCEL_CONFIRMED, {
    1: String(remainingDrops),
    2: endDate,
  })
}

export async function sendDiscountApplied(to) {
  return sendTemplate(to, TEMPLATES.DISCOUNT_APPLIED, {})
}

export async function sendHelpMenu(to) {
  return sendTemplate(to, TEMPLATES.HELP_MENU, {})
}

export async function sendFeedbackGreat(to, referralCode) {
  return sendTemplate(to, TEMPLATES.FEEDBACK_GREAT, {
    1: referralCode,
  })
}

export async function sendFeedbackBad(to) {
  return sendTemplate(to, TEMPLATES.FEEDBACK_BAD, {})
}

export async function sendIssueReported(to, ticketId) {
  return sendTemplate(to, TEMPLATES.ISSUE_REPORTED, {
    1: ticketId,
  })
}

export async function sendPickupBlocked(to, bagNumber, gymName) {
  return sendTemplate(to, TEMPLATES.PICKUP_BLOCKED, {
    1: bagNumber,
    2: gymName,
  })
}

export async function sendPickupConfirmedThanks(to) {
  return sendTemplate(to, TEMPLATES.PICKUP_CONFIRMED_THANKS, {})
}

// ============================================================================
// NEW CONVERSATIONAL TEMPLATES
// ============================================================================

// Not a member - send signup prompt
export async function sendNotAMember(to) {
  return sendTemplate(to, TEMPLATES.NOT_A_MEMBER, {})
}

// My Account - show all account details
export async function sendMyAccount(to, firstName, email, gymName, planName, remaining, total, nextBilling) {
  return sendTemplate(to, TEMPLATES.MY_ACCOUNT, {
    1: firstName,
    2: email,
    3: gymName,
    4: planName,
    5: String(remaining),
    6: String(total),
    7: nextBilling,
  })
}

// Change Gym Menu
export async function sendChangeGymMenu(to, currentGym, availableGyms) {
  const gymList = availableGyms.map((g, i) => `${i + 1}. ${g}`).join('\n')
  return sendTemplate(to, TEMPLATES.CHANGE_GYM_MENU, {
    1: currentGym,
    2: gymList,
  })
}

// Gym Changed Confirmation
export async function sendGymChanged(to, newGymName) {
  return sendTemplate(to, TEMPLATES.GYM_CHANGED, {
    1: newGymName,
  })
}

// Change Plan Menu
export async function sendChangePlanMenu(to, currentPlan) {
  return sendTemplate(to, TEMPLATES.CHANGE_PLAN_MENU, {
    1: currentPlan,
  })
}

// Plan Changed Confirmation (or unavailable message)
export async function sendPlanChanged(to, newPlan, price, drops, unavailable = false) {
  if (unavailable) {
    // Send unavailable message instead
    return sendTemplate(to, TEMPLATES.PLAN_CHANGED, {
      1: 'unavailable',
      2: '0',
      3: '0',
    })
  }
  return sendTemplate(to, TEMPLATES.PLAN_CHANGED, {
    1: newPlan,
    2: String(price),
    3: String(drops),
  })
}

// Billing Help
export async function sendBillingHelp(to, planName, price, nextBilling) {
  return sendTemplate(to, TEMPLATES.BILLING_HELP, {
    1: planName,
    2: String(price),
    3: nextBilling,
  })
}

// Issue Type Selection Menu
export async function sendIssueTypeMenu(to) {
  return sendTemplate(to, TEMPLATES.ISSUE_TYPE_MENU, {})
}

// Request damage photo
export async function sendDamagePhotoRequest(to) {
  return sendTemplate(to, TEMPLATES.DAMAGE_PHOTO_REQUEST, {})
}

// Damage photo received confirmation
export async function sendDamageReceived(to, ticketId) {
  return sendTemplate(to, TEMPLATES.DAMAGE_RECEIVED, {
    1: ticketId,
  })
}
