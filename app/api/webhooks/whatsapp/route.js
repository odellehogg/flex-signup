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
import { sendSupportTicketEmail, sendCustomerSupportConfirmationEmail } from '@/lib/email';
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

    // Handle both string ("Active") and object ({name: "Active"}) formats from Airtable
    const subStatusRaw = member.fields['Subscription Status'];
    const subStatus = typeof subStatusRaw === 'object' ? subStatusRaw?.name : subStatusRaw;

    // Cancelling = still within their paid period, treat as Active
    if (subStatus !== 'Active' && subStatus !== 'Cancelling') {
      if (subStatus === 'Paused') {
        await sendSubscriptionPaused(phone);
      } else {
        await sendSubscriptionInactive(phone);
      }
      return NextResponse.json({ status: 'inactive_member' });
    }

    // Handle both string and object formats for Conversation State
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
  // Core drop/status/support commands (text + template button payloads)
  if (matchesCommand(input, 'DROP')) { await startDropFlow(member, phone); return; }
  if (matchesCommand(input, 'STATUS')) { await showDropStatus(member, phone); return; }
  if (matchesCommand(input, 'SUPPORT')) { await startSupportFlow(member, phone); return; }

  // Add-on drop purchase
  if (matchesCommand(input, 'EXTRA_DROP')) {
    await handleAddonDrop(member, phone);
    return;
  }

  // Subscription management — send portal link (no full sub management via WhatsApp yet)
  if (matchesCommand(input, 'SUBSCRIPTION') || matchesCommand(input, 'BILLING') ||
      matchesCommand(input, 'PAUSE') || matchesCommand(input, 'RESUME')) {
    const planName = member.fields['Subscription Tier'] || 'Essential';
    const status = member.fields['Subscription Status'] || 'Active';
    await sendManageMenu(phone, planName, status);
    return;
  }

  // Post-pickup feedback buttons (from flex_pickup_confirmed_thanks: "Great" / "OK" / "Not Good")
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

  // Pickup confirmed (from flex_pickup_reminder / flex_pickup_confirm_request: "Yes, I've Collected")
  if (matchesCommand(input, 'PICKUP_CONFIRMED')) {
    await sendPickupConfirmedThanks(phone);
    return;
  }

  // Ready-notification response (from flex_ready_pickup: "Got it")
  if (matchesCommand(input, 'ON_MY_WAY')) {
    await sendMessage(phone, `Great, see you soon! 👟\n\nJust ask reception for your FLEX bag.`);
    return;
  }

  // Bag not yet collected (from flex_pickup_confirm_request: "Not Yet")
  if (matchesCommand(input, 'NEED_MORE_TIME')) {
    await sendMessage(phone,
      `No problem! Your bag will be held at reception for 7 days.\n\n` +
      `Reply STATUS anytime to check on your drop.`
    );
    return;
  }

  // Pause management buttons (from flex_pause_reminder: "Keep Current" / "Extend pause")
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

  // Allow direct bag number entry in various formats: B042, 042, bag 42
  const bagMatch = input.match(/^(?:BAG\s*#?\s*)?B?-?0*(\d{1,4})$/i);
  if (bagMatch) {
    const normalizedInput = `B${bagMatch[1].padStart(3, '0')}`;
    const dropsRemaining = getMemberDropsRemaining(member.fields);
    if (dropsRemaining <= 0) { await sendNoDropsRemaining(phone); return; }
    await handleAwaitingBag(member, normalizedInput, phone);
    return;
  }

  // Polite acknowledgements — just show menu, don't say "I didn't catch that"
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
  let drop;
  try {
    drop = await createDrop({ memberId: member.id, bagId: bag.id, bagNumber, gymId });
  } catch (err) {
    console.error('[WhatsApp] createDrop failed, not incrementing Drops Used:', err);
    throw err;
  }

  const newDropsUsed = (member.fields['Drops Used'] || 0) + 1;
  const newDropsRemaining = Math.max(0, (member.fields['Drops Allowed'] || 0) - newDropsUsed);
  try {
    await updateMember(member.id, {
      'Drops Used': newDropsUsed,
      'Conversation State': CONVERSATION_STATES.IDLE,
    });
  } catch (err) {
    console.error(`[WhatsApp] CRITICAL: Drop ${drop.id} created but Drops Used failed to update for member ${member.id}:`, err);
    throw err;
  }

  const expectedReady = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const expectedDate = expectedReady.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short',
    timeZone: 'Europe/London',
  });
  await sendDropConfirmed(phone, { bagNumber, gymName, expectedDate, dropsRemaining: newDropsRemaining });

  // Low-drop nudge: ≤2 drops left AND >7 days remain in the month
  if (newDropsRemaining <= 2 && newDropsRemaining > 0) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    if (daysLeft > 7) {
      const plural = newDropsRemaining === 1 ? 'drop' : 'drops';
      await sendMessage(phone,
        `Heads up — you have *${newDropsRemaining} ${plural}* left this month with *${daysLeft} days* still to go. 💚\n\n` +
        `Need more? Add an extra drop for *£4* anytime:\n${COMPANY.website}/portal\n\n` +
        `Or reply *EXTRA DROP* and we'll send you a payment link straight away.`
      ).catch(e => console.error('[WhatsApp] Low-drop nudge failed:', e));
    }
  }
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

  // Convert raw Twilio media URLs to our proxy endpoint so they're viewable
  // in Airtable without needing Twilio Basic Auth credentials.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.flexlaundry.co.uk';
  const proxyUrls = mediaUrls.map(
    (url) => `${baseUrl}/api/media/twilio?url=${encodeURIComponent(url)}`
  );

  const issue = await createIssue({
    memberId: member.id,
    type: 'Other',
    description: message,
    photoUrls: proxyUrls,
  });
  const ticketId = issue.id.slice(-6).toUpperCase();

  // Send notification email to FLEX ops inbox
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
    console.log(`[WhatsApp] Ops support email sent for ticket #${ticketId}`);
  } catch (e) {
    console.error('[WhatsApp] Ops support email failed:', e.message || e);
  }

  // Send confirmation email to the customer
  if (email) {
    try {
      await sendCustomerSupportConfirmationEmail({
        to: email,
        firstName,
        ticketId,
        description: message,
        hasPhoto: mediaUrls.length > 0,
      });
      console.log(`[WhatsApp] Customer support confirmation email sent to ${email} for ticket #${ticketId}`);
    } catch (e) {
      console.error('[WhatsApp] Customer confirmation email failed:', e.message || e);
    }
  } else {
    console.warn(`[WhatsApp] No email address on file for member ${member.id} — skipping customer confirmation email`);
  }

  await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.IDLE });
  await sendSupportConfirmed(phone, { ticketId });
}

