// lib/constants.js
// ============================================================================
// CORRECTED TO MATCH ACTUAL AIRTABLE SINGLE SELECT OPTIONS
//
// Conversation State actual values (from Airtable schema):
//   idle, awaiting_bag, awaiting_bag_number, awaiting_support_desc,
//   awaiting_issue, main_menu, etc.
//
// Subscription Status actual values:
//   Active, Paused, Cancelled, Past Due, Cancelling
//   (NOTE: 'Pending' does NOT exist — use 'Active' for new signups)
// ============================================================================

export const COMPANY = {
  name: 'FLEX',
  legalName: 'Connectedbycommerce LTD',
  tradingAs: 'FLEX',
  tagline: 'Sweat Less, Live More',
  email: 'hello@flexlaundry.co.uk',
  supportEmail: 'support@flexlaundry.co.uk',
  phone: '+447366907286',
  phoneFormatted: '+44 7366 907286',
  website: 'https://flexlaundry.co.uk',
  address: {
    line1: 'Dublin, Ireland',
    country: 'Ireland',
  },
};

export const TABLES = {
  MEMBERS: 'Members',
  DROPS: 'Drops',
  GYMS: 'Gyms',
  BAGS: 'Bags',
  ISSUES: 'Issues',
  PLANS: 'Plans',
  CONTENT: 'Content',
  CONFIG: 'Config',
  GYM_INTEREST: 'Gym Interest',
};

export const DROP_STATUSES = {
  DROPPED: 'Dropped',
  PROCESSING: 'Processing',
  READY: 'Ready',
  COLLECTED: 'Collected',
};

export const DROP_STATUS_EMOJI = {
  'Dropped': '📥',
  'Processing': '🧺',
  'Ready': '✅',
  'Collected': '👕',
};

export const DROP_STATUS_DESCRIPTION = {
  'Dropped': 'We have your bag',
  'Processing': 'Being cleaned',
  'Ready': 'Ready for pickup',
  'Collected': 'Picked up',
};

export const BAG_STATUSES = {
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  RETIRED: 'Retired',
};

// ✅ CORRECTED: match actual Subscription Status single-select options in Airtable
// Note: 'Pending' does NOT exist in Airtable — removed
export const MEMBER_STATUSES = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
  PAST_DUE: 'Past Due',
  CANCELLING: 'Cancelling',
};

export const ISSUE_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export const ISSUE_TYPES = [
  'Missing Item',
  'Damaged Item',
  'Wrong Bag',
  'Late Delivery',
  'Quality Issue',
  'Billing Issue',
  'Other',
];

export const SUBSCRIPTION_TIERS = {
  PAY_AS_YOU_GO: 'Pay As You Go',
  ESSENTIAL: 'Essential',
  UNLIMITED: 'Unlimited',
};

// ✅ CORRECTED: match actual Conversation State single-select options in Airtable
export const CONVERSATION_STATES = {
  IDLE: 'idle',
  AWAITING_BAG: 'awaiting_bag',
  AWAITING_SUPPORT: 'awaiting_support_desc',
};

export const WHATSAPP_COMMANDS = {
  // Standard text commands + template button payloads
  // IMPORTANT: These arrays must include BOTH machine codes AND the exact button text
  // from Twilio templates (normalised to UPPERCASE), since Twilio sends the button
  // "ID" field as the Body when a user taps a quick-reply button.
  MENU: ['MENU', 'HI', 'HELLO', 'HEY', 'HOME', '0', 'MAIN_MENU', 'MAIN MENU'],
  DROP: ['DROP', '1', 'NEW', 'START_DROP', 'HOW_IT_WORKS', 'START A DROP'],
  STATUS: ['STATUS', '2', 'TRACK', 'CHECK', 'DROPS', 'TRACK_ORDER', 'CHECK_DROPS', 'TRACK ORDER'],
  SUPPORT: ['HELP', '3', 'SUPPORT', 'ISSUE', 'PROBLEM', 'REPORT_ISSUE', 'NEED HELP', 'NEED_HELP'],
  CANCEL: ['CANCEL', 'BACK', 'NEVER MIND', 'NEVER_MIND'],
  // Subscription management buttons
  SUBSCRIPTION: ['MANAGE_SUBSCRIPTION', 'MANAGE', 'MY_PLAN'],
  BILLING: ['BILLING', 'PAYMENT', 'INVOICE'],
  PAUSE: ['PAUSE_SUBSCRIPTION', 'PAUSE'],
  RESUME: ['RESUME_SUBSCRIPTION', 'RESUME'],
  // Post-pickup feedback buttons (flex_pickup_confirmed_thanks: "Great", "OK", "Not Good")
  FEEDBACK_GREAT: ['FEEDBACK_GREAT', 'GREAT'],
  FEEDBACK_OK: ['FEEDBACK_OK', 'OK'],
  FEEDBACK_BAD: ['FEEDBACK_BAD', 'NOT_HAPPY', 'NOT GOOD'],
  // Ready-notification response buttons (flex_ready_pickup: "Got it")
  ON_MY_WAY: ['ON_MY_WAY', 'GOT IT', 'GOT_IT'],
  // Bag still ready but user hasn't collected (flex_pickup_confirm_request: "Not Yet")
  NEED_MORE_TIME: ['NEED_MORE_TIME', 'NOT YET', 'NOT_YET'],
  // Pickup confirmed (flex_pickup_reminder + flex_pickup_confirm_request: "Yes, I've Collected")
  PICKUP_CONFIRMED: ["YES, I'VE COLLECTED", "YES I'VE COLLECTED", 'YES_COLLECTED', 'COLLECTED'],
  // Pause management (flex_pause_reminder: "Keep Current", "Extend pause")
  KEEP_PAUSE: ['KEEP CURRENT', 'KEEP_CURRENT'],
  EXTEND_PAUSE: ['EXTEND PAUSE', 'EXTEND_PAUSE'],
  // Add-on drop purchase
  EXTRA_DROP: ['EXTRA_DROP', 'EXTRA DROP', 'TOP_UP', 'TOP UP', 'TOPUP', 'ADD_DROP', 'ADD DROP', 'MORE_DROPS', 'MORE DROPS'],
};

