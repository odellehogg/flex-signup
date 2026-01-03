# FLEX - Gym Clothes Laundry Service

## Overview

FLEX is a specialized gym clothes laundry subscription service. Members drop sweaty workout clothes at partner gyms, we collect, clean, and return within 48 hours.

**Business Model:** B2B2C - Gyms serve as collection/return points  
**Target Market:** Frequent exercisers (3-5 workouts/week)  
**Website:** https://flexlaundry.co.uk

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in all required values

# Run development server
npm run dev

# Deploy to Vercel
vercel --prod
```

## Pricing Tiers

| Tier | Price | Drops/Month | Cost per Drop |
|------|-------|-------------|---------------|
| One-Off | £5 | 1 | £5.00 |
| Essential | £35 | 10 | £3.50 |
| Unlimited | £48 | 16 (cap) | £3.00 |

## Technical Stack

| Component | Service | Purpose |
|-----------|---------|---------|
| Hosting | Vercel | Serverless deployment |
| Database | Airtable | Member data, drops, gyms |
| Payments | Stripe | Subscriptions & one-time |
| WhatsApp | Twilio | Customer communications |
| Email | Resend | Transactional emails |

## Project Structure

```
flex-signup/
├── app/
│   ├── api/                    # API routes
│   │   ├── webhooks/
│   │   │   ├── stripe/         # Stripe webhook
│   │   │   └── whatsapp/       # Twilio webhook
│   │   ├── cron/               # Scheduled jobs
│   │   │   ├── reengagement/   # 14-day inactive
│   │   │   └── payment-retry/  # Failed payments
│   │   ├── portal/             # Member portal APIs
│   │   └── ops/                # Ops dashboard APIs
│   ├── (marketing)/            # Public pages
│   ├── portal/                 # Member portal
│   └── ops/                    # Ops dashboard
├── components/                  # React components
│   └── ops/                    # Ops-specific components
├── lib/                        # Shared utilities
│   ├── airtable.js            # Database functions
│   ├── auth.js                # Authentication
│   ├── constants.js           # Business config
│   ├── email.js               # Email sending
│   ├── plans.js               # Plan definitions
│   ├── stripe-helpers.js      # Stripe integration
│   ├── support.js             # Ticket handling
│   ├── whatsapp.js            # WhatsApp templates
│   ├── audit.js               # Audit logging
│   ├── sla.js                 # SLA monitoring
│   └── cms.js                 # Content management
├── docs/                       # Documentation
└── public/                     # Static assets
```

## Features by Phase

### Phase 1: Core Member Flow
- ✅ Stripe checkout & subscriptions
- ✅ Member creation in Airtable
- ✅ WhatsApp welcome message
- ✅ Email confirmation

### Phase 2: Drop Management
- ✅ Bag number tracking
- ✅ Status updates (Dropped → In Transit → At Laundry → Ready → Collected)
- ✅ WhatsApp notifications at each stage
- ✅ Pickup confirmation

### Phase 3: Member Portal
- ✅ Magic link authentication (WhatsApp-based)
- ✅ View subscription status
- ✅ Check remaining drops
- ✅ Track active orders
- ✅ Change gym
- ✅ Pause/resume subscription
- ✅ Billing portal

### Phase A: Operations Dashboard
- ✅ Overview metrics
- ✅ Member management
- ✅ Drop tracking
- ✅ SLA monitoring
- ✅ Support tickets

### Phase B: Automated Jobs
- ✅ Re-engagement (14 days inactive)
- ✅ Payment retry notifications
- ✅ Pause reminder (3 days before resume)
- ✅ Audit logging

### Phase C: Support System
- ✅ Issue reporting via WhatsApp
- ✅ Photo uploads for damage reports
- ✅ Ticket tracking in Airtable
- ✅ Ops notifications

## Key Files

| File | Purpose |
|------|---------|
| `lib/plans.js` | Single source of truth for plan config |
| `lib/constants.js` | Business configuration |
| `lib/airtable.js` | All database operations |
| `lib/whatsapp.js` | WhatsApp message templates |
| `app/api/webhooks/stripe/route.js` | Stripe event handling |
| `app/api/webhooks/whatsapp/route.js` | WhatsApp message handling |

## Documentation

- [Architecture](./ARCHITECTURE.md) - System design
- [WhatsApp Flows](./WHATSAPP-FLOWS.md) - Conversation flows
- [API Reference](./API-REFERENCE.md) - Endpoint documentation
- [Deployment](./DEPLOYMENT.md) - Deployment guide
- [Environment Setup](./ENV-SETUP.md) - Environment variables
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues

## Unit Economics

- **Processing cost:** £3.50/drop (batching 5-6 bags per commercial load)
- **LTV:CAC ratio:** 30-40x
- **Breakeven:** 125 customers
- **Timeline:** Month 10-11 profitability

## Contact

**Founder:** Odelle Hogg  
**Email:** odellehogg@gmail.com  
**Company:** FLEX Active Group Limited
