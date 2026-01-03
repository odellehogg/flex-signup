// lib/whatsapp.js
// ============================================================================
// WHATSAPP MESSAGING LIBRARY
// 12 templates with plain text fallbacks for reliability
// Uses Twilio API for WhatsApp Business
// ============================================================================

import { COMPANY, BUTTON_PAYLOADS } from './constants.js';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${COMPANY.phone}`;

// Template SIDs from environment (optional - fallbacks work without them)
const TEMPLATE_SIDS = {
  welcome: process.env.TEMPLATE_WELCOME_SID,
  dropConfirmed: process.env.TEMPLATE_DROP_CONFIRMED_SID,
  readyPickup: process.env.TEMPLATE_READY_PICKUP_SID,
  pickupConfirmed: process.env.TEMPLATE_PICKUP_CONFIRMED_SID,
  mainMenu: process.env.TEMPLATE_MAIN_MENU_SID,
  dropGuide: process.env.TEMPLATE_DROP_GUIDE_SID,
  checkDrops: process.env.TEMPLATE_CHECK_DROPS_SID,
  supportMenu: process.env.TEMPLATE_SUPPORT_MENU_SID,
  supportConfirm: process.env.TEMPLATE_SUPPORT_CONFIRM_SID,
  manageMenu: process.env.TEMPLATE_MANAGE_MENU_SID,
  pauseConfirmed: process.env.TEMPLATE_PAUSE_CONFIRMED_SID,
  resumeConfirmed: process.env.TEMPLATE_RESUME_CONFIRMED_SID,
};

// ============================================================================
// CORE SEND FUNCTION
// ============================================================================

async function sendMessage(to, body, options = {}) {
  const fromNumber = TWILIO_WHATSAPP_NUMBER;
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const formData = new URLSearchParams();
  formData.append('From', fromNumber);
  formData.append('To', toNumber);
  formData.append('Body', body);

  // Add media if provided
  if (options.mediaUrl) {
    formData.append('MediaUrl', options.mediaUrl);
  }

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

    if (!response.ok) {
      console.error('Twilio API error:', result);
      throw new Error(result.message || 'Failed to send message');
    }

    console.log(`Message sent to ${to}: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

async function sendTemplate(to, templateSid, variables = {}) {
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const formData = new URLSearchParams();
  formData.append('From', TWILIO_WHATSAPP_NUMBER);
  formData.append('To', toNumber);
  formData.append('ContentSid', templateSid);

  if (Object.keys(variables).length > 0) {
    formData.append('ContentVariables', JSON.stringify(variables));
  }

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

    if (!response.ok) {
      console.error('Twilio template error:', result);
      return null; // Return null to trigger fallback
    }

    return result;
  } catch (error) {
    console.error('Error sending template:', error);
    return null;
  }
}

// ============================================================================
// TEMPLATE 1: WELCOME
// Sent after successful Stripe payment
// ============================================================================

export async function sendWelcome(to, firstName, planName, gymName) {
  // Try template first
  if (TEMPLATE_SIDS.welcome) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.welcome, {
      '1': firstName,
      '2': planName,
      '3': gymName,
    });
    if (result) return result;
  }

  // Fallback to plain text
  return sendMessage(to, 
    `Welcome to FLEX, ${firstName}! 🎉\n\n` +
    `Your ${planName} plan is now active at ${gymName}.\n\n` +
    `Ready to drop off your first bag of gym clothes?\n\n` +
    `Reply:\n` +
    `• DROP - Start a drop\n` +
    `• MENU - See all options`
  );
}

// ============================================================================
// TEMPLATE 2: DROP CONFIRMED
// Sent when bag number is logged
// ============================================================================

export async function sendDropConfirmed(to, bagNumber, gymName, expectedDate) {
  if (TEMPLATE_SIDS.dropConfirmed) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.dropConfirmed, {
      '1': bagNumber,
      '2': gymName,
      '3': expectedDate,
    });
    if (result) return result;
  }

  return sendMessage(to,
    `Got your FLEX bag! ✅\n\n` +
    `📦 Bag: ${bagNumber}\n` +
    `📍 Location: ${gymName}\n` +
    `⏰ Expected ready: ${expectedDate}\n\n` +
    `We'll text you when it's ready for pickup.\n\n` +
    `Reply:\n` +
    `• TRACK - Check status\n` +
    `• MENU - Main menu`
  );
}

