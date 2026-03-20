// lib/whatsapp.js
// ============================================================================
// WHATSAPP MESSAGING LIBRARY
// Template-first: tries ContentSid template, falls back to plain text.
// Set TEMPLATE_*_SID env vars in Vercel to enable button templates.
// ============================================================================

import { COMPANY, DROP_STATUS_EMOJI, DROP_STATUS_DESCRIPTION } from './constants.js';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${COMPANY.phone}`;

// ============================================================================
// CORE SEND FUNCTIONS
// ============================================================================

async function sendMessage(to, body, options = {}) {
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const formData = new URLSearchParams();
  formData.append('From', TWILIO_WHATSAPP_NUMBER);
  formData.append('To', toNumber);
  formData.append('Body', body);
  if (options.mediaUrl) formData.append('MediaUrl', options.mediaUrl);

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );
    const result = await response.json();
    if (!response.ok) { console.error('Twilio API error:', result); throw new Error(result.message || 'Failed to send message'); }
    console.log(`WhatsApp sent to ${to}: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

// Template-first sender: tries ContentSid, falls back to plain text automatically
async function sendTemplate(to, contentSid, contentVariables = {}) {
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const formData = new URLSearchParams();
  formData.append('From', TWILIO_WHATSAPP_NUMBER);
  formData.append('To', toNumber);
  formData.append('ContentSid', contentSid);
  formData.append('ContentVariables', JSON.stringify(contentVariables));

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Template send failed: ${response.status}`);
  console.log(`WhatsApp template sent to ${to}: ${result.sid}`);
  return result;
}

// Helper: try template first, fall back to plain text if SID not set or template fails
async function sendWithFallback(to, sid, vars, fallbackBody) {
  if (sid) {
    try {
      return await sendTemplate(to, sid, vars);
    } catch (err) {
      console.error(`Template ${sid} failed, using plain text fallback:`, err.message);
    }
  }
  return sendMessage(to, fallbackBody);
}

// ============================================================================
// VERIFICATION MESSAGE
// ============================================================================

export async function sendVerificationCodeMessage(to, code) {
  // Verification codes are session messages — plain text only (no template needed)
  return sendMessage(to,
    `Your FLEX verification code is:\n\n` +
    `*${code}*\n\n` +
    `This code expires in 10 minutes.\n\n` +
    `If you didn't request this, please ignore this message.`
  );
}

// ============================================================================
// WELCOME MESSAGE (After Payment)
// ============================================================================

export async function sendWelcome(to, { firstName, planName, gymName }) {
  return sendWithFallback(
    to,
    process.env.TEMPLATE_WELCOME_SID,
    { '1': firstName, '2': planName, '3': gymName },
    `Welcome to FLEX, ${firstName}! 🎉\n\n` +
    `Your ${planName} plan is now active at ${gymName}.\n\n` +
    `Ready to drop off your first bag of gym clothes?\n\n` +
    `Reply:\n` +
    `• 1 or DROP - Start a drop\n` +
    `• 2 or STATUS - Check drop status\n` +
    `• 3 or HELP - Get support`
  );
}

// Alias for backwards compatibility
export const sendWelcomeTemplate = sendWelcome;

// ============================================================================
// MAIN MENU
// ============================================================================

export async function sendMainMenu(to, firstName) {
  return sendWithFallback(
    to,
    process.env.TEMPLATE_MAIN_MENU_SID,
    { '1': firstName },
    `Hey ${firstName}! How can I help?\n\n` +
    `Reply:\n` +
    `• 1 or DROP - Start a drop\n` +
    `• 2 or STATUS - Check drop status\n` +
    `• 3 or HELP - Get support`
  );
}

// ============================================================================
// DROP FLOW MESSAGES
// ============================================================================

