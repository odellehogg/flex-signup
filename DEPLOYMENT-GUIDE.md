# FLEX Deployment Guide

Complete step-by-step guide to deploying FLEX from scratch.

---

## Table of Contents
1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Environment Setup](#2-environment-setup)
3. [External Services Setup](#3-external-services-setup)
4. [Vercel Deployment](#4-vercel-deployment)
5. [Post-Deployment Configuration](#5-post-deployment-configuration)
6. [Go-Live Checklist](#6-go-live-checklist)
7. [Rollback Procedures](#7-rollback-procedures)
8. [Maintenance & Updates](#8-maintenance--updates)

---

## 1. Pre-Deployment Checklist

### Required Accounts
- [ ] **Vercel** - Hosting (https://vercel.com)
- [ ] **Stripe** - Payments (https://stripe.com)
- [ ] **Twilio** - WhatsApp (https://twilio.com)
- [ ] **Airtable** - Database (https://airtable.com)
- [ ] **Resend** - Email (https://resend.com)
- [ ] **GitHub** - Code repository (https://github.com)

### Required Information
- [ ] Domain name (flexlaundry.co.uk)
- [ ] Business email for notifications
- [ ] WhatsApp business number
- [ ] Logo and brand assets

---

## 2. Environment Setup

### 2.1 Clone Repository
```bash
# From GitHub
git clone https://github.com/odellehogg/flex-signup.git
cd flex-signup

# Or unzip the rebuild package
unzip flex-rebuild-final.zip
cd flex-rebuild
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Create Environment File
```bash
cp .env.example .env.local
```

### 2.4 Generate Security Secrets
```bash
# Generate AUTH_SECRET (32 characters)
openssl rand -hex 32

# Generate CRON_SECRET
openssl rand -hex 16

# Generate CMS_API_KEY
openssl rand -hex 16
```

---

## 3. External Services Setup

### 3.1 Stripe Setup

#### Create Products & Prices
1. Go to Stripe Dashboard → Products
2. Create three products:

| Product | Price | Type | Notes |
|---------|-------|------|-------|
| FLEX One-Off | £5.00 | One-time | Trial drop |
| FLEX Essential | £35.00/month | Recurring | 10 drops |
| FLEX Unlimited | £48.00/month | Recurring | 16 drops |

3. Copy the Price IDs (price_xxx) to your .env.local

#### Configure Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://flexlaundry.co.uk/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy Webhook Secret (whsec_xxx) to .env.local

#### Enable Customer Portal
1. Go to Settings → Billing → Customer Portal
2. Enable portal
3. Configure allowed actions (update payment, cancel, etc.)

### 3.2 Twilio Setup

#### Get WhatsApp Sandbox (Development)
1. Go to Twilio Console → Messaging → Try it Out → WhatsApp
2. Follow sandbox setup instructions
3. Note the sandbox number

#### WhatsApp Business (Production)
1. Apply for WhatsApp Business API access
2. Register your business number
3. Get number approved by Meta

#### Configure Webhook
1. Go to Twilio Console → Phone Numbers → Your Number
2. Set Webhook URL: `https://flexlaundry.co.uk/api/webhooks/whatsapp`
3. Method: POST

#### Create Message Templates (Optional)
Templates are optional - the system has plain text fallbacks. If you want to use templates:

1. Go to Twilio Console → Content Editor
2. Create templates for each message type
3. Submit for Meta approval
4. Add Content SIDs to .env.local

### 3.3 Airtable Setup

#### Create Base
1. Create new base named "FLEX"
2. Create tables with these schemas:

**Members Table:**
| Field | Type |
|-------|------|
| Phone Number | Phone |
| Email | Email |
| First Name | Single line text |
| Last Name | Single line text |
| Gym | Link to Gyms |
| Subscription Tier | Single select: oneoff, essential, unlimited |
| Status | Single select: Active, Paused, Cancelled |
| Stripe Customer ID | Single line text |
| Stripe Subscription ID | Single line text |
| Conversation State | Single select |
| Drops Remaining | Number |
| Total Drops | Number |

**Drops Table:**
| Field | Type |
|-------|------|
| Member | Link to Members |
| Bag Number | Single line text |
| Status | Single select: Dropped, In Transit, At Laundry, Ready, Collected |
| Drop Date | Date |
| Expected Ready | Date |

**Gyms Table:**
| Field | Type |
|-------|------|
| Name | Single line text |
| Code | Single line text |
| Address | Long text |
| Status | Single select: Active, Inactive |
| Collection Days | Multiple select |

**Issues Table:**
| Field | Type |
|-------|------|
| Member | Link to Members |
| Issue Type | Single select |
| Description | Long text |
| Status | Single select: Open, In Progress, Resolved |
| Priority | Single select: Low, Normal, High, Urgent |
| Photo URLs | Long text |

#### Get API Credentials
1. Go to airtable.com/create/tokens
2. Create Personal Access Token with scopes:
   - data.records:read
   - data.records:write
3. Copy token to .env.local
4. Copy Base ID from URL (appXXXXXXXX)

#### Create Automation (Optional)
For automatic notifications when drop status changes:
1. Go to Automations tab
2. Create automation: "When record updated"
3. Trigger: Drops table, Status field
4. Action: Run script or webhook to `/api/notify-drop-status`

### 3.4 Resend Setup

#### Verify Domain
1. Go to Resend Dashboard → Domains
2. Add domain: flexlaundry.co.uk
3. Add DNS records provided by Resend
4. Wait for verification

#### Get API Key
1. Go to API Keys
2. Create new key
3. Copy to .env.local

---

## 4. Vercel Deployment

### 4.1 Connect Repository
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link
```

### 4.2 Add Environment Variables
```bash
# Add all variables from .env.local
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_ONEOFF
vercel env add STRIPE_PRICE_ESSENTIAL
vercel env add STRIPE_PRICE_UNLIMITED
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_WHATSAPP_NUMBER
vercel env add AIRTABLE_API_KEY
vercel env add AIRTABLE_BASE_ID
vercel env add RESEND_API_KEY
vercel env add AUTH_SECRET
vercel env add CRON_SECRET
vercel env add CMS_API_KEY
vercel env add NEXT_PUBLIC_URL
vercel env add OPS_EMAIL
```

Or add via Vercel Dashboard → Project → Settings → Environment Variables

### 4.3 Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 4.4 Configure Custom Domain
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add domain: flexlaundry.co.uk
3. Add DNS records at your registrar:
   - A record: 76.76.21.21
   - CNAME: cname.vercel-dns.com

---

## 5. Post-Deployment Configuration

### 5.1 Update Webhook URLs

#### Stripe
1. Go to Stripe Dashboard → Webhooks
2. Update endpoint to production URL:
   `https://flexlaundry.co.uk/api/webhooks/stripe`

#### Twilio
1. Go to Twilio Console → Phone Numbers
2. Update webhook to:
   `https://flexlaundry.co.uk/api/webhooks/whatsapp`

### 5.2 Test Integrations

#### Test Stripe
```bash
# Trigger a test webhook
stripe trigger checkout.session.completed
```

#### Test WhatsApp
1. Send "Hi" to your WhatsApp number
2. Verify response received

#### Test Airtable
1. Create a test member manually
2. Verify it appears in database

### 5.3 Configure Cron Jobs
Cron jobs are auto-configured via vercel.json:
- Re-engagement: Daily at 10am UTC
- Pause reminders: Daily at 9am UTC
- SLA check: Every 4 hours

To test manually:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://flexlaundry.co.uk/api/cron/sla-check
```

### 5.4 Seed Initial Data

#### Add Gyms
In Airtable, add your partner gyms:
```
Name: Third Space Canary Wharf
Code: 3S-CW
Address: 18 Canada Square, London E14 5AH
Status: Active
Collection Days: Monday, Wednesday, Friday
```

---

## 6. Go-Live Checklist

### Pre-Launch (Day Before)
- [ ] All environment variables set in Vercel
- [ ] Custom domain configured and SSL active
- [ ] Stripe webhooks pointing to production URL
- [ ] Twilio webhooks pointing to production URL
- [ ] Test signup flow end-to-end
- [ ] Test WhatsApp responses
- [ ] Verify email delivery
- [ ] Add at least one gym to Airtable

### Launch Day
- [ ] **Switch Stripe to Live Mode**
  1. Go to Stripe Dashboard
  2. Toggle "Test mode" OFF
  3. Update API keys in Vercel to live keys (sk_live_xxx)
  4. Update webhook to live endpoint
  5. Recreate products/prices in live mode
  
- [ ] **Update Twilio to Production**
  1. Switch from sandbox to approved WhatsApp Business number
  2. Update phone number in .env

- [ ] **Final Tests**
  1. Make a real £5 test purchase
  2. Verify member created in Airtable
  3. Verify WhatsApp welcome received
  4. Verify email received
  5. Issue refund for test

### Post-Launch (First Week)
- [ ] Monitor error logs in Vercel
- [ ] Check Stripe for failed payments
- [ ] Verify cron jobs running (check Vercel logs)
- [ ] Respond to first customer queries
- [ ] Track key metrics

---

## 7. Rollback Procedures

### Quick Rollback
```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback
```

### Revert Code Changes
```bash
# Find last working commit
git log --oneline

# Revert to specific commit
git revert <commit-hash>
git push origin main
```

### Emergency Procedures

#### Disable Payments
1. Go to Stripe Dashboard
2. Disable checkout or switch to test mode

#### Disable WhatsApp
1. Update Twilio webhook to a holding URL
2. Or disable the phone number temporarily

#### Database Issues
1. Airtable has automatic backups
2. Go to Base → Snapshots to restore

---

## 8. Maintenance & Updates

### Regular Maintenance

#### Weekly
- [ ] Check Vercel error logs
- [ ] Review Stripe payment failures
- [ ] Check unresolved support tickets
- [ ] Verify cron jobs executing

#### Monthly
- [ ] Review and optimize costs
- [ ] Update dependencies (`npm update`)
- [ ] Backup Airtable data
- [ ] Review analytics

### Deploying Updates

```bash
# 1. Make changes locally
# 2. Test locally
npm run dev

# 3. Commit changes
git add .
git commit -m "Description of changes"

# 4. Push to trigger deployment
git push origin main

# 5. Monitor deployment in Vercel Dashboard

# 6. Verify changes on production
```

### Zero-Downtime Deployments
Vercel handles this automatically:
1. New deployment builds
2. Health check passes
3. Traffic switches to new deployment
4. Old deployment remains available for rollback

### Database Migrations
For Airtable schema changes:
1. Add new fields (don't remove old ones yet)
2. Deploy code that handles both old and new
3. Migrate data if needed
4. Deploy code that only uses new fields
5. Remove old fields from Airtable

---

## Environment Variables Reference

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API key | sk_live_xxx |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | whsec_xxx |
| `STRIPE_PRICE_ONEOFF` | One-off price ID | price_xxx |
| `STRIPE_PRICE_ESSENTIAL` | Essential price ID | price_xxx |
| `STRIPE_PRICE_UNLIMITED` | Unlimited price ID | price_xxx |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | ACxxx |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | xxx |
| `TWILIO_WHATSAPP_NUMBER` | WhatsApp number | whatsapp:+xxx |
| `AIRTABLE_API_KEY` | Airtable API key | patxxx |
| `AIRTABLE_BASE_ID` | Airtable base ID | appxxx |
| `RESEND_API_KEY` | Resend API key | re_xxx |
| `AUTH_SECRET` | JWT signing secret | (32 char hex) |
| `NEXT_PUBLIC_URL` | Production URL | https://flexlaundry.co.uk |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `CRON_SECRET` | Cron auth secret | (none - allows all) |
| `CMS_API_KEY` | Airtable automation key | (none) |
| `OPS_EMAIL` | Alert email | odellehogg@gmail.com |
| `TEMPLATE_*_SID` | Twilio template SIDs | (uses plain text) |

---

## Support Contacts

### Vercel
- Status: status.vercel.com
- Support: vercel.com/support

### Stripe
- Status: status.stripe.com
- Support: support.stripe.com

### Twilio
- Status: status.twilio.com
- Support: twilio.com/help

### Airtable
- Status: status.airtable.com
- Support: support.airtable.com

---

**Last Updated:** January 2025
