import { NextResponse } from 'next/server';
import { 
  getMemberByPhone, 
  updateMember, 
  createDrop, 
  getActiveDropsByMember,
  normalizePhone 
} from '@/lib/airtable';
import { 
  sendMainMenu,
  sendDropGuide,
  sendAwaitingBagNumber,
  sendInvalidBagNumber,
  sendDropConfirmed,
  sendCheckDrops,
  sendTrackingStatus,
  sendManageMenu,
  sendSupportMenu,
  sendBillingLink
} from '@/lib/whatsapp';
import { 
  startSupportFlow, 
  setPendingIssueType, 
  setPendingDescription,
  completeTicketWithPhoto,
  messageHasPhoto,
  extractPhotoUrlsFromTwilio
} from '@/lib/support';
import { pauseSubscription, resumeSubscription, createPortalSession } from '@/lib/stripe-helpers';
import { CONVERSATION_STATES, BUTTON_PAYLOADS } from '@/lib/constants';

export async function GET(request) {
  // Twilio webhook verification
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
    const buttonPayload = formData.get('ButtonPayload') || '';
    const numMedia = parseInt(formData.get('NumMedia') || '0');

    if (!from) {
      return NextResponse.json({ error: 'No sender' }, { status: 400 });
    }

    const phone = normalizePhone(from);
    console.log(`WhatsApp from ${phone}: "${body}" | button: "${buttonPayload}" | media: ${numMedia}`);

    // Get member
    const member = await getMemberByPhone(phone);
    
    if (!member) {
      // Unknown number - send signup prompt
      await sendUnknownUserMessage(phone);
      return NextResponse.json({ status: 'unknown_user' });
    }

    const state = member.fields['Conversation State'] || CONVERSATION_STATES.ACTIVE;
    
    // Handle based on state and input
    await handleMessage(member, body, buttonPayload, numMedia, formData);

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

async function handleMessage(member, body, buttonPayload, numMedia, formData) {
  const phone = member.fields['Phone Number'];
  const state = member.fields['Conversation State'] || CONVERSATION_STATES.ACTIVE;
  const input = buttonPayload || body.toUpperCase();

  console.log(`Handling message for ${phone}, state: ${state}, input: ${input}`);

  // Check for photo in support flow
  if (numMedia > 0 && state === CONVERSATION_STATES.AWAITING_ISSUE_PHOTO) {
    const photoUrls = extractPhotoUrlsFromTwilio(formData, numMedia);
    await completeTicketWithPhoto(member, photoUrls);
    return;
  }

  // State machine
  switch (state) {
    case CONVERSATION_STATES.AWAITING_BAG_NUMBER:
      await handleBagNumberInput(member, body);
      break;

    case CONVERSATION_STATES.AWAITING_ISSUE_TYPE:
      await handleIssueTypeInput(member, body);
      break;

    case CONVERSATION_STATES.AWAITING_ISSUE_DESCRIPTION:
      await handleIssueDescriptionInput(member, body, numMedia > 0);
      break;

    default:
      await handleActiveState(member, input);
  }
}

async function handleActiveState(member, input) {
  const phone = member.fields['Phone Number'];

  // Handle button payloads and text commands
  switch (input) {
    // Main menu triggers
    case BUTTON_PAYLOADS.MAIN_MENU:
    case 'MENU':
    case 'HI':
    case 'HELLO':
    case 'HEY':
    case 'START':
      await sendMainMenu(phone, member.fields['First Name']);
      break;

    // Start drop flow
    case BUTTON_PAYLOADS.START_DROP:
    case 'DROP':
    case '1':
      await handleStartDrop(member);
      break;

    // Track order
    case BUTTON_PAYLOADS.TRACK_ORDER:
    case 'TRACK':
    case '2':
      await handleTrackOrder(member);
      break;

    // Check drops remaining
    case BUTTON_PAYLOADS.CHECK_DROPS:
    case 'DROPS':
    case '3':
      await handleCheckDrops(member);
      break;

    // Manage subscription
    case BUTTON_PAYLOADS.MANAGE_SUB:
    case 'MANAGE':
    case '4':
      await sendManageMenu(phone);
      break;

    // Support/Help
    case BUTTON_PAYLOADS.HELP:
    case BUTTON_PAYLOADS.SUPPORT:
    case 'HELP':
    case 'SUPPORT':
    case '5':
      await sendSupportMenu(phone);
      break;

    // Pause subscription
    case BUTTON_PAYLOADS.PAUSE:
    case 'PAUSE':
      await handlePause(member);
      break;

    // Resume subscription
    case BUTTON_PAYLOADS.RESUME:
    case 'RESUME':
      await handleResume(member);
      break;

    // Billing portal
    case BUTTON_PAYLOADS.BILLING:
    case 'BILLING':
      await handleBilling(member);
      break;

    // Report issue
    case BUTTON_PAYLOADS.REPORT_ISSUE:
    case 'ISSUE':
    case 'PROBLEM':
      await startSupportFlow(member);
      break;

    // How it works
    case BUTTON_PAYLOADS.HOW_IT_WORKS:
    case 'HOW':
      await sendHowItWorks(phone);
      break;

    default:
      // Check if it looks like a bag number
      if (/^B?\d{1,4}$/i.test(input)) {
        await handleBagNumberInput(member, input);
      } else {
        // Send main menu for unrecognized input
        await sendMainMenu(phone, member.fields['First Name']);
      }
  }
}

async function handleStartDrop(member) {
  const phone = member.fields['Phone Number'];
  const dropsRemaining = member.fields['Drops Remaining'] || 0;

  if (dropsRemaining <= 0) {
    await sendNoDropsRemaining(phone);
    return;
  }

  const gymName = member.fields['Gym Name'] || 'your gym';
  await sendDropGuide(phone, gymName);
  await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.AWAITING_BAG_NUMBER });
}

