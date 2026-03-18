import { NextResponse } from 'next/server';
import {
  getMemberByPhone, updateMember, createDrop, getActiveDropsByMember,
  validateBag, createIssue, normalizePhone, getGymById, getDropsRemaining,
  getDropsByMember,
} from '@/lib/airtable';
import {
  sendMainMenu, sendDropGuide, sendInvalidBagNumber, sendDropConfirmed,
  sendNoDropsRemaining, sendDropStatus, sendSupportPrompt, sendSupportConfirmed,
  sendUnknownCommand, sendNotAMember, sendError,
} from '@/lib/whatsapp';
import { sendSupportTicketEmail } from '@/lib/email';
import { CONVERSATION_STATES, matchesCommand } from '@/lib/constants';
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

    // FIX: correct field name is 'Subscription Status' not 'Status'
    const subStatus = member.fields['Subscription Status'];
    if (subStatus !== 'Active') {
      await sendNotAMember(phone);
      return NextResponse.json({ status: 'inactive_member' });
    }

    const state = member.fields['Conversation State'] || CONVERSATION_STATES.IDLE;
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
  if (matchesCommand(input, 'DROP')) { await startDropFlow(member, phone); return; }
  if (matchesCommand(input, 'STATUS')) { await showDropStatus(member, phone); return; }
  if (matchesCommand(input, 'SUPPORT')) { await startSupportFlow(member, phone); return; }
  // Allow direct bag number entry
  if (/^B?\d{1,4}$/i.test(input)) {
    await startDropFlow(member, phone);
    await handleAwaitingBag(member, input, phone);
    return;
  }
  await sendUnknownCommand(phone, firstName);
}

async function startDropFlow(member, phone) {
  // FIX: use getDropsRemaining helper (Drops Allowed - Drops Used)
  const dropsRemaining = getDropsRemaining(member.fields);
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
  // FIX: recompute remaining after validation
  const dropsRemaining = getDropsRemaining(member.fields);
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
  const expectedReady = new Date();
  expectedReady.setHours(expectedReady.getHours() + 48);
  const expectedDate = expectedReady.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short',
  });
  // FIX: increment 'Drops Used' (not non-existent 'Drops Remaining')
  await updateMember(member.id, {
    'Drops Used': (member.fields['Drops Used'] || 0) + 1,
    'Conversation State': CONVERSATION_STATES.IDLE,
  });
  await sendDropConfirmed(phone, { bagNumber, gymName, expectedDate });
}

async function showDropStatus(member, phone) {
  const activeDrops = await getActiveDropsByMember(member.id);
  // FIX: correct computation
  const dropsRemaining = getDropsRemaining(member.fields);
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
    type: 'Support Request',
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