// ============================================================================
// TEMPLATE 3: READY FOR PICKUP
// Sent when status changes to Ready
// ============================================================================

export async function sendReadyPickup(to, bagNumber, gymName, availableUntil) {
  if (TEMPLATE_SIDS.readyPickup) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.readyPickup, {
      '1': bagNumber,
      '2': gymName,
      '3': availableUntil,
    });
    if (result) return result;
  }

  return sendMessage(to,
    `Your clothes are ready! 👕✨\n\n` +
    `📦 Bag ${bagNumber} is waiting at ${gymName} reception.\n` +
    `📅 Available until: ${availableUntil}\n\n` +
    `Just ask for your FLEX bag.\n\n` +
    `Reply:\n` +
    `• PICKED - Confirm pickup\n` +
    `• HELP - Need more time?`
  );
}

// ============================================================================
// TEMPLATE 4: PICKUP CONFIRMED
// Sent when member confirms pickup
// ============================================================================

export async function sendPickupConfirmed(to) {
  if (TEMPLATE_SIDS.pickupConfirmed) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.pickupConfirmed);
    if (result) return result;
  }

  return sendMessage(to,
    `Pickup confirmed! 🎉\n\n` +
    `Enjoy your fresh gym clothes.\n\n` +
    `How was your FLEX experience this time?\n\n` +
    `Reply:\n` +
    `• GREAT - Loved it\n` +
    `• OK - It was fine\n` +
    `• BAD - Had an issue`
  );
}

// ============================================================================
// TEMPLATE 5: MAIN MENU
// Default response to MENU or unrecognized input
// ============================================================================

export async function sendMainMenu(to, firstName) {
  if (TEMPLATE_SIDS.mainMenu) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.mainMenu, {
      '1': firstName,
    });
    if (result) return result;
  }

  return sendMessage(to,
    `Hey ${firstName}! How can I help?\n\n` +
    `Reply with:\n` +
    `• DROP - Start a new drop\n` +
    `• TRACK - Check your order status\n` +
    `• DROPS - See remaining drops\n` +
    `• MANAGE - Subscription options\n` +
    `• HELP - Get support`
  );
}

// ============================================================================
// TEMPLATE 6: DROP GUIDE
// Instructions for making a drop
// ============================================================================

export async function sendDropGuide(to, gymName) {
  if (TEMPLATE_SIDS.dropGuide) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.dropGuide, {
      '1': gymName,
    });
    if (result) return result;
  }

  return sendMessage(to,
    `Making a drop at ${gymName}:\n\n` +
    `1️⃣ Get a FLEX bag from reception\n` +
    `2️⃣ Fill with gym clothes (tops, shorts, leggings, sports bras, towels, socks)\n` +
    `3️⃣ Note the bag number on the tag\n` +
    `4️⃣ Leave at reception before 6pm\n\n` +
    `⚠️ No shoes please!\n\n` +
    `Reply with your BAG NUMBER to track it (e.g., "B042")`
  );
}

// ============================================================================
// TEMPLATE 7: CHECK DROPS
// Show remaining drops and usage
// ============================================================================

export async function sendCheckDrops(to, dropsUsed, dropsTotal, planName, renewDate) {
  if (TEMPLATE_SIDS.checkDrops) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.checkDrops, {
      '1': dropsUsed.toString(),
      '2': dropsTotal.toString(),
      '3': planName,
      '4': renewDate,
    });
    if (result) return result;
  }

  const remaining = dropsTotal - dropsUsed;
  
  return sendMessage(to,
    `📊 Your FLEX drops:\n\n` +
    `Plan: ${planName}\n` +
    `Used: ${dropsUsed} of ${dropsTotal}\n` +
    `Remaining: ${remaining}\n` +
    `Renews: ${renewDate}\n\n` +
    `Reply:\n` +
    `• DROP - Make a drop\n` +
    `• MANAGE - Change plan\n` +
    `• MENU - Main menu`
  );
}

