# FLEX System Architecture

## Overview

FLEX uses a serverless architecture deployed on Vercel with Airtable as the primary database, Stripe for payments, Twilio for WhatsApp, and Resend for email.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER TOUCHPOINTS                                │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│    Website      │    WhatsApp     │     Email       │    Member Portal      │
│ flexlaundry.co.uk│  +447366907286  │ @flexlaundry.co.uk│   /portal/*        │
└────────┬────────┴────────┬────────┴────────┬────────┴──────────┬────────────┘
         │                 │                 │                   │
         ▼                 ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VERCEL (Serverless)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API Routes                                   │   │
│  ├─────────────────┬─────────────────┬─────────────────┬───────────────┤   │
│  │   /webhooks/    │    /portal/     │     /ops/       │    /cron/     │   │
│  │  stripe        │  auth           │  dashboard      │  reengagement │   │
│  │  whatsapp      │  drops          │  members        │  payment-retry│   │
│  │                │  subscription   │  tickets        │               │   │
│  └─────────────────┴─────────────────┴─────────────────┴───────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Library Layer                                  │   │
│  ├──────────┬──────────┬──────────┬──────────┬──────────┬─────────────┤   │
│  │ airtable │ stripe   │ whatsapp │  email   │  auth    │   support   │   │
│  │   .js    │-helpers.js│   .js    │   .js    │   .js    │    .js      │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴─────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    AIRTABLE     │      │     STRIPE      │      │     TWILIO      │
│   (Database)    │      │   (Payments)    │      │   (WhatsApp)    │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ • Members       │      │ • Customers     │      │ • Templates     │
│ • Drops         │      │ • Subscriptions │      │ • Webhooks      │
│ • Gyms          │      │ • Payments      │      │ • Messages      │
│ • Issues        │      │ • Invoices      │      │                 │
│ • Audit Log     │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                    │
                                    ▼
                         ┌─────────────────┐
                         │     RESEND      │
                         │    (Email)      │
                         ├─────────────────┤
                         │ • Welcome       │
                         │ • Magic Links   │
                         │ • Notifications │
                         └─────────────────┘
```

## Data Flow

### 1. Signup Flow

```
User → Website → Stripe Checkout → Stripe Webhook
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
              Create Member        Send WhatsApp         Send Email
              (Airtable)            Welcome              Welcome
```

### 2. Drop Flow

```
Member drops bag → Gym logs bag → Airtable automation → WhatsApp notification
        │                                                       │
        ▼                                                       │
Status: Dropped ─→ In Transit ─→ At Laundry ─→ Ready ─→ Collected
                                                │
                                                ▼
                                        WhatsApp: "Ready for pickup!"
```

### 3. Authentication Flow

```
Member → Request Login → Generate 6-digit code → Store in Airtable
                              │
                              ▼
                    Send code via WhatsApp
                              │
                              ▼
Member enters code → Verify code → Generate JWT → Set cookie
                                        │
                                        ▼
                              Authenticated session (7 days)
```

## Airtable Schema

### Members Table

| Field | Type | Description |
|-------|------|-------------|
| Phone Number | Text (primary) | WhatsApp number, E.164 format |
| Email | Email | Customer email |
| First Name | Text | |
| Last Name | Text | |
| Gym | Link to Gyms | Partner gym |
| Subscription Tier | Single Select | One-Off, Essential, Unlimited |
| Status | Single Select | Active, Paused, Cancelled |
| Drops Remaining | Number | Current period drops left |
| Total Drops | Number | Lifetime drops |
| Stripe Customer ID | Text | Stripe customer reference |
| Stripe Subscription ID | Text | Stripe subscription reference |
| Conversation State | Single Select | WhatsApp flow state |
| Verification Code | Text | 6-digit login code |
| Code Expires At | DateTime | Code expiry time |
| Code Attempts | Number | Failed verification attempts |
| Created At | DateTime | |

### Drops Table

| Field | Type | Description |
|-------|------|-------------|
| Bag Number | Text | e.g., "B042" |
| Member | Link to Members | |
| Status | Single Select | Dropped, In Transit, At Laundry, Ready, Collected |
| Drop Date | DateTime | When bag was dropped |
| Expected Ready | DateTime | 48 hours from drop |
| Actual Ready | DateTime | When marked ready |
| Collected Date | DateTime | When picked up |
| Notes | Long Text | |

### Gyms Table

| Field | Type | Description |
|-------|------|-------------|
| Name | Text | Gym name |
| Code | Text | URL slug (e.g., "third-space") |
| Address | Text | |
| Collection Days | Multi Select | Mon, Tue, Wed, etc. |
| Drop Location | Text | "Reception", "Locker room", etc. |
| Commission Rate | Number | Percentage |
| Contact Person | Text | |
| Contact Email | Email | |
| Status | Single Select | Active, Inactive |

### Issues Table

| Field | Type | Description |
|-------|------|-------------|
| Member | Link to Members | |
| Type | Single Select | Missing Item, Damage, Quality, Billing, Other |
| Description | Long Text | |
| Photo URLs | Long Text | JSON array of image URLs |
| Status | Single Select | Open, In Progress, Resolved, Closed |
| Priority | Single Select | Low, Normal, High, Urgent |
| Created At | DateTime | |
| Resolved At | DateTime | |

## Security

### Authentication
- Magic link via WhatsApp (no passwords)
- JWT tokens with HMAC-SHA256 signing
- 7-day token expiry
- HTTP-only cookies

### API Protection
- Webhook signature verification (Stripe, Twilio)
- CRON_SECRET for scheduled jobs
- OPS_AUTH_TOKEN for ops dashboard

### Data Handling
- Phone numbers normalized to E.164 format
- No PII logged in audit trails
- Stripe handles all payment data (PCI compliance)

## Error Handling

### WhatsApp Templates
All templates have plain text fallbacks:
```javascript
try {
  // Try ContentSid template
  await client.messages.create({ contentSid: '...' });
} catch {
  // Fall back to plain text
  await client.messages.create({ body: '...' });
}
```

### Airtable Queries
- REST API used (npm package has issues in serverless)
- ARRAYJOIN for linked record queries
- Retry logic for rate limits

### Stripe Webhooks
- Signature verification required
- Idempotent processing
- Failed events logged to audit

## Environment Variables

See [ENV-SETUP.md](./ENV-SETUP.md) for complete list.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guide.
