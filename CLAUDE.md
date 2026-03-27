# FLEX Laundry — Project Context

## Overview
FLEX is a gym clothes laundry subscription service. Members drop off clothes in bags at their gym, FLEX collects, cleans, and returns them within 48 hours. This repo is the full-stack Next.js app: marketing site, member portal, ops dashboard, and all API routes.

## Tech Stack
- **Framework:** Next.js 16 (App Router) on Vercel
- **Database:** Airtable (base ID: `appdrqzEbA8dBLXEt`)
- **Payments:** Stripe (subscriptions + one-off addon drops)
- **WhatsApp:** Twilio (templates with plain-text fallback)
- **Email:** Resend (transactional emails from `hello@flexlaundry.co.uk`)
- **Auth:** Cookie-based JWT (`flex_auth`, 7-day expiry)
- **Styling:** Tailwind CSS

## Critical Gotchas

### Next.js 16: `params` is a Promise
In ALL dynamic route handlers (`[id]`, `[slug]`, etc.), `params` must be awaited:
```js
// CORRECT
const { id } = await params;

// WRONG — returns undefined
const { id } = params;
```

### Airtable Lookup Fields Return Arrays
Lookup fields (e.g., Member Phone, Member Email, Member Name, Gym Name on Drops table) return arrays from the API, even for single values. Always use `?.[0]`:
```js
const memberPhone = drop.fields['Member Phone']?.[0];
const gymName = drop.fields['Gym Name']?.[0] || 'your gym';
```

### Airtable dateTime Fields: Use `null` to Clear, Never `''`
```js
// CORRECT
await updateMember(id, { 'Verification Expires': null });

// WRONG — Airtable 422 error
await updateMember(id, { 'Verification Expires': '' });
```

### whatsapp.js: `sendMessage` is PRIVATE
`sendMessage` and `sendTemplate` are NOT exported from `lib/whatsapp.js`. Only use exported functions:
- `sendVerificationCodeMessage(to, code)` — for login codes
- `sendPlainTextMessage(to, body)` — for ad-hoc messages
- Named functions like `sendWelcome`, `sendReadyPickup`, `sendDropConfirmed`, etc.

### Airtable singleSelect Fields
When read via API, singleSelect values may come back as objects `{id, name, color}` or strings depending on context. Handle both:
```js
const status = r.fields['Status']?.name || r.fields['Status'];
```

### Phone Normalization
`normalizePhone()` in `lib/airtable.js` converts UK numbers: `07xxx` → `+447xxx`. Note: Irish numbers starting with `08` would be incorrectly normalized. All phone comparisons should go through `normalizePhone`.

## Airtable Schema

### Members (tblrrbSdfONfvKLpp)
| Field | Type | Notes |
|-------|------|-------|
| First Name | singleLineText | Primary field |
| Last Name | singleLineText | |
| Email | email | |
| Phone | singleLineText | Normalized format +44... |
| Gym | multipleRecordLinks | Link to Gyms table |
| Gym Name | multipleLookupValues | Lookup — returns array |
| Subscription Tier | singleSelect | Essential, Unlimited, Pay As You Go |
| Subscription Status | singleSelect | Active, Paused, Cancelled |
| Drops Used | number | Resets to 0 on renewal |
| Drops Allowed | number | Set based on plan |
| Verification Code | singleLineText | 6-digit login code |
| Verification Expires | dateTime | Use null to clear |
| Verification Attempts | number | Max 3 before lockout |
| Conversation State | singleSelect | WhatsApp flow state |
| Stripe Customer ID | singleLineText | |
| Stripe Subscription ID | singleLineText | |
| Pause Resume Date | date | |

### Drops (tblvY8jeiAHrYcH4c)
| Field | Type | Notes |
|-------|------|-------|
| Bag Number | singleLineText | Primary field |
| Member | multipleRecordLinks | Link to Members |
| Gym | multipleRecordLinks | Link to Gyms |
| Status | singleSelect | Dropped, Processing, In Transit, At Laundry, Ready, Collected |
| Drop Date | dateTime | |
| Ready Date | dateTime | |
| Pickup Date | dateTime | |
| Available Until | dateTime | 7 days after Ready |
| Member Phone | multipleLookupValues | **Lookup — returns array, use `?.[0]`** |
| Member Email | multipleLookupValues | **Lookup — returns array, use `?.[0]`** |
| Member Name | multipleLookupValues | **Lookup — returns array, use `?.[0]`** |
| Gym Name | multipleLookupValues | **Lookup — returns array, use `?.[0]`** |

