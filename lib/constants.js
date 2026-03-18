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
// Actual options: idle, awaiting_bag, awaiting_bag_number, awaiting_support_desc,
//   awaiting_support_photo, awaiting_issue, awaiting_damage_photo, awaiting_feedback,
//   main_menu, subscription_menu, pause_menu, cancel_reason, cancel_retention,
//   change_gym, change_plan, help_menu, select_issue_type
export const CONVERSATION_STATES = {
  IDLE: 'idle',
  AWAITING_BAG: 'awaiting_bag',          // ✅ exists in Airtable
  AWAITING_SUPPORT: 'awaiting_support_desc', // ✅ 'awaiting_support' doesn't exist — use this
};

export const WHATSAPP_COMMANDS = {
  MENU: ['MENU', 'HI', 'HELLO', 'HEY', 'START', 'HOME', '0'],
  DROP: ['DROP', '1', 'START', 'NEW'],
  STATUS: ['STATUS', '2', 'TRACK', 'CHECK', 'DROPS'],
  SUPPORT: ['HELP', '3', 'SUPPORT', 'ISSUE', 'PROBLEM'],
  CANCEL: ['CANCEL', 'BACK', 'MENU'],
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