export async function sendDropGuide(to, { gymName, dropsRemaining }) {
  return sendWithFallback(
    to,
    process.env.TEMPLATE_DROP_GUIDE_SID,
    { '1': gymName, '2': String(dropsRemaining) },
    `📦 Making a drop at ${gymName}\n\n` +
    `1. Get a FLEX bag from reception\n` +
    `2. Fill with gym clothes (tops, shorts, leggings, socks, towels)\n` +
    `3. Note the bag number on the tag\n` +
    `4. Leave at reception before 6pm\n\n` +
    `You have ${dropsRemaining} drop${dropsRemaining !== 1 ? 's' : ''} remaining this month.\n\n` +
    `Reply with your bag number (e.g. B042)\n\n` +
    `Or reply MENU to go back.`
  );
}

export async function sendInvalidBagNumber(to, input, reason) {
  let message = `"${input}" `;
  switch (reason) {
    case 'INVALID_FORMAT':
      message += `doesn't look like a valid bag number.\n\nBag numbers look like "B042" or just "42".`;
      break;
    case 'NOT_FOUND':
      message += `isn't in our system. Please check the tag on the bag.`;
      break;
    case 'NOT_AVAILABLE':
      message += `is already being used for another drop.`;
      break;
    default:
      message += `isn't available right now.`;
  }
  return sendMessage(to, `${message}\n\nPlease try again or reply MENU to go back.`);
}

export async function sendDropConfirmed(to, { bagNumber, gymName, expectedDate, dropsRemaining }) {
  const remaining = dropsRemaining !== undefined ? String(dropsRemaining) : '?';
  return sendWithFallback(
    to,
    process.env.TEMPLATE_DROP_CONFIRMED_SID,
    { '1': bagNumber, '2': gymName, '3': expectedDate, '4': remaining },
    `Got your FLEX bag! ✅\n\n` +
    `📦 Bag: ${bagNumber}\n` +
    `📍 Location: ${gymName}\n` +
    `⏰ Expected ready: ${expectedDate}\n` +
    `📊 Drops remaining: ${remaining}\n\n` +
    `We'll text you when it's ready for pickup.`
  );
}

export async function sendNoDropsRemaining(to) {
  return sendMessage(to,
    `You've used all your drops this month! 😅\n\n` +
    `Your drops will reset on your next billing date.\n\n` +
    `Want more drops? Visit ${COMPANY.website}/portal to upgrade your plan.`
  );
}

// ============================================================================
// STATUS MESSAGES
// ============================================================================

export async function sendDropStatus(to, { activeDrops, dropsRemaining, dropsTotal }) {
  if (activeDrops.length === 0) {
    return sendMessage(to,
      `No active drops right now.\n\n` +
      `Drops remaining this month: ${dropsRemaining} of ${dropsTotal}\n\n` +
      `Reply 1 to start a drop!`
    );
  }

  let statusText = `📦 Your active drops:\n\n`;
  activeDrops.forEach((drop) => {
    const status = drop.fields['Status'];
    const emoji = DROP_STATUS_EMOJI[status] || '📦';
    const description = DROP_STATUS_DESCRIPTION[status] || status;
    const bagNumber = drop.fields['Bag Number'];
    statusText += `${emoji} Bag ${bagNumber}: ${description}`;
    if (status === 'Ready') {
      const gymName = drop.fields['Gym Name']?.[0] || 'your gym';
      statusText += ` at ${gymName}`;
    }
    statusText += '\n';
  });
  statusText += `\nDrops remaining this month: ${dropsRemaining} of ${dropsTotal}`;
  return sendMessage(to, statusText);
}

// ============================================================================
// READY FOR PICKUP (Triggered by status change)
// ============================================================================

export async function sendReadyPickup(to, { bagNumber, gymName, firstName }) {
  return sendWithFallback(
    to,
    process.env.TEMPLATE_READY_PICKUP_SID,
    { '1': firstName, '2': bagNumber, '3': gymName },
    `Your clothes are ready, ${firstName}! 👕✨\n\n` +
    `📦 Bag ${bagNumber} is waiting at ${gymName} reception.\n\n` +
    `Just ask staff for your FLEX bag.\n\n` +
    `Enjoy your fresh gym gear! 💪`
  );
}

