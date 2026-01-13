// app/api/webhooks/whatsapp/route.js
// ============================================================================
// WHATSAPP WEBHOOK HANDLER
// MVP VERSION - 3 states: idle, awaiting_bag, awaiting_support
// ============================================================================

import { NextResponse } from 'next/server';
import { 
  getMemberByPhone, 
  updateMember, 
  createDrop, 
  getActiveDropsByMember,
  validateBag,
  createIssue,
  normalizePhone,
  getGymById,
} from '@/lib/airtable';
import { 
  sendMainMenu,
  sendDropGuide,
  sendInvalidBagNumber,
  sendDropConfirmed,
  sendNoDropsRemaining,
  sendDropStatus,
  sendSupportPrompt,
  sendSupportConfirmed,
  sendUnknownCommand,
  sendNotAMember,
  sendError,
} from '@/lib/whatsapp';
import { sendSupportTicketEmail } from '@/lib/email';
import { CONVERSATION_STATES, matchesCommand } from '@/lib/constants';
import { getDropsForPlan } from '@/lib/plans';

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

export async function GET(request) {
  // Twilio webhook verification (if needed)
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.TWILIO_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ status: 'ok' });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Extract message data from Twilio
    const from = formData.get('From')?.replace('whatsapp:', '');
    const body = formData.get('Body')?.trim() || '';
    const numMedia = parseInt(formData.get('NumMedia') || '0');

    // Extract media URLs if any
    const mediaUrls = [];
    for (let i = 0; i < numMedia; i++) {
      const url = formData.get(`MediaUrl${i}`);
      if (url) mediaUrls.push(url);
    }

    if (!from) {
      return NextResponse.json({ error: 'No sender' }, { status: 400 });
    }

    const phone = normalizePhone(from);
    console.log(`[WhatsApp] From: ${phone} | Message: "${body}" | Media: ${numMedia}`);

    // Get member
    const member = await getMemberByPhone(phone);
    
    if (!member) {
      await sendNotAMember(phone);
      return NextResponse.json({ status: 'unknown_user' });
    }

    // Check member status
    if (member.fields['Status'] !== 'Active') {
      await sendNotAMember(phone);
      return NextResponse.json({ status: 'inactive_member' });
    }

    // Handle message based on conversation state
    const state = member.fields['Conversation State'] || CONVERSATION_STATES.IDLE;
    await handleMessage({ member, body, state, mediaUrls, phone });

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[WhatsApp] Webhook error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

async function handleMessage({ member, body, state, mediaUrls, phone }) {
  const input = body.toUpperCase().trim();
  const firstName = member.fields['First Name'] || 'there';

  console.log(`[WhatsApp] Handling | State: ${state} | Input: ${input}`);

  try {
    // Check for MENU/cancel commands first (works in any state)
    if (matchesCommand(input, 'MENU') || matchesCommand(input, 'CANCEL')) {
      await resetToIdle(member);
      await sendMainMenu(phone, firstName);
      return;
    }

    // Handle based on current state
    switch (state) {
      case CONVERSATION_STATES.AWAITING_BAG:
        await handleAwaitingBag(member, input, phone);
        break;

      case CONVERSATION_STATES.AWAITING_SUPPORT:
        await handleAwaitingSupport(member, body, mediaUrls, phone);
        break;

      case CONVERSATION_STATES.IDLE:
      default:
        await handleIdleState(member, input, phone, firstName);
        break;
    }
  } catch (error) {
    console.error('[WhatsApp] Handler error:', error);
    await sendError(phone);
    await resetToIdle(member);
  }
}

// ============================================================================
// STATE: IDLE (Main Menu)
// ============================================================================

async function handleIdleState(member, input, phone, firstName) {
  // Handle DROP command
  if (matchesCommand(input, 'DROP')) {
    await startDropFlow(member, phone);
    return;
  }

  // Handle STATUS command
  if (matchesCommand(input, 'STATUS')) {
    await showDropStatus(member, phone);
    return;
  }

  // Handle SUPPORT command
  if (matchesCommand(input, 'SUPPORT')) {
    await startSupportFlow(member, phone);
    return;
  }

  // Check if input looks like a bag number (user skipping the menu)
  if (/^B?\d{1,4}$/i.test(input)) {
    // They might be trying to start a drop directly
    await startDropFlow(member, phone);
    // Then process the bag number
    await handleAwaitingBag(member, input, phone);
    return;
  }

  // Unrecognized input - show menu
  await sendUnknownCommand(phone, firstName);
}

// ============================================================================
// DROP FLOW
// ============================================================================

