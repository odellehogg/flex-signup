import { NextResponse } from 'next/server';
import {
  getMemberByPhone, updateMember, createDrop, getActiveDropsByMember,
  validateBag, createIssue, normalizePhone, getGymById, getMemberDropsRemaining,
} from '@/lib/airtable';
import {
  sendMainMenu, sendDropGuide, sendInvalidBagNumber, sendDropConfirmed,
  sendNoDropsRemaining, sendDropStatus, sendSupportPrompt, sendSupportConfirmed,
  sendUnknownCommand, sendNotAMember, sendSubscriptionPaused, sendSubscriptionInactive,
  sendManageMenu, sendBillingLink, sendMessage, sendError,
  sendPickupConfirmedThanks,
} from '@/lib/whatsapp';
import { sendSupportTicketEmail } from '@/lib/email';
import { COMPANY, CONVERSATION_STATES, matchesCommand } from '@/lib/constants';
import { getDropsForPlan } from '@/lib/plans';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (
    searchParams.get('hub.mode') === 'subscribe' &&
    searchParams.get('hub.verify_token') === process.env.TWILIO_VERIFY_TOKEN
  ) {
    return new Response(searchParams.get('hub.challenge'), { status: 200 });
  }
  return NextResponse.json({ status: 'ok' });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const from = formData.get('From')?.replace('whatsapp:', '');
    const body = formData.get('Body')?.trim() || '';
    const numMedia = parseInt(formData.get('NumMedia') || '0');
    const mediaUrls = [];
    for (let i = 0; i < numMedia; i++) {
      const url = formData.get(`MediaUrl${i}`);
      if (url) mediaUrls.push(url);
    }
    if (!from) return NextResponse.json({ error: 'No sender' }, { status: 400 });

    const phone = normalizePhone(from);
    console.log(`[WhatsApp] From: ${phone} | Body: "${body}"`);

    const member = await getMemberByPhone(phone);
    if (!member) {
      await sendNotAMember(phone);
      return NextResponse.json({ status: 'unknown_user' });
    }

    const subStatusRaw = member.fields['Subscription Status'];
    const subStatus = typeof subStatusRaw === 'object' ? subStatusRaw?.name : subStatusRaw;

    // Cancelling = still within paid period, treat as Active
    if (subStatus !== 'Active' && subStatus !== 'Cancelling') {
      if (subStatus === 'Paused') {
        await sendSubscriptionPaused(phone);
      } else {
        // Cancelled, Past Due, unknown
        await sendSubscriptionInactive(phone);
      }
      return NextResponse.json({ status: 'inactive_member' });
    }

    const stateRaw = member.fields['Conversation State'];
    const state = (typeof stateRaw === 'object' ? stateRaw?.name : stateRaw) || CONVERSATION_STATES.IDLE;
    await handleMessage({ member, body, state, mediaUrls, phone });
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[WhatsApp] Error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

async function handleMessage({ member, body, state, mediaUrls, phone }) {
  const input = body.toUpperCase().trim();
  const firstName = member.fields['First Name'] || 'there';
  try {
    // MENU and CANCEL always reset to idle — works from any state
    if (matchesCommand(input, 'MENU') || matchesCommand(input, 'CANCEL')) {
      await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.IDLE });
      await sendMainMenu(phone, firstName);
      return;
    }
    switch (state) {
      case CONVERSATION_STATES.AWAITING_BAG:
        await handleAwaitingBag(member, input, phone);
        break;
      case CONVERSATION_STATES.AWAITING_SUPPORT:
        await handleAwaitingSupport(member, body, mediaUrls, phone);
        break;
      default:
        await handleIdleState(member, input, phone, firstName);
    }
  } catch (err) {
    console.error('[WhatsApp] Handler error:', err);
    await sendError(phone);
    await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.IDLE });
  }
}