async function handleBagNumberInput(member, input) {
  const phone = member.fields['Phone Number'];
  
  // Parse bag number - accept "B123", "123", "b123"
  const bagMatch = input.match(/^B?(\d{1,4})$/i);
  
  if (!bagMatch) {
    await sendInvalidBagNumber(phone);
    return;
  }

  const bagNumber = `B${bagMatch[1].padStart(3, '0')}`;

  // Check drops remaining
  const dropsRemaining = member.fields['Drops Remaining'] || 0;
  if (dropsRemaining <= 0) {
    await sendNoDropsRemaining(phone);
    await updateMember(member.id, { 'Conversation State': CONVERSATION_STATES.ACTIVE });
    return;
  }

  // Create the drop
  const gymName = member.fields['Gym Name'] || 'your gym';
  const expectedReady = new Date();
  expectedReady.setHours(expectedReady.getHours() + 48);

  await createDrop({
    'Member': [member.id],
    'Bag Number': bagNumber,
    'Status': 'Dropped',
    'Drop Date': new Date().toISOString().split('T')[0],
    'Expected Ready': expectedReady.toISOString().split('T')[0],
  });

  // Decrement drops
  await updateMember(member.id, {
    'Drops Remaining': dropsRemaining - 1,
    'Conversation State': CONVERSATION_STATES.ACTIVE,
    'Total Drops': (member.fields['Total Drops'] || 0) + 1,
  });

  // Send confirmation
  await sendDropConfirmed(phone, {
    bagNumber,
    gymName,
    expectedDate: expectedReady.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }),
  });
}

async function handleTrackOrder(member) {
  const phone = member.fields['Phone Number'];
  const drops = await getActiveDropsByMember(member.id);

  if (drops.length === 0) {
    await sendTrackingStatus(phone, null);
  } else {
    // Send status of most recent drop
    const latestDrop = drops[0];
    await sendTrackingStatus(phone, {
      bagNumber: latestDrop.fields['Bag Number'],
      status: latestDrop.fields['Status'],
      expectedReady: latestDrop.fields['Expected Ready'],
    });
  }
}

async function handleCheckDrops(member) {
  const phone = member.fields['Phone Number'];
  const dropsRemaining = member.fields['Drops Remaining'] || 0;
  const plan = member.fields['Subscription Tier'] || 'Unknown';
  
  await sendCheckDrops(phone, {
    dropsRemaining,
    plan,
  });
}

