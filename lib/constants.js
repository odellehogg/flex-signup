// lib/constants.js
// ============================================================================
// SINGLE SOURCE OF TRUTH FOR ALL FLEX CONSTANTS
// Update this file when business details change
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
  phone: '+447366907286',
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
  ISSUES: 'Issues',
  PLANS: 'Plans',
  CONTENT: 'Content',
  PAGE_SECTIONS: 'Page Sections',
  CONFIG: 'Config',
  DISCOUNTS: 'Discounts',
  BAGS: 'Bags',
  LAUNDRY_PARTNERS: 'Laundry Partners',
  AUDIT_LOG: 'Audit Log',
};

// ============================================================================
// STATUS CONSTANTS
// ============================================================================

export const DROP_STATUSES = {
  DROPPED: 'Dropped',
  IN_TRANSIT: 'In Transit',
  AT_LAUNDRY: 'At Laundry',
  READY: 'Ready',
  COLLECTED: 'Collected',
  CANCELLED: 'Cancelled',
};

export const MEMBER_STATUSES = {
  PROSPECT: 'Prospect',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};

export const ISSUE_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const BAG_STATUSES = {
  AVAILABLE: 'Available',
  ISSUED: 'Issued',
  IN_USE: 'In Use',
  DAMAGED: 'Damaged',
  UNRETURNED: 'Unreturned',
  RETIRED: 'Retired',
};

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export const SUBSCRIPTION_TIERS = {
  ONE_OFF: 'One-Off',
  ESSENTIAL: 'Essential',
  UNLIMITED: 'Unlimited',
};

// ============================================================================
// SLA CONFIGURATION
// ============================================================================

export const SLA = {
  TARGET_TURNAROUND_HOURS: 48,
  WARNING_THRESHOLD_HOURS: 36,
  PICKUP_DEADLINE_DAYS: 7,
  UNCLAIMED_DONATION_DAYS: 14,
};

// ============================================================================
// CONVERSATION STATES (WhatsApp flow)
// ============================================================================

export const CONVERSATION_STATES = {
  IDLE: 'idle',
  AWAITING_BAG_NUMBER: 'awaiting_bag_number',
  AWAITING_ISSUE_TYPE: 'awaiting_issue_type',
  AWAITING_ISSUE_DESCRIPTION: 'awaiting_issue_description',
  AWAITING_CANCEL_REASON: 'awaiting_cancel_reason',
  AWAITING_FEEDBACK: 'awaiting_feedback',
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
// GYM COMMISSION RATES
// ============================================================================

export const COMMISSION_RATES = {
  LAUNCH: 0,      // 0% during pilot
  GROWTH: 0.05,   // 5% after pilot
  SCALE: 0.10,    // 10% at scale
};

// ============================================================================
// TWILIO TEMPLATE BUTTON PAYLOADS
// Maps template button payloads to handler actions
// ============================================================================

export const BUTTON_PAYLOADS = {
  // Main menu actions
  HOW_IT_WORKS: 'HOW_IT_WORKS',
  HOW_WORKS: 'HOW_IT_WORKS',  // Alias for template mismatch
  START_DROP: 'START_DROP',
  MAKE_DROP: 'START_DROP',    // Alias
  FIRST_DROP: 'START_DROP',   // Alias
  TRACK_ORDER: 'TRACK_ORDER',
  TRACK: 'TRACK_ORDER',       // Alias for template mismatch
  CHECK_DROPS: 'CHECK_DROPS',
  HELP: 'HELP',
  MAIN_MENU: 'MAIN_MENU',
  
  // Subscription management
  MANAGE_SUB: 'MANAGE_SUB',
  MANAGE_SUBSCRIPTION: 'MANAGE_SUB',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  CANCEL: 'CANCEL',
  
  // Feedback
  GREAT: 'FEEDBACK_GREAT',
  OK: 'FEEDBACK_OK',
  NOT_HAPPY: 'FEEDBACK_BAD',
  
  // Other
  ON_MY_WAY: 'PICKUP_CONFIRMED',
  NEED_MORE_TIME: 'NEED_MORE_TIME',
  TAKING_A_BREAK: 'TAKING_BREAK',
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export default {
  COMPANY,
  TABLES,
  DROP_STATUSES,
  MEMBER_STATUSES,
  ISSUE_STATUSES,
  BAG_STATUSES,
  SUBSCRIPTION_TIERS,
  SLA,
  CONVERSATION_STATES,
  ISSUE_TYPES,
  COMMISSION_RATES,
  BUTTON_PAYLOADS,
};
