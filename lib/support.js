// lib/support.js
// ============================================================================
// SUPPORT TICKET SYSTEM
// Handles ticket creation, photo uploads, and notifications
// ============================================================================

import { createIssue, updateMember, getMemberById, getActiveDropsByMember } from './airtable.js';
import { sendOpsNewTicketEmail } from './email.js';
import { sendSupportConfirmed } from './whatsapp.js';
import { ISSUE_TYPES, CONVERSATION_STATES } from './constants.js';

// ============================================================================
// TICKET CREATION
// ============================================================================

/**
 * Create a support ticket from WhatsApp
 */
export async function createSupportTicket({
  memberId,
  type,
  description,
  photoUrls = [],
  bagNumber = null,
}) {
  // Get member details
  const member = await getMemberById(memberId);
  
  if (!member) {
    throw new Error('Member not found');
  }

  // Try to find related drop if bag number provided
  let dropId = null;
  if (bagNumber) {
    const drops = await getActiveDropsByMember(memberId);
    const relatedDrop = drops.find(d => d['Bag Number'] === bagNumber);
    if (relatedDrop) {
      dropId = relatedDrop.id;
    }
  }

  // Create the issue in Airtable
  const issue = await createIssue({
    memberId,
    type,
    description,
    photoUrls,
    dropId,
  });

  // Send confirmation to member
  await sendSupportConfirmed(member['Phone Number'], type);

  // Notify ops team
  await sendOpsNewTicketEmail({
    type,
    memberName: `${member['First Name']} ${member['Last Name'] || ''}`.trim(),
    memberPhone: member['Phone Number'],
    memberEmail: member.Email,
    description,
    bagNumber,
    hasPhoto: photoUrls.length > 0,
  });

  // Reset conversation state
  await updateMember(memberId, {
    'Conversation State': CONVERSATION_STATES.IDLE,
    'Pending Issue Type': '',
    'Pending Issue Description': '',
  });

  return issue;
}

/**
 * Start support flow - set state and ask for issue type
 */
export async function startSupportFlow(memberId) {
  await updateMember(memberId, {
    'Conversation State': CONVERSATION_STATES.AWAITING_SUPPORT_DESC,
  });
}

/**
 * Set pending issue type and await description
 */
export async function setPendingIssueType(memberId, issueType) {
  // Validate issue type
  const validTypes = Object.values(ISSUE_TYPES);
  const normalizedType = validTypes.find(t => 
    t.toLowerCase() === issueType.toLowerCase() ||
    t.split(' ')[0].toLowerCase() === issueType.toLowerCase()
  );

  if (!normalizedType) {
    return { success: false, error: 'Invalid issue type' };
  }

  await updateMember(memberId, {
    'Pending Issue Type': normalizedType,
    'Conversation State': CONVERSATION_STATES.AWAITING_SUPPORT_DESC,
  });

  return { success: true, type: normalizedType };
}

/**
 * Set pending issue description and await photo
 */
export async function setPendingDescription(memberId, description) {
  await updateMember(memberId, {
    'Pending Issue Description': description,
    'Conversation State': CONVERSATION_STATES.AWAITING_SUPPORT_PHOTO,
  });
}

/**
 * Complete ticket with optional photo
 */
export async function completeTicketWithPhoto(memberId, photoUrl = null) {
  const member = await getMemberById(memberId);
  
  if (!member) {
    throw new Error('Member not found');
  }

  const pendingType = member['Pending Issue Type'];
  const pendingDesc = member['Pending Issue Description'];

  if (!pendingType || !pendingDesc) {
    throw new Error('No pending ticket data');
  }

  const photoUrls = photoUrl ? [photoUrl] : [];

  return createSupportTicket({
    memberId,
    type: pendingType,
    description: pendingDesc,
    photoUrls,
  });
}

// ============================================================================
// ISSUE TYPE HELPERS
// ============================================================================

export function parseIssueTypeFromMessage(message) {
  const upperMessage = message.toUpperCase().trim();
  
  const typeMap = {
    'MISSING': ISSUE_TYPES.MISSING,
    'DAMAGE': ISSUE_TYPES.DAMAGE,
    'DAMAGED': ISSUE_TYPES.DAMAGE,
    'QUALITY': ISSUE_TYPES.QUALITY,
    'DELAY': ISSUE_TYPES.DELAY,
    'DELAYED': ISSUE_TYPES.DELAY,
    'LATE': ISSUE_TYPES.DELAY,
    'OTHER': ISSUE_TYPES.OTHER,
  };

  return typeMap[upperMessage] || null;
}

export function formatIssueTypeForDisplay(type) {
  return type || 'Other';
}

// ============================================================================
// PHOTO HANDLING
// ============================================================================

/**
 * Extract photo URL from Twilio message
 * Twilio sends media as NumMedia and MediaUrl0, MediaUrl1, etc.
 */
export function extractPhotoUrlsFromTwilio(body) {
  const urls = [];
  const numMedia = parseInt(body.NumMedia || '0', 10);
  
  for (let i = 0; i < numMedia; i++) {
    const url = body[`MediaUrl${i}`];
    if (url) {
      urls.push(url);
    }
  }
  
  return urls;
}

/**
 * Check if message contains photo
 */
export function messageHasPhoto(body) {
  const numMedia = parseInt(body.NumMedia || '0', 10);
  return numMedia > 0;
}

// ============================================================================
// FEEDBACK HANDLING
// ============================================================================

/**
 * Handle feedback response after pickup
 */
export async function handleFeedback(memberId, feedbackType) {
  // feedbackType: 'great', 'ok', 'bad'
  
  if (feedbackType === 'bad') {
    // Redirect to support flow
    return { redirect: 'support' };
  }

  // For 'great' and 'ok', just log and thank them
  // Could store feedback in Airtable for analytics

  return { 
    redirect: null,
    message: feedbackType === 'great' 
      ? 'Thanks for the feedback! 🎉 Glad you loved it!'
      : 'Thanks for letting us know. See you next time! 💪'
  };
}

export default {
  createSupportTicket,
  startSupportFlow,
  setPendingIssueType,
  setPendingDescription,
  completeTicketWithPhoto,
  parseIssueTypeFromMessage,
  extractPhotoUrlsFromTwilio,
  messageHasPhoto,
  handleFeedback,
};