async function handleIdleState(member, input, phone, firstName) {
  // Core commands — text + template button payloads (see WHATSAPP_COMMANDS in constants.js)
  if (matchesCommand(input, 'DROP')) { await startDropFlow(member, phone); return; }
  if (matchesCommand(input, 'STATUS')) { await showDropStatus(member, phone); return; }
  if (matchesCommand(input, 'SUPPORT')) { await startSupportFlow(member, phone); return; }

  // Subscription management
  if (matchesCommand(input, 'SUBSCRIPTION') || matchesCommand(input, 'BILLING') ||
      matchesCommand(input, 'PAUSE') || matchesCommand(input, 'RESUME')) {
    const planName = member.fields['Subscription Tier'] || 'Essential';
    const status = member.fields['Subscription Status'] || 'Active';
    await sendManageMenu(phone, planName, status);
    return;
  }

  // Post-pickup feedback buttons (flex_pickup_confirmed_thanks: "Great" / "OK" / "Not Good")
  if (matchesCommand(input, 'FEEDBACK_GREAT')) {
    await sendMessage(phone,
      `Brilliant! Really glad to hear it. 😊\n\n` +
      `Your fresh gear awaits — see you next session! 💪\n\n` +
      `Reply 1 to make your next drop.`
    );
    return;
  }
  if (matchesCommand(input, 'FEEDBACK_OK')) {
    await sendMessage(phone,
      `Thanks for letting us know. We're always looking to improve.\n\n` +
      `If anything wasn't quite right, reply HELP and we'll look into it.`
    );
    return;
  }
  if (matchesCommand(input, 'FEEDBACK_BAD')) {
    await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.AWAITING_SUPPORT });
    await sendSupportPrompt(phone);
    return;
  }

  // Pickup confirmed (flex_pickup_reminder / flex_pickup_confirm_request: "Yes, I've Collected")
  if (matchesCommand(input, 'PICKUP_CONFIRMED')) {
    await sendPickupConfirmedThanks(phone);
    return;
  }

  // Ready-notification response (flex_ready_pickup: "Got it")
  if (matchesCommand(input, 'ON_MY_WAY')) {
    await sendMessage(phone, `Great, see you soon! 👟\n\nJust ask reception for your FLEX bag.`);
    return;
  }

  // Bag not yet collected (flex_pickup_confirm_request: "Not Yet")
  if (matchesCommand(input, 'NEED_MORE_TIME')) {
    await sendMessage(phone,
      `No problem! Your bag will be held at reception for 7 days.\n\n` +
      `Reply STATUS anytime to check on your drop.`
    );
    return;
  }

  // Pause management buttons (flex_pause_reminder: "Keep Current" / "Extend pause")
  if (matchesCommand(input, 'KEEP_PAUSE')) {
    await sendMessage(phone,
      `All good — your subscription stays as is. ✅\n\n` +
      `Your FLEX will resume on the scheduled date.`
    );
    return;
  }
  if (matchesCommand(input, 'EXTEND_PAUSE')) {
    await sendMessage(phone,
      `To extend your pause, visit your billing portal:\n\n` +
      `${COMPANY.website}/portal\n\n` +
      `Or reply HELP and we'll sort it for you.`
    );
    return;
  }

  // Direct bag number entry: B042, 042, bag 42
  const bagMatch = input.match(/^(?:BAG\s*#?\s*)?B?-?0*(\d{1,4})$/i);
  if (bagMatch) {
    const normalizedInput = `B${bagMatch[1].padStart(3, '0')}`;
    const dropsRemaining = getMemberDropsRemaining(member.fields);
    if (dropsRemaining <= 0) { await sendNoDropsRemaining(phone); return; }
    await handleAwaitingBag(member, normalizedInput, phone);
    return;
  }

  // Polite acknowledgements
  const thankYouPatterns = /^(thanks?|thank\s*you|cheers|great|ok|okay|cool|got\s*it|perfect|ace|lovely|ta|nice|👍|👌|🙏|✅|😊)$/i;
  if (thankYouPatterns.test(input.trim())) {
    await sendMainMenu(phone, firstName);
    return;
  }

  // Empty or emoji-only messages
  if (!input || input.replace(/[\p{Emoji}\s]/gu, '').length === 0) {
    await sendMainMenu(phone, firstName);
    return;
  }

  await sendUnknownCommand(phone, firstName);
}

async function startDropFlow(member, phone) {
  const dropsRemaining = getMemberDropsRemaining(member.fields);
  if (dropsRemaining <= 0) { await sendNoDropsRemaining(phone); return; }
  const gymId = member.fields['Gym']?.[0];
  let gymName = 'your gym';
  if (gymId) {
    const g = await getGymById(gymId).catch(() => null);
    gymName = g?.fields?.Name || 'your gym';
  }
  await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.AWAITING_BAG });
  await sendDropGuide(phone, { gymName, dropsRemaining });
}

async function handleAwaitingBag(member, input, phone) {
  const validation = await validateBag(input);
  if (!validation.valid) {
    await sendInvalidBagNumber(phone, input, validation.error);
    return;
  }
  const { bag, bagNumber } = validation;
  const dropsRemaining = getMemberDropsRemaining(member.fields);
  if (dropsRemaining <= 0) {
    await sendNoDropsRemaining(phone);
    await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.IDLE });
    return;
  }
  const gymId = member.fields['Gym']?.[0];
  let gymName = 'your gym';
  if (gymId) {
    const g = await getGymById(gymId).catch(() => null);
    gymName = g?.fields?.Name || 'your gym';
  }
  await createDrop({ memberId: member.id, bagId: bag.id, bagNumber, gymId });
  const expectedReady = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const expectedDate = expectedReady.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short',
    timeZone: 'Europe/London',
  });
  const newDropsUsed = (member.fields['Drops Used'] || 0) + 1;
  const newDropsRemaining = Math.max(0, (member.fields['Drops Allowed'] || 0) - newDropsUsed);
  await updateMember(member.id, {
    'Drops Used': newDropsUsed,
    'Conversation State': CONVERSATION_STATES.IDLE,
  });
  await sendDropConfirmed(phone, { bagNumber, gymName, expectedDate, dropsRemaining: newDropsRemaining });
}

async function showDropStatus(member, phone) {
  const activeDrops = await getActiveDropsByMember(member);
  const dropsRemaining = getMemberDropsRemaining(member.fields);
  const dropsTotal = getDropsForPlan(member.fields['Subscription Tier'] || 'Essential');
  await sendDropStatus(phone, { activeDrops, dropsRemaining, dropsTotal });
}

async function startSupportFlow(member, phone) {
  await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.AWAITING_SUPPORT });
  await sendSupportPrompt(phone);
}

async function handleAwaitingSupport(member, message, mediaUrls, phone) {
  const firstName = member.fields['First Name'] || 'Member';
  const lastName = member.fields['Last Name'] || '';
  const email = member.fields['Email'];
  const issue = await createIssue({
    memberId: member.id,
    type: 'Other',
    description: message,
    photoUrls: mediaUrls,
  });
  const ticketId = issue.id.slice(-6).toUpperCase();
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
  } catch (e) {
    console.error('[WhatsApp] Support email failed:', e);
  }
  await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.IDLE });
  await sendSupportConfirmed(phone, { ticketId });
}