### Issues (tblQvFeAnX5XJ1kfp)
| Field | Type | Notes |
|-------|------|-------|
| Ticket ID | singleLineText | Primary field, e.g. "ABC12" |
| Member | multipleRecordLinks | Link to Members |
| Type | singleSelect | Missing Item, Damage, Quality, Delay, Other |
| Description | multilineText | |
| Status | singleSelect | Open, In Progress, Waiting on Customer, Resolved, Closed |
| Source | singleSelect | WhatsApp, Email, Phone |
| Internal Notes | multilineText | Conversation history appended here |
| Members Name | multipleLookupValues | Lookup — returns array |
| Member Phone | multipleLookupValues | Lookup — returns array |

### Bags (tbleNoW5ZiNA45oge)
| Field | Type | Notes |
|-------|------|-------|
| Bag Number | multilineText | Primary field |
| Status | singleSelect | Available, In Use, Lost, Retired |
| Current Drop | multipleRecordLinks | |
| Gym | multipleRecordLinks | |

### Gyms (tblaFDbr9oFUU2BbR)
| Field | Type | Notes |
|-------|------|-------|
| Name | singleLineText | Primary field |
| Slug | singleLineText | URL-friendly ID |
| Address | singleLineText | |
| Is Active | checkbox | |

### Plans (tblUJfY2hnPJLcZe6)
| Field | Type | Notes |
|-------|------|-------|
| Name | singleLineText | Essential, Unlimited, Pay As You Go |
| Price | number | Monthly price |
| Drops Allowed | number | |
| Stripe Price ID | singleLineText | |

## API Routes

### Portal (member-facing, cookie auth)
- `POST /api/portal/request-code` — Send login code (WhatsApp + email)
- `POST /api/portal/verify-code` — Verify code, set JWT cookie
- `GET /api/portal/me` — Get authenticated member data
- `GET /api/portal/drop` — List member's drops
- `POST /api/portal/drop` — Submit a new drop
- `POST /api/portal/help` — Submit support ticket
- `POST /api/portal/billing` — Create Stripe billing portal session
- `POST /api/portal/addon-drop` — Create Stripe checkout for extra drop
- `POST /api/portal/logout` — Clear auth cookie

### Ops Dashboard (token auth via OPS_AUTH_TOKEN)
- `POST /api/ops/auth` — Ops login
- `GET /api/ops/drops` — List all drops
- `PUT /api/ops/drops/[id]` — Update drop status (triggers notifications at Ready)
- `GET /api/ops/tickets` — List all tickets
- `PUT /api/ops/tickets/[id]` — Update ticket
- `POST /api/ops/tickets/[id]/reply` — Reply to ticket (sends email to customer)
- `POST /api/ops/message` — Send WhatsApp to member
- `GET /api/ops/members` — List members

### Webhooks
- `POST /api/webhooks/stripe` — Stripe events (checkout, payment, subscription changes)
- `POST /api/webhooks/whatsapp` — Twilio incoming WhatsApp messages
- `POST /api/webhooks/email` — Resend inbound email (customer ticket replies)

### Cron Jobs
- `GET /api/cron/sla-check` — Check for SLA breaches (every 4 hours)
- `GET /api/cron/pause-reminders` — Remind paused members
- `GET /api/cron/low-drops` — Alert members with low drops remaining
- `GET /api/cron/reengagement` — Re-engage inactive members

## Email Functions (lib/email.js)

All emails send from `FLEX <hello@flexlaundry.co.uk>`. Support inbox: `support@flexlaundry.co.uk`.

### Customer Emails
| Function | Trigger |
|----------|---------|
| `sendWelcomeEmail` | New signup (Stripe webhook) |
| `sendVerificationEmail` | Portal login code request |
| `sendMagicLinkEmail` | (Not implemented yet) |
| `sendReadyForPickupEmail` | Drop status → Ready |
| `sendDropConfirmationEmail` | New drop submitted |
| `sendCustomerSupportConfirmationEmail` | Ticket created |
| `sendTicketReplyEmail` | Ops replies to ticket |
| `sendPauseConfirmationEmail` | Subscription paused |
| `sendCancellationEmail` | Subscription cancelled |