// ============================================================================
// TEMPLATE 8: SUPPORT MENU
// Issue type selection
// ============================================================================

export async function sendSupportMenu(to) {
  if (TEMPLATE_SIDS.supportMenu) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.supportMenu);
    if (result) return result;
  }

  return sendMessage(to,
    `Sorry to hear you're having an issue. What's the problem?\n\n` +
    `Reply:\n` +
    `• MISSING - Missing item\n` +
    `• DAMAGE - Item damaged\n` +
    `• QUALITY - Quality issue\n` +
    `• DELAY - Order delayed\n` +
    `• OTHER - Something else`
  );
}

// ============================================================================
// TEMPLATE 9: SUPPORT CONFIRMED
// Ticket created confirmation
// ============================================================================

export async function sendSupportConfirmed(to, ticketType) {
  if (TEMPLATE_SIDS.supportConfirm) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.supportConfirm, {
      '1': ticketType,
    });
    if (result) return result;
  }

  return sendMessage(to,
    `Got it! Your ${ticketType} issue has been logged. 📝\n\n` +
    `Our team will review and get back to you within 24 hours.\n\n` +
    `Reply MENU to return to main menu.`
  );
}

// ============================================================================
// TEMPLATE 10: MANAGE SUBSCRIPTION MENU
// ============================================================================

export async function sendManageMenu(to, planName, status) {
  if (TEMPLATE_SIDS.manageMenu) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.manageMenu, {
      '1': planName,
      '2': status,
    });
    if (result) return result;
  }

  return sendMessage(to,
    `📋 Your subscription:\n\n` +
    `Plan: ${planName}\n` +
    `Status: ${status}\n\n` +
    `Reply:\n` +
    `• PAUSE - Pause subscription\n` +
    `• CHANGE - Change plan\n` +
    `• GYM - Change gym\n` +
    `• BILLING - Payment settings\n` +
    `• CANCEL - Cancel subscription\n` +
    `• MENU - Main menu`
  );
}

// ============================================================================
// TEMPLATE 11: PAUSE CONFIRMED
// ============================================================================

export async function sendPauseConfirmed(to, resumeDate) {
  if (TEMPLATE_SIDS.pauseConfirmed) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.pauseConfirmed, {
      '1': resumeDate,
    });
    if (result) return result;
  }

  return sendMessage(to,
    `Your subscription is now paused. ⏸️\n\n` +
    `It will automatically resume on ${resumeDate}.\n\n` +
    `Reply RESUME anytime to reactivate early.\n\n` +
    `See you soon! 💪`
  );
}

// ============================================================================
// TEMPLATE 12: RESUME CONFIRMED
// ============================================================================

export async function sendResumeConfirmed(to) {
  if (TEMPLATE_SIDS.resumeConfirmed) {
    const result = await sendTemplate(to, TEMPLATE_SIDS.resumeConfirmed);
    if (result) return result;
  }

  return sendMessage(to,
    `Welcome back! Your subscription is active again. ✅\n\n` +
    `Ready to make a drop?\n\n` +
    `Reply:\n` +
    `• DROP - Start a drop\n` +
    `• MENU - Main menu`
  );
}

// ============================================================================
// ADDITIONAL HELPER MESSAGES
// ============================================================================

export async function sendAwaitingBagNumber(to) {
  return sendMessage(to,
    `Please reply with your bag number (e.g., "B042").\n\n` +
    `You'll find it on the tag attached to the bag.`
  );
}

export async function sendInvalidBagNumber(to, input) {
  return sendMessage(to,
    `"${input}" doesn't look like a valid bag number.\n\n` +
    `Bag numbers look like "B042" or "B123".\n\n` +
    `Please check the tag and try again, or reply MENU to cancel.`
  );
}

export async function sendAwaitingSupportDescription(to, issueType) {
  return sendMessage(to,
    `Got it - ${issueType} issue.\n\n` +
    `Please describe what happened. Include any details like:\n` +
    `• Which item(s)\n` +
    `• What's wrong\n` +
    `• Bag number if you have it`
  );
}