// ============================================================================
// SUPPORT MESSAGES
// ============================================================================

export async function sendSupportPrompt(to) {
  return sendWithFallback(
    to,
    process.env.TEMPLATE_SUPPORT_MENU_SID,
    {},
    `Need help? Describe your issue below and we'll create a support ticket.\n\n` +
    `Include:\n` +
    `• What happened\n` +
    `• Bag number (if relevant)\n` +
    `• Photos (if reporting damage)\n\n` +
    `Or email ${COMPANY.supportEmail} directly.\n\n` +
    `Reply MENU to go back.`
  );
}

export async function sendSupportConfirmed(to, { ticketId }) {
  return sendWithFallback(
    to,
    process.env.TEMPLATE_SUPPORT_CONFIRM_SID,
    { '1': ticketId },
    `Thanks! We've created support ticket #${ticketId}. 📝\n\n` +
    `You'll receive an email confirmation shortly.\n` +
    `We'll respond within 24 hours.\n\n` +
    `Reply MENU for options.`
  );
}

// ============================================================================
// ERROR / FALLBACK MESSAGES
// ============================================================================

export async function sendUnknownCommand(to, firstName) {
  return sendMessage(to,
    `I didn't catch that, ${firstName}.\n\n` +
    `Reply:\n` +
    `• 1 or DROP - Start a drop\n` +
    `• 2 or STATUS - Check drop status\n` +
    `• 3 or HELP - Get support`
  );
}

export async function sendNotAMember(to) {
  return sendMessage(to,
    `Hi! 👋 I don't recognise this number.\n\n` +
    `To use FLEX, please sign up at:\n` +
    `${COMPANY.website}\n\n` +
    `Already a member? Make sure you're messaging from the phone number you signed up with.`
  );
}

export async function sendError(to) {
  return sendMessage(to,
    `Something went wrong on our end. 😕\n\n` +
    `Please try again or contact ${COMPANY.supportEmail}`
  );
}

// ============================================================================
// SUBSCRIPTION MESSAGES
// ============================================================================

export async function sendSubscriptionPaused(to) {
  return sendMessage(to,
    `Your FLEX subscription is currently paused. ⏸️\n\n` +
    `To resume and start making drops again, visit:\n` +
    `${COMPANY.website}/portal\n\n` +
    `Need help? Reply HELP.`
  );
}

export async function sendSubscriptionInactive(to) {
  return sendMessage(to,
    `Your FLEX subscription is no longer active. ❌\n\n` +
    `To resubscribe, visit:\n` +
    `${COMPANY.website}\n\n` +
    `Already sorted? Make sure you're messaging from the number on your account.`
  );
}

export async function sendPauseReminder(to, { firstName, resumeDate }) {
  return sendWithFallback(
    to,
    process.env.TEMPLATE_PAUSE_REMINDER_SID,
    { '1': firstName, '2': resumeDate },
    `Hi ${firstName}! 👋\n\n` +
    `Your FLEX subscription will resume on ${resumeDate}. Your card will be charged then.\n\n` +
    `Ready to get back to it? Reply RESUME to start early.\n\n` +
    `Need more time? Reply PAUSE to extend your break.`
  );
}

export async function sendPauseConfirmed(to, { resumeDate }) {
  return sendMessage(to,
    `Your subscription is now paused. ⏸️\n\n` +
    `It will automatically resume on ${resumeDate}.\n\n` +
    `To manage your subscription, visit:\n` +
    `${COMPANY.website}/portal`
  );
}

export async function sendResumeConfirmed(to) {
  return sendMessage(to,
    `Welcome back! Your subscription is active again. ✅\n\n` +
    `Reply 1 to make a drop!`
  );
}