async function startDropFlow(member, phone) {
  const dropsRemaining = member.fields['Drops Remaining'] || 0;
  
  // Check if they have drops remaining
  if (dropsRemaining <= 0) {
    await sendNoDropsRemaining(phone);
    return;
  }

  // Get gym name
  const gymId = member.fields['Gym']?.[0];
  let gymName = 'your gym';
  if (gymId) {
    const gym = await getGymById(gymId);
    gymName = gym?.fields['Name'] || 'your gym';
  }

  // Set state to awaiting bag number
  await updateMember(member.id, { 
    'Conversation State': CONVERSATION_STATES.AWAITING_BAG 
  });

  // Send drop guide
  await sendDropGuide(phone, { gymName, dropsRemaining });
}

async function handleAwaitingBag(member, input, phone) {
  // Validate bag number
  const validation = await validateBag(input);

  if (!validation.valid) {
    await sendInvalidBagNumber(phone, input, validation.error);
    return;
  }

  const { bag, bagNumber } = validation;
  const dropsRemaining = member.fields['Drops Remaining'] || 0;

  // Double-check drops remaining (in case it changed)
  if (dropsRemaining <= 0) {
    await sendNoDropsRemaining(phone);
    await resetToIdle(member);
    return;
  }

  // Get gym info
  const gymId = member.fields['Gym']?.[0];
  let gymName = 'your gym';
  if (gymId) {
    const gym = await getGymById(gymId);
    gymName = gym?.fields['Name'] || 'your gym';
  }

  // Create the drop
  const drop = await createDrop({
    memberId: member.id,
    bagId: bag.id,
    bagNumber: bagNumber,
    gymId: gymId,
  });

  // Calculate expected ready date
  const expectedReady = new Date();
  expectedReady.setHours(expectedReady.getHours() + 48);
  const expectedDate = expectedReady.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'short' 
  });

  // Update member: decrement drops, reset state
  await updateMember(member.id, {
    'Drops Remaining': dropsRemaining - 1,
    'Total Drops': (member.fields['Total Drops'] || 0) + 1,
    'Conversation State': CONVERSATION_STATES.IDLE,
  });

  // Send confirmation
  await sendDropConfirmed(phone, {
    bagNumber,
    gymName,
    expectedDate,
  });

  console.log(`[WhatsApp] Drop created: ${drop.id} | Bag: ${bagNumber} | Member: ${member.id}`);
}

// ============================================================================
// STATUS FLOW
// ============================================================================

async function showDropStatus(member, phone) {
  // Get active drops
  const activeDrops = await getActiveDropsByMember(member.id);

  // Get drops info
  const dropsRemaining = member.fields['Drops Remaining'] || 0;
  const plan = member.fields['Subscription Tier'] || 'Essential';
  const dropsTotal = getDropsForPlan(plan);

  await sendDropStatus(phone, {
    activeDrops,
    dropsRemaining,
    dropsTotal,
  });
}

// ============================================================================
// SUPPORT FLOW
// ============================================================================

async function startSupportFlow(member, phone) {
  // Set state to awaiting support message
  await updateMember(member.id, { 
    'Conversation State': CONVERSATION_STATES.AWAITING_SUPPORT 
  });

  await sendSupportPrompt(phone);
}

async function handleAwaitingSupport(member, message, mediaUrls, phone) {
  const firstName = member.fields['First Name'] || 'Member';
  const lastName = member.fields['Last Name'] || '';
  const email = member.fields['Email'];

  // Create the issue in Airtable
  const issue = await createIssue({
    memberId: member.id,
    type: 'Support Request',
    description: message,
    photoUrls: mediaUrls,
  });

  // Generate a simple ticket ID (last 6 chars of Airtable ID)
  const ticketId = issue.id.slice(-6).toUpperCase();

  // Send email to support (which becomes the support thread)
  try {
    await sendSupportTicketEmail({
      to: process.env.SUPPORT_EMAIL || 'support@flexlaundry.co.uk',
      replyTo: email,
      memberName: `${firstName} ${lastName}`.trim(),
      memberEmail: email,
      memberPhone: phone,
      ticketId,
      description: message,
      hasPhoto: mediaUrls.length > 0,
    });
  } catch (emailError) {
    console.error('[WhatsApp] Failed to send support email:', emailError);
    // Continue anyway - ticket is created in Airtable
  }

  // Reset state
  await resetToIdle(member);

  // Send confirmation
  await sendSupportConfirmed(phone, { ticketId });

  console.log(`[WhatsApp] Support ticket created: ${ticketId} | Member: ${member.id}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function resetToIdle(member) {
  await updateMember(member.id, { 
    'Conversation State': CONVERSATION_STATES.IDLE 
  });
}