export async function sendAwaitingSupportPhoto(to) {
  return sendMessage(to,
    `Thanks for the details.\n\n` +
    `📸 Can you send a photo? This helps us resolve your issue faster.\n\n` +
    `Reply SKIP if you don't have a photo.`
  );
}

export async function sendTrackingStatus(to, drops) {
  if (drops.length === 0) {
    return sendMessage(to,
      `You don't have any active drops right now.\n\n` +
      `Reply DROP to start one!`
    );
  }

  let statusText = `📦 Your active drops:\n\n`;
  
  drops.forEach((drop, index) => {
    const emoji = {
      'Dropped': '📥',
      'In Transit': '🚚',
      'At Laundry': '🧺',
      'Ready': '✅',
    }[drop.Status] || '📦';
    
    statusText += `${emoji} Bag ${drop['Bag Number']}: ${drop.Status}\n`;
  });

  statusText += `\nReply MENU for options.`;

  return sendMessage(to, statusText);
}

export async function sendBillingLink(to, portalUrl) {
  return sendMessage(to,
    `Here's your billing portal link:\n\n` +
    `${portalUrl}\n\n` +
    `You can update your payment method, view invoices, and more.\n\n` +
    `Reply MENU when done.`
  );
}

export async function sendUnknownCommand(to) {
  return sendMessage(to,
    `Sorry, I didn't understand that.\n\n` +
    `Reply MENU to see your options.`
  );
}

export async function sendNotAMember(to) {
  return sendMessage(to,
    `I couldn't find your account.\n\n` +
    `If you're new, sign up at: flexlaundry.co.uk\n\n` +
    `If you think this is a mistake, please contact support@flexlaundry.co.uk`
  );
}

export async function sendError(to) {
  return sendMessage(to,
    `Something went wrong on our end. 😕\n\n` +
    `Please try again or contact support@flexlaundry.co.uk`
  );
}

export async function sendReengagement(to, firstName, dropsRemaining, expiryDate) {
  return sendMessage(to,
    `Hey ${firstName}! We haven't seen your gym clothes lately. 👀\n\n` +
    `You still have ${dropsRemaining} drops remaining - they expire on ${expiryDate}.\n\n` +
    `Ready to make a drop?\n\n` +
    `Reply:\n` +
    `• DROP - Start a drop\n` +
    `• PAUSE - Taking a break`
  );
}

export async function sendGymChangePrompt(to, currentGym) {
  return sendMessage(to,
    `Your current gym: ${currentGym}\n\n` +
    `Please reply with your new gym name or postcode.\n\n` +
    `Reply CANCEL to keep your current gym.`
  );
}

export async function sendGymChangeConfirmed(to, newGym) {
  return sendMessage(to,
    `Done! Your gym has been updated to ${newGym}. ✅\n\n` +
    `Your next drop should be at ${newGym}.\n\n` +
    `Reply MENU for options.`
  );
}

export async function sendCancelConfirmation(to) {
  return sendMessage(to,
    `We're sorry to see you go! 😢\n\n` +
    `Your subscription has been cancelled. You'll have access until the end of your current billing period.\n\n` +
    `Changed your mind? You can resubscribe anytime at flexlaundry.co.uk`
  );
}

export async function sendRetentionOffer(to) {
  return sendMessage(to,
    `Wait! Before you go... 🛑\n\n` +
    `How about 20% off for the next 3 months?\n\n` +
    `Reply:\n` +
    `• DEAL - Accept offer\n` +
    `• CANCEL - Continue cancellation`
  );
}

// Export the base send function for custom messages
export { sendMessage };

// Export plain text message function for direct use
export async function sendPlainTextMessage(to, body) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  
  try {
    const message = await client.messages.create({
      from,
      to: `whatsapp:${to.replace('whatsapp:', '')}`,
      body,
    });
    console.log(`Plain text sent to ${to}: ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`Failed to send plain text to ${to}:`, err.message);
    throw err;
  }
}

// Alias for backward compatibility
export const sendWelcomeTemplate = sendWelcome;