// ============================================================================
// PHONE UPDATE MESSAGES
// ============================================================================

export async function sendPhoneUpdateConfirmed(to, { oldPhoneLastFour }) {
  return sendMessage(to,
    `Your phone number has been updated! 📱\n\n` +
    `You'll now receive all FLEX messages at this number.\n\n` +
    `(Previous number ending in ${oldPhoneLastFour} will no longer work)`
  );
}

// ============================================================================
// BACKWARDS COMPATIBILITY EXPORTS
// ============================================================================

export async function sendPlainTextMessage(to, body) {
  return sendMessage(to, body);
}

export async function sendReengagement(to, { firstName, dropsRemaining, expiryDate }) {
  return sendWithFallback(
    to,
    process.env.TEMPLATE_REENGAGEMENT_SID,
    { '1': firstName, '2': String(dropsRemaining), '3': expiryDate },
    `Hey ${firstName}! We haven't seen your gym clothes lately. 👀\n\n` +
    `You still have ${dropsRemaining} drops remaining - they expire on ${expiryDate}.\n\n` +
    `Ready to make a drop?\n\n` +
    `Reply 1 to start a drop!`
  );
}

export async function sendCheckDrops(to, { dropsRemaining, plan }) {
  return sendMessage(to,
    `📊 Your subscription:\n\n` +
    `Plan: ${plan}\n` +
    `Drops remaining: ${dropsRemaining}\n\n` +
    `Reply 1 to make a drop!`
  );
}

export async function sendTrackingStatus(to, drops) {
  if (!drops || drops.length === 0) {
    return sendMessage(to, `You don't have any active drops right now.\n\nReply 1 to start one!`);
  }
  let statusText = `📦 Your active drops:\n\n`;
  drops.forEach((drop) => {
    const status = drop.fields?.['Status'] || drop.Status || 'Unknown';
    const bagNumber = drop.fields?.['Bag Number'] || drop['Bag Number'];
    statusText += `• Bag ${bagNumber}: ${status}\n`;
  });
  statusText += `\nReply MENU for options.`;
  return sendMessage(to, statusText);
}

export async function sendManageMenu(to, planName, status) {
  return sendMessage(to,
    `📋 Your subscription:\n\n` +
    `Plan: ${planName}\n` +
    `Status: ${status}\n\n` +
    `To manage your subscription, visit:\n` +
    `${COMPANY.website}/portal`
  );
}

export async function sendSupportMenu(to) {
  return sendSupportPrompt(to);
}

export async function sendBillingLink(to, portalUrl) {
  return sendMessage(to,
    `Here's your billing portal link:\n\n` +
    `${portalUrl}\n\n` +
    `You can update your payment method, view invoices, and more.`
  );
}

export async function sendCancelConfirmation(to) {
  return sendMessage(to,
    `We're sorry to see you go! 😢\n\n` +
    `Your subscription has been cancelled. You'll have access until the end of your current billing period.\n\n` +
    `Changed your mind? You can resubscribe anytime at ${COMPANY.website}`
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { sendMessage };

export default {
  sendMessage,
  sendPlainTextMessage,
  sendVerificationCodeMessage,
  sendWelcome,
  sendWelcomeTemplate,
  sendMainMenu,
  sendDropGuide,
  sendInvalidBagNumber,
  sendDropConfirmed,
  sendNoDropsRemaining,
  sendDropStatus,
  sendReadyPickup,
  sendSupportPrompt,
  sendSupportMenu,
  sendSupportConfirmed,
  sendUnknownCommand,
  sendNotAMember,
  sendSubscriptionPaused,
  sendSubscriptionInactive,
  sendError,
  sendPauseReminder,
  sendPauseConfirmed,
  sendResumeConfirmed,
  sendPhoneUpdateConfirmed,
  sendReengagement,
  sendCheckDrops,
  sendTrackingStatus,
  sendManageMenu,
  sendBillingLink,
  sendCancelConfirmation,
};
