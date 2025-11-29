# FLEX - Gym Laundry Service Platform

A full-stack Next.js application for gym clothes laundry service with WhatsApp automation, Stripe payments, Airtable backend, and ops dashboard.

## Quick Stats

| Component | Count |
|-----------|-------|
| Pages | 23 |
| API Routes | 23 |
| Cron Jobs | 6 |
| WhatsApp Templates | 44 |
| Email Templates | 9 |

---

## Features

### Customer-Facing
- Marketing website with CMS-controlled content
- 3-step signup flow with Stripe checkout
- WhatsApp-first communication (44 message templates)
- Member self-service portal
- Email fallback for all notifications

### Operations
- Ops dashboard for bag tracking
- Laundry partner assignment
- SLA monitoring with alerts
- Audit trail for all actions
- Financial reporting

### Automation
- Drop status notifications
- Pickup confirmation reminders
- Payment retry sequence (Day 3, 7, 10)
- Issue detection for stuck bags
- Re-engagement for inactive members

---

## Project Structure

```
flex-complete/
├── app/
│   ├── page.js                     # Homepage
│   ├── pricing/                    # Pricing page
│   ├── how-it-works/               # How it works
│   ├── join/                       # Signup flow
│   ├── member/                     # Member portal
│   │   └── dashboard/              # Self-service dashboard
│   ├── ops/                        # Ops dashboard
│   │   ├── pickups/                # Collect from gyms
│   │   ├── laundry/                # Track at laundry
│   │   ├── delivery/               # Return to gyms
│   │   ├── members/                # Member lookup
│   │   ├── reports/                # Financial reports
│   │   ├── audit/                  # Action history
│   │   ├── sla/                    # SLA monitoring
│   │   └── bags/                   # Bag inventory
│   └── api/
│       ├── webhooks/
│       │   ├── stripe/             # Payment events
│       │   └── whatsapp/           # Message handling
│       ├── cron/
│       │   ├── reengagement/       # Daily 10am
│       │   ├── pause-reminder/     # Daily 9am
│       │   ├── pickup-confirm/     # Daily 11am
│       │   ├── issue-detection/    # Every 2 hours
│       │   ├── payment-retry/      # Daily 12pm
│       │   └── sla-check/          # Every hour
│       ├── ops/                    # Ops endpoints
│       └── member/                 # Member endpoints
├── components/
│   ├── ops/                        # Ops UI components
│   └── MemberDashboardClient.js    # Member portal UI
├── lib/
│   ├── airtable.js                 # 51 database functions
│   ├── whatsapp.js                 # 44 message templates
│   ├── email.js                    # 9 email templates
│   ├── stripe-helpers.js           # Payment utilities
│   ├── audit.js                    # Audit logging
│   ├── sla.js                      # SLA monitoring
│   └── cms.js                      # CMS helpers
└── docs/
    ├── TEMPLATES.md                # All 44 WhatsApp templates
    ├── AIRTABLE.md                 # Database schema
    ├── OPS-DASHBOARD-SPEC.md       # Ops dashboard guide
    └── SYSTEM-AUDIT-AND-ROADMAP.md # Architecture overview
```

---

## Setup Guide

### 1. Prerequisites

- Node.js 18+
- Accounts: Vercel, Stripe, Twilio, Airtable, Resend

### 2. Install

```bash
npm install
cp .env.example .env.local
```

### 3. Configure Services

**Airtable:** Create tables per `docs/AIRTABLE.md`

**Stripe:** Create products and configure webhook to `/api/webhooks/stripe`

**Twilio:** Create 44 WhatsApp templates per `docs/TEMPLATES.md`

**Resend:** Get API key for transactional emails

### 4. Environment Variables

Fill in `.env.local` with all API keys. See `.env.example` for the complete list.

Key variables:
```bash
NEXT_PUBLIC_BASE_URL=https://flexlaundry.co.uk
TWILIO_WHATSAPP_NUMBER=whatsapp:+447366907286
OPS_ALERT_EMAIL=ops@flexlaundry.co.uk
```

### 5. Deploy

```bash
vercel --prod
```

Add all environment variables in Vercel Dashboard.

### 6. Configure Webhooks

- **Stripe:** `https://yourdomain.com/api/webhooks/stripe`
- **Twilio:** `https://yourdomain.com/api/webhooks/whatsapp`

---

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| reengagement | 10:00 daily | Nudge inactive members |
| pause-reminder | 09:00 daily | Remind before resume |
| pickup-confirm | 11:00 daily | Chase uncollected bags |
| issue-detection | Every 2 hours | Find stuck bags |
| payment-retry | 12:00 daily | Retry failed payments |
| sla-check | Every hour | Monitor SLA breaches |

---

## Ops Dashboard

Access at `/ops` (password protected)

| Page | Purpose |
|------|---------|
| Dashboard | KPIs and overview |
| Pickups | Collect bags from gyms, assign to laundry partners |
| Laundry | Track bags at laundry partners |
| Delivery | Return bags to gyms |
| Members | Search and view member details |
| Reports | Revenue, churn, utilisation metrics |
| Audit | Complete action history |
| SLA | Monitor turnaround times |

---

## Key Flows

### Customer Signup
1. Website → Select gym → Enter details → Choose plan
2. Stripe checkout → Payment
3. Webhook creates member → WhatsApp welcome + Email

### Drop Flow
1. Customer messages bag number via WhatsApp
2. System creates drop, confirms via WhatsApp
3. Ops collects from gym, assigns to laundry partner
4. Laundry cleans, returns to gym
5. Customer notified when ready
6. Customer collects, confirms pickup

### Payment Failure
1. Stripe webhook detects failure
2. Day 0: Payment failed notification
3. Day 3: First reminder
4. Day 7: Final warning
5. Day 10: Auto-pause subscription

---

## Documentation

| Doc | Contents |
|-----|----------|
| `docs/TEMPLATES.md` | All 44 WhatsApp templates with copy to paste into Twilio |
| `docs/AIRTABLE.md` | Complete database schema and field specifications |
| `docs/OPS-DASHBOARD-SPEC.md` | Ops dashboard features and workflows |
| `docs/SYSTEM-AUDIT-AND-ROADMAP.md` | Architecture and scalability notes |

---

## Testing

1. **Stripe:** Use test card `4242 4242 4242 4242`
2. **WhatsApp:** Message `MENU` to your Twilio number
3. **Ops:** Login at `/ops` with your OPS_PASSWORD

---

## Support

- Email: hello@flexlaundry.co.uk
- WhatsApp: +44 7366 907286

---

*FLEX Active Group Ltd*
