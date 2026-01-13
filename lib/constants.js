// lib/constants.js
// ============================================================================
// SINGLE SOURCE OF TRUTH FOR ALL FLEX CONSTANTS
// MVP VERSION - Simplified for reliability
// ============================================================================

// ============================================================================
// COMPANY INFORMATION
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

// ============================================================================
// AIRTABLE TABLE NAMES
// ============================================================================

export const TABLES = {
  MEMBERS: 'Members',
  DROPS: 'Drops',
  GYMS: 'Gyms',
  BAGS: 'Bags',           // NEW: Bag inventory
  ISSUES: 'Issues',
  PLANS: 'Plans',
  CONTENT: 'Content',
  CONFIG: 'Config',
};

// ============================================================================
// DROP STATUSES (Simplified: 4 instead of 6)
// ============================================================================

export const DROP_STATUSES = {
  DROPPED: 'Dropped',       // Customer dropped off bag
  PROCESSING: 'Processing', // We have it / at laundry
  READY: 'Ready',           // Ready for pickup
  COLLECTED: 'Collected',   // Customer picked up
};

// Status display helpers
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

// ============================================================================
// BAG STATUSES
// ============================================================================

export const BAG_STATUSES = {
  AVAILABLE: 'Available',   // Ready for customer use
  IN_USE: 'In Use',         // Assigned to active drop
  RETIRED: 'Retired',       // Out of circulation
};

// ============================================================================
// MEMBER STATUSES
// ============================================================================

export const MEMBER_STATUSES = {
  PENDING: 'Pending',       // Phone verified, awaiting payment
  ACTIVE: 'Active',         // Paid, can make drops
  PAUSED: 'Paused',         // Subscription paused
  CANCELLED: 'Cancelled',   // Subscription ended
};

// ============================================================================
// ISSUE STATUSES
// ============================================================================

export const ISSUE_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

// ============================================================================
// ISSUE TYPES
// ============================================================================

export const ISSUE_TYPES = [
  'Missing Item',
  'Damaged Item',
  'Wrong Bag',
  'Late Delivery',
  'Quality Issue',
  'Billing Issue',
  'Other',
];

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export const SUBSCRIPTION_TIERS = {
  ONE_OFF: 'One-Off',
  ESSENTIAL: 'Essential',
  UNLIMITED: 'Unlimited',
};

// ============================================================================
// CONVERSATION STATES (Simplified: 3 instead of 6)
// ============================================================================

export const CONVERSATION_STATES = {
  IDLE: 'idle',                     // At main menu, no pending action
  AWAITING_BAG: 'awaiting_bag',     // In drop flow, waiting for bag number
  AWAITING_SUPPORT: 'awaiting_support', // In support flow, waiting for message
};

// ============================================================================
// WHATSAPP COMMANDS
// Accepted inputs mapped to actions
// ============================================================================

export const WHATSAPP_COMMANDS = {
  // Main menu triggers
  MENU: ['MENU', 'HI', 'HELLO', 'HEY', 'START', 'HOME', '0'],
  
  // Start drop flow
  DROP: ['DROP', '1', 'START', 'NEW'],
  
  // Check status
  STATUS: ['STATUS', '2', 'TRACK', 'CHECK', 'DROPS'],
  
  // Support
  SUPPORT: ['HELP', '3', 'SUPPORT', 'ISSUE', 'PROBLEM'],
  
  // Cancel current flow
  CANCEL: ['CANCEL', 'BACK', 'MENU'],
};

// Helper to check if input matches a command
export function matchesCommand(input, commandType) {
  const normalized = (input || '').toUpperCase().trim();
  return WHATSAPP_COMMANDS[commandType]?.includes(normalized) || false;
}

// ============================================================================
// VERIFICATION SETTINGS
// ============================================================================

export const VERIFICATION = {
  CODE_LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  RESEND_COOLDOWN_SECONDS: 60,
};

// ============================================================================
// SLA CONFIGURATION
// ============================================================================

export const SLA = {
  TARGET_TURNAROUND_HOURS: 48,
  PICKUP_DEADLINE_DAYS: 7,
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export default {
  COMPANY,
  TABLES,
  DROP_STATUSES,
  DROP_STATUS_EMOJI,
  DROP_STATUS_DESCRIPTION,
  BAG_STATUSES,
  MEMBER_STATUSES,
  ISSUE_STATUSES,
  ISSUE_TYPES,
  SUBSCRIPTION_TIERS,
  CONVERSATION_STATES,
  WHATSAPP_COMMANDS,
  matchesCommand,
  VERIFICATION,
  SLA,
};