export function matchesCommand(input, commandType) {
  const normalized = (input || '').toUpperCase().trim();
  return WHATSAPP_COMMANDS[commandType]?.includes(normalized) || false;
}

export const VERIFICATION = {
  CODE_LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  RESEND_COOLDOWN_SECONDS: 60,
};

export const SLA = {
  TARGET_TURNAROUND_HOURS: 48,
  PICKUP_DEADLINE_DAYS: 7,
};

export default {
  COMPANY, TABLES, DROP_STATUSES, DROP_STATUS_EMOJI, DROP_STATUS_DESCRIPTION,
  BAG_STATUSES, MEMBER_STATUSES, ISSUE_STATUSES, ISSUE_TYPES, SUBSCRIPTION_TIERS,
  CONVERSATION_STATES, WHATSAPP_COMMANDS, matchesCommand, VERIFICATION, SLA,
};

// ============================================================================
// TEMPLATE SID → ENV VAR MAPPING REFERENCE
// Set these in Vercel environment variables
// ============================================================================
// TEMPLATE_DROP_GUIDE_SID      = HX9e26fa051a69976cdb3382716b0b700a  (flex_how_it_works)
// TEMPLATE_DROP_CONFIRMED_SID  = HX317686840737671f8ab1d9faa53d6608  (flex_drop_confirmed)
// TEMPLATE_READY_PICKUP_SID    = HX80619fce45f05a3d5d6913e4652fa83a  (flex_ready_pickup)
// TEMPLATE_SUPPORT_MENU_SID    = HXb32d9152f24454547ce150d3d3687fb8  (flex_feedback_bad)
// TEMPLATE_PAUSE_REMINDER_SID  = HX7835de5efc5b3d084dd3b5d7abfe6528  (flex_pause_reminder)
// TEMPLATE_PAUSE_CONFIRMED_SID = HXe58591e4092b33d89cdae69a8ef2f8c5  (flex_pause_confirmed)
// TEMPLATE_CHECK_DROPS_SID     = HXee39e5deb2f135064acfa978800e3c96  (flex_check_drops)
// TEMPLATE_MANAGE_SUB_SID      = HXadb27b5b41d67bbbcf21bb092a73a520  (flex_manage_sub)
// TEMPLATE_INVALID_BAG_SID     = HX28965dee7d021273b26d86f0bf82027c  (flex_invalid_bag)
// TEMPLATE_PICKUP_THANKS_SID   = HXed551d56107021eb29f9e1628d0f9fb5  (flex_pickup_confirmed_thanks)
// TEMPLATE_PICKUP_CONFIRM_SID  = HXa14cc8545f33efd698b8b32de36421ce  (flex_pickup_confirm_request)
// TEMPLATE_PICKUP_REMINDER_SID = HX74489de5ffb660fd2ce1ae1c31d688bd  (flex_pickup_reminder)
// TEMPLATE_TRACK_ACTIVE_SID    = HXe74cdf46e31f684ff9113dad42718912  (copy_copy_flex_track_active)
// TEMPLATE_HELP_MENU_SID       = HX5d4b694f6ee7416157ca662ee3dbda3c  (flex_help_menu)
// TEMPLATE_BAG_CONFIRMED_SID   = HX595ca8412a5df9d46a7f9d8bac940ae2  (flex_bag_confirmed)
// TEMPLATE_CANCEL_REASON_SID   = HX5ca1427956bb30b87961dc673e9d5772  (flex_cancel_reason)
// TEMPLATE_GYM_CHANGED_SID     = HX21680cd878a31c0fa82bd416ec8d70b2  (flex_gym_changed)
// TEMPLATE_FEEDBACK_BAD_SID    = HXb32d9152f24454547ce150d3d3687fb8  (flex_feedback_bad)
// TEMPLATE_DAMAGE_PHOTO_SID    = HX37f7448c34f0f2d53a887817a27a8f65  (flex_damage_photo_request)
// TEMPLATE_CHANGE_PLAN_SID     = HX498ca6d30c8f0faae319753e240c79cb  (flex_change_plan_menu)
// TEMPLATE_DISCOUNT_SID        = HX1693631af28330d866a15c1b56738acf  (flex_discount_applied)
// TEMPLATE_STUCK_BAG_SID       = HX57a1f84f3d162e50b8e5c28fbb2a89c4  (flex_stuck_bag_alert)
// ---- MISSING (need to create in Twilio) ----
// TEMPLATE_WELCOME_SID         = (create flex_welcome)
// TEMPLATE_MAIN_MENU_SID       = (create flex_main_menu)
// TEMPLATE_SUPPORT_CONFIRM_SID = (create flex_support_confirmed)
// TEMPLATE_REENGAGEMENT_SID    = (create flex_reengagement)