async function handlePause(member) {
  const phone = member.fields['Phone Number'];
  const subscriptionId = member.fields['Stripe Subscription ID'];

  if (!subscriptionId) {
    await sendPlainText(phone, "You don't have an active subscription to pause.");
    return;
  }

  try {
    await pauseSubscription(subscriptionId);
    await updateMember(member.id, { 'Status': 'Paused' });
    await sendPauseConfirmed(phone);
  } catch (err) {
    console.error('Failed to pause subscription:', err);
    await sendPlainText(phone, "Sorry, couldn't pause your subscription. Please try again or contact support.");
  }
}

async function handleResume(member) {
  const phone = member.fields['Phone Number'];
  const subscriptionId = member.fields['Stripe Subscription ID'];

  if (!subscriptionId) {
    await sendPlainText(phone, "You don't have a paused subscription to resume.");
    return;
  }

  try {
    await resumeSubscription(subscriptionId);
    await updateMember(member.id, { 'Status': 'Active' });
    await sendResumeConfirmed(phone);
  } catch (err) {
    console.error('Failed to resume subscription:', err);
    await sendPlainText(phone, "Sorry, couldn't resume your subscription. Please try again or contact support.");
  }
}

async function handleBilling(member) {
  const phone = member.fields['Phone Number'];
  const customerId = member.fields['Stripe Customer ID'];

  if (!customerId) {
    await sendPlainText(phone, "No billing account found. Please contact support.");
    return;
  }

  try {
    const session = await createPortalSession(customerId);
    await sendBillingLink(phone, session.url);
  } catch (err) {
    console.error('Failed to create portal session:', err);
    await sendPlainText(phone, "Sorry, couldn't access billing. Please try again.");
  }
}

async function handleIssueTypeInput(member, input) {
  await setPendingIssueType(member, input);
}

async function handleIssueDescriptionInput(member, input, hasPhoto) {
  await setPendingDescription(member, input, hasPhoto);
}

// Helper functions for sending messages
async function sendUnknownUserMessage(phone) {
  const { sendPlainTextMessage } = await import('@/lib/whatsapp');
  await sendPlainTextMessage(phone, 
    "Hi! 👋 I don't recognise this number. To use FLEX, please sign up at flexlaundry.co.uk\n\nAlready a member? Make sure you're messaging from the phone number you signed up with."
  );
}

async function sendNoDropsRemaining(phone) {
  const { sendPlainTextMessage } = await import('@/lib/whatsapp');
  await sendPlainTextMessage(phone,
    "You've used all your drops this month! 😅\n\nYour drops will reset on your next billing date. Want to upgrade your plan for more drops? Reply MANAGE to see options."
  );
}

async function sendHowItWorks(phone) {
  const { sendPlainTextMessage } = await import('@/lib/whatsapp');
  await sendPlainTextMessage(phone,
    "🏋️ *How FLEX Works*\n\n" +
    "1️⃣ Drop your sweaty gym clothes in a FLEX bag at your gym\n\n" +
    "2️⃣ We collect and wash with activewear-safe products\n\n" +
    "3️⃣ Pick up fresh clothes from reception within 48 hours\n\n" +
    "That's it! No washing, no waiting.\n\n" +
    "Reply 1 to start a drop, or MENU for more options."
  );
}

async function sendPauseConfirmed(phone) {
  const { sendPlainTextMessage } = await import('@/lib/whatsapp');
  await sendPlainTextMessage(phone,
    "✅ *Subscription Paused*\n\n" +
    "Your FLEX subscription is now paused. You won't be charged until you resume.\n\n" +
    "Reply RESUME when you're ready to start again!"
  );
}

async function sendResumeConfirmed(phone) {
  const { sendPlainTextMessage } = await import('@/lib/whatsapp');
  await sendPlainTextMessage(phone,
    "✅ *Welcome Back!*\n\n" +
    "Your FLEX subscription is now active again. Your drops are ready to use!\n\n" +
    "Reply 1 to make a drop, or MENU for more options."
  );
}

async function sendPlainText(phone, message) {
  const { sendPlainTextMessage } = await import('@/lib/whatsapp');
  await sendPlainTextMessage(phone, message);
}
