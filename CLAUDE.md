# FLEX Laundry — Project Context

## What is this?
FLEX is a gym clothes laundry subscription service. Members drop gym clothes in numbered bags at partner gyms, FLEX collects/cleans them, and returns within 48 hours. This repo is the full-stack Next.js app: marketing site, member portal, ops dashboard, and all API routes.

## Tech Stack
- **Framework:** Next.js 16 (App Router) with React 19
- **Styling:** Tailwind CSS 3.4
- **Database:** Airtable (via REST API, no ORM)
- **Payments:** Stripe (subscriptions + one-off addon drops)
- **Messaging:** Twilio WhatsApp (template-first with plain text fallback)
- **Email:** Resend
- **Hosting:** Vercel

## Key Architecture

### Airtable Tables
Defined in `lib/constants.js` → `TABLES`: Members, Drops, Gyms, Bags, Issues, Plans, Config, Gym Interest.

### Airtable Field Names (common gotchas)
- Members: `Phone`, `Subscription Status` (not `Status`), `Drops Allowed` / `Drops Used` (not `Drops Remaining` / `Total Drops`)
- Drops: `Available Until` (not `Expected Ready`), `Pickup Date` (not `Collected Date`), `Bags` (link field)
- Gyms: `Slug` (not `Code`), `Is Active` (checkbox)
- Issues: `Created At` (not `Created`), `Photo URL` (single url, not array)

### Auth
Cookie-based JWT (`flex_auth`). Login flow: phone number → verification code sent via WhatsApp + email backup → verify code → JWT cookie. See `lib/auth.js`.

### WhatsApp (`lib/whatsapp.js`)
- `sendMessage` is a **private** helper — do NOT import it directly for new features
- Use exported functions: `sendVerificationCodeMessage`, `sendPlainTextMessage`, `sendWelcome`, etc.
- Template SIDs are mapped to env vars (see bottom of `lib/constants.js`)

### Email (`lib/email.js`)
- Core: `sendEmail({ to, subject, html, text, replyTo })`
- Customer emails: welcome, verification, drop confirmation, ready-for-pickup, ticket reply
- Ops emails: new member, new drop, new ticket, SLA alerts

### API Routes
- `/api/portal/*` — authenticated member actions (drop, billing, help, logout)
- `/api/ops/*` — ops dashboard (members, drops, tickets, messaging)
- `/api/webhooks/*` — Stripe, WhatsApp (Twilio), inbound email (Resend)
- `/api/cron/*` — SLA checks, pause reminders, re-engagement, low drops alerts

## Commands
```bash
npm run dev    # Local dev server
npm run build  # Production build
npm run lint   # ESLint
```

## Important Patterns
- Airtable writes use `airtableFetch()` (exported from `lib/airtable.js`) with PATCH for updates
- WhatsApp uses `sendWithFallback(to, templateSid, vars, fallbackBody)` — tries template first, falls back to plain text
- All notification sends should be `.catch()`-wrapped to avoid breaking the main flow
- Phone numbers are normalized to E.164 format via `normalizePhone()` in `lib/airtable.js`
- Bag numbers are normalized to `B###` format via `normalizeBagNumber()`
- Timezone is `Europe/Dublin` or `Europe/London` for customer-facing dates