### Ops Emails (all go to SUPPORT_EMAIL)
| Function | Trigger |
|----------|---------|
| `sendOpsNewMemberEmail` | New signup |
| `sendOpsNewTicketEmail` | New support ticket |
| `sendOpsNewDropEmail` | New drop submitted |
| `sendEmail` (direct) | SLA alerts |

## WhatsApp Functions (lib/whatsapp.js)

Uses Twilio. Template-first approach: tries `ContentSid` template, falls back to plain text. Key exported functions:
- `sendVerificationCodeMessage(to, code)` — Login code
- `sendWelcome(to, { firstName, planName, gymName })` — Post-signup
- `sendDropConfirmed(to, { bagNumber, gymName, expectedDate, dropsRemaining })`
- `sendReadyPickup(to, { bagNumber, gymName, firstName, pickupDeadline })`
- `sendPlainTextMessage(to, body)` — Generic message
- `sendSupportConfirmed(to, { ticketId })`

**Remember: `sendMessage` and `sendTemplate` are NOT exported. Never import them directly.**

## Auth Pattern (lib/auth.js)

Portal routes authenticate via `flex_auth` cookie:
```js
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const cookieStore = await cookies();
const token = cookieStore.get('flex_auth')?.value;
if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

const payload = verifyToken(token);
// payload = { memberId, phone, email, firstName, iat, exp }
```

## Environment Variables

### Required
- `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` — Airtable access
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_NUMBER` — WhatsApp
- `RESEND_API_KEY` — Email
- `JWT_SECRET` — Auth token signing
- `CRON_SECRET` — Protects cron endpoints
- `OPS_AUTH_TOKEN` — Ops dashboard login
- `NEXT_PUBLIC_URL` — Site URL (https://www.flexlaundry.co.uk)

### Optional
- `SUPPORT_EMAIL` — Defaults to `support@flexlaundry.co.uk`
- `OPS_EMAIL` — Defaults to `odellehogg@gmail.com`
- `TEMPLATE_*_SID` — Twilio WhatsApp template IDs (falls back to plain text if missing)
- `STRIPE_PRICE_ESSENTIAL` / `STRIPE_PRICE_UNLIMITED` / `STRIPE_PRICE_PAYG` / `STRIPE_PRICE_ADDON`

## Key Lib Files

- `lib/airtable.js` — All Airtable CRUD. Exports `TABLES`, `normalizePhone`, member/drop/issue/bag functions. `airtableFetch` is NOT exported (private).
- `lib/email.js` — All Resend email functions. Exports `sendEmail` for direct use.
- `lib/whatsapp.js` — Twilio WhatsApp. `sendMessage`/`sendTemplate` are private.
- `lib/auth.js` — JWT auth: `requestLoginCode`, `verifyLoginCode`, `verifyToken`, `createAuthCookie`.
- `lib/sla.js` — SLA metrics: `getDropsAtRisk`, `getTicketsNeedingAttention`, `getTodaySummary`, `getOpsHealthMetrics`.
- `lib/plans.js` — Plan definitions and pricing: `getPlan`, `getDropsForPlan`.
- `lib/constants.js` — Company info, status enums, conversation states.
- `lib/support.js` — Ticket creation from WhatsApp flow.
- `lib/audit.js` — Audit logging.

## Common Patterns

### Creating an Issue (Support Ticket)
```js
import { createIssue } from '@/lib/airtable';
const issue = await createIssue({
  memberId: 'recXXXXXX',
  type: 'Other',        // Missing Item | Damage | Quality | Delay | Other
  description: 'Text',
  source: 'Email',      // WhatsApp | Email | Phone (defaults to 'WhatsApp')
});
```

### Updating Drop Status
```js
import { updateDropStatus } from '@/lib/airtable';
const drop = await updateDropStatus(dropId, 'Ready');
// Valid: Dropped, Processing, In Transit, At Laundry, Ready, Collected
```

### Validating a Bag
```js
import { validateBag } from '@/lib/airtable';
const result = await validateBag('BAG001');
// Returns: { valid: true, bag, bagId, bagNumber } or { valid: false, error: '...' }
```
