// lib/constants.js
// ============================================================================
// CENTRALIZED BUSINESS CONSTANTS
// All configuration in one place - import from here, not hardcoded values
// ============================================================================

// Company Information
export const COMPANY = {
  name: 'FLEX',
  legalName: 'FLEX Active Group Limited',
  tradingAs: 'Connectedbycommerce LTD',
  tagline: 'Sweat Less, Live More',
  phone: '+447366907286',
  phoneFormatted: '+44 7366 907286',
  email: 'hello@flexlaundry.co.uk',
  supportEmail: 'support@flexlaundry.co.uk',
  website: 'https://flexlaundry.co.uk',
  address: {
    line1: 'London',
    country: 'United Kingdom',
  },
};

// Operational Constants
export const OPERATIONS = {
  turnaroundHours: 48,
  maxBagsPerLoad: 6,
  minBagsPerLoad: 4,
  collectionTime: '18:00',
  pickupDeadlineDays: 7,
  reengagementDays: 14,
  pauseReminderDays: 3,
};

// Business Metrics
export const METRICS = {
  processingCostPerDrop: 3.50,
  commercialLaundryPerLoad: 18,
  targetGrossMargin: 0.35,
  monthlyFixedCosts: 775,
  breakEvenCustomers: 125,
};

// Status Values
export const DROP_STATUSES = {
  DROPPED: 'Dropped',
  IN_TRANSIT: 'In Transit',
  AT_LAUNDRY: 'At Laundry',
  READY: 'Ready',
  COLLECTED: 'Collected',
};

export const MEMBER_STATUSES = {
  PROSPECT: 'Prospect',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
};

export const TICKET_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const ISSUE_TYPES = {
  MISSING: 'Missing Item',
  DAMAGE: 'Damage',
  QUALITY: 'Quality Issue',
  DELAY: 'Delay',
  OTHER: 'Other',
};

// Conversation States (WhatsApp flow)
export const CONVERSATION_STATES = {
  IDLE: 'idle',
  AWAITING_BAG: 'awaiting_bag',
  AWAITING_SUPPORT_DESC: 'awaiting_support_desc',
  AWAITING_SUPPORT_PHOTO: 'awaiting_support_photo',
  AWAITING_PICKUP_CONFIRM: 'awaiting_pickup_confirm',
  AWAITING_GYM_CHANGE: 'awaiting_gym_change',
};

// Airtable Table Names
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
  AUDIT_LOG: 'Audit Log',
};

// Airtable Field Names (for consistency)
export const MEMBER_FIELDS = {
  PHONE: 'Phone Number',
  EMAIL: 'Email',
  FIRST_NAME: 'First Name',
  LAST_NAME: 'Last Name',
  GYM: 'Gym',
  PLAN: 'Subscription Tier',
  STATUS: 'Status',
  STRIPE_CUSTOMER_ID: 'Stripe Customer ID',
  STRIPE_SUBSCRIPTION_ID: 'Stripe Subscription ID',
  CONVERSATION_STATE: 'Conversation State',
  TOTAL_DROPS: 'Total Drops',
  DROPS_THIS_PERIOD: 'Drops This Period',
  PERIOD_START: 'Period Start',
  PENDING_ISSUE_TYPE: 'Pending Issue Type',
  PENDING_ISSUE_DESC: 'Pending Issue Description',
  VERIFICATION_CODE: 'Verification Code',
  VERIFICATION_EXPIRES: 'Verification Expires',
  VERIFICATION_ATTEMPTS: 'Verification Attempts',
};

// WhatsApp Button Payloads
export const BUTTON_PAYLOADS = {
  // Main Menu
  MENU: 'MENU',
  DROP: 'DROP',
  TRACK: 'TRACK',
  HELP: 'HELP',
  
  // Drop Flow
  DROP_CONFIRM: 'DROP_CONFIRM',
  
  // Status/Tracking
  ON_MY_WAY: 'ON_MY_WAY',
  NEED_TIME: 'NEED_TIME',
  CONFIRM_PICKUP: 'CONFIRM_PICKUP',
  
  // Support
  SUPPORT_MISSING: 'SUPPORT_MISSING',
  SUPPORT_DAMAGE: 'SUPPORT_DAMAGE',
  SUPPORT_QUALITY: 'SUPPORT_QUALITY',
  SUPPORT_DELAY: 'SUPPORT_DELAY',
  SUPPORT_OTHER: 'SUPPORT_OTHER',
  SKIP_PHOTO: 'SKIP_PHOTO',
  
  // Subscription
  MANAGE: 'MANAGE',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  CHANGE_PLAN: 'CHANGE_PLAN',
  CHANGE_GYM: 'CHANGE_GYM',
  BILLING: 'BILLING',
  CANCEL: 'CANCEL',
  
  // Cancellation
  CANCEL_CONFIRM: 'CANCEL_CONFIRM',
  CANCEL_KEEP_20: 'CANCEL_KEEP_20',
  CANCEL_KEEP: 'CANCEL_KEEP',
  
  // Feedback
  FEEDBACK_GREAT: 'FEEDBACK_GREAT',
  FEEDBACK_OK: 'FEEDBACK_OK',
  FEEDBACK_BAD: 'FEEDBACK_BAD',
  
  // Portal
  PORTAL: 'PORTAL',
};

// Response Messages
export const MESSAGES = {
  UNKNOWN_COMMAND: "Sorry, I didn't understand that. Reply MENU for options.",
  ERROR_GENERIC: "Something went wrong. Please try again or contact support.",
  NOT_A_MEMBER: "I couldn't find your account. Please sign up at flexlaundry.co.uk",
  PHOTO_RECEIVED: "Photo received! I'll add it to your ticket.",
};

// URLs
export const URLS = {
  BASE: process.env.NEXT_PUBLIC_BASE_URL || 'https://flexlaundry.co.uk',
  PORTAL: '/portal',
  JOIN: '/join',
  PRICING: '/pricing',
  HOW_IT_WORKS: '/how-it-works',
  FAQ: '/faq',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
};

// Export everything as default too
export default {
  COMPANY,
  OPERATIONS,
  METRICS,
  DROP_STATUSES,
  MEMBER_STATUSES,
  SUBSCRIPTION_STATUSES,
  TICKET_STATUSES,
  ISSUE_TYPES,
  CONVERSATION_STATES,
  TABLES,
  MEMBER_FIELDS,
  BUTTON_PAYLOADS,
  MESSAGES,
  URLS,
};