async function handleAddonDrop(member, phone) {
  const tier = member.fields['Subscription Tier'] || '';
  const firstName = member.fields['First Name'] || 'there';

  // Only Essential members can buy add-on drops
  if (!tier.toLowerCase().includes('essential')) {
    await sendMessage(phone,
      `Hi ${firstName}! Add-on drops are available for Essential plan members only. 🌿\n\n` +
      `To upgrade your plan, visit:\n${COMPANY.website}/pricing\n\n` +
      `Or reply MENU to go back.`
    );
    return;
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { PLANS } = await import('@/lib/plans');
    const addonPlan = PLANS['Addon Drop'];
    const stripeCustomerId = member.fields['Stripe Customer ID'];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId || undefined,
      customer_email: stripeCustomerId ? undefined : member.fields['Email'],
      line_items: [{ price: addonPlan.stripePriceId, quantity: 1 }],
      metadata: {
        type: 'addon_drop',
        memberId: member.id,
        phone: phone,
        firstName,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/portal?addon=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/portal`,
    });

    await sendMessage(phone,
      `Hey ${firstName}! Here's your link to add an extra drop for £4 💚\n\n` +
      `${session.url}\n\n` +
      `Your drop will be added as soon as payment is confirmed. ` +
      `Link expires in 24 hours.\n\nReply MENU to go back.`
    );
  } catch (err) {
    console.error('[WhatsApp] Addon drop error:', err);
    await sendMessage(phone,
      `Sorry ${firstName}, something went wrong. Please try again or visit ${COMPANY.website}/portal to buy an extra drop.`
    );
  }
}
