# Deployment Guide

## Overview

FLEX is deployed on Vercel with automatic deployments from GitHub.

## Prerequisites

- GitHub account with access to repository
- Vercel account
- All third-party accounts set up (Stripe, Twilio, Airtable, Resend)

## Initial Setup

### 1. Fork/Clone Repository

```bash
git clone https://github.com/odellehogg/flex-signup.git
cd flex-signup
npm install
```

### 2. Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

### 3. Configure Environment Variables

1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Add all variables from [ENV-SETUP.md](./ENV-SETUP.md)
3. Set Production/Preview/Development as needed

### 4. Configure Webhooks

#### Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) > Developers > Webhooks
2. Add endpoint: `https://flexlaundry.co.uk/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

#### Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com) > Messaging > Settings > WhatsApp Sandbox Settings
2. Set webhook URL: `https://flexlaundry.co.uk/api/webhooks/whatsapp`
3. Method: POST

### 5. Configure Airtable Automations

Create automation for drop status notifications:

1. Go to Airtable > FLEX base > Automations
2. Create automation:
   - **Trigger:** When record matches condition
   - **Table:** Drops
   - **Condition:** Status changed to "Ready"
   - **Action:** Run script
   
   ```javascript
   const config = input.config();
   const dropId = config.dropId;
   
   await fetch('https://flexlaundry.co.uk/api/notify-drop-status', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ dropId, newStatus: 'Ready' })
   });
   ```

### 6. Configure Cron Jobs

In Vercel Dashboard > Project > Settings > Cron Jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/reengagement",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/payment-retry",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/pause-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

Or add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/reengagement",
      "schedule": "0 10 * * *"
    }
  ]
}
```

## Deployment

### Automatic Deployment

Push to `main` branch triggers automatic deployment:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Deployment

```bash
# Deploy to production
vercel --prod

# Deploy preview (for testing)
vercel
```

## Domain Setup

### Custom Domain

1. Go to Vercel Dashboard > Project > Settings > Domains
2. Add domain: `flexlaundry.co.uk`
3. Configure DNS at your registrar:
   - A record: `76.76.19.19`
   - CNAME: `cname.vercel-dns.com`

### SSL

Vercel automatically provisions SSL certificates.

## Post-Deployment Checklist

### 1. Verify Webhooks

**Stripe:**
```bash
# Trigger test event
stripe trigger checkout.session.completed
```

**Twilio:**
- Send WhatsApp message to FLEX number
- Check response received

### 2. Test Checkout Flow

1. Visit `https://flexlaundry.co.uk/join?gym=test-gym`
2. Complete checkout with test card
3. Verify:
   - [ ] Member created in Airtable
   - [ ] WhatsApp welcome received
   - [ ] Email confirmation received

### 3. Test Portal

1. Visit `https://flexlaundry.co.uk/portal`
2. Request login code
3. Verify code received on WhatsApp
4. Login and check dashboard

### 4. Test Ops Dashboard

1. Visit `https://flexlaundry.co.uk/ops`
2. Login with ops credentials
3. Verify metrics display correctly

## Monitoring

### Vercel Logs

View function logs:
1. Vercel Dashboard > Project > Deployments > Select deployment > Functions

### Error Tracking

Check logs for:
- Webhook failures
- API errors
- Cron job status

### Health Check

Endpoint: `GET /api/health`

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "services": {
    "airtable": "connected",
    "stripe": "connected",
    "twilio": "connected"
  }
}
```

## Rollback

### Instant Rollback

1. Go to Vercel Dashboard > Project > Deployments
2. Find previous working deployment
3. Click "..." > "Promote to Production"

### Code Rollback

```bash
git revert HEAD
git push origin main
```

## Scaling

Vercel automatically scales serverless functions. No manual scaling needed.

### Limits

- Function timeout: 10s (default)
- Memory: 1024MB
- Concurrent executions: Varies by plan

### Increase Limits

In `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

## Troubleshooting Deployments

### Build Failures

1. Check build logs in Vercel Dashboard
2. Common issues:
   - Missing dependencies
   - TypeScript errors
   - ESLint errors

### Runtime Errors

1. Check function logs
2. Common issues:
   - Missing environment variables
   - API rate limits
   - Timeout errors

### Webhook Issues

1. Check webhook logs in Stripe/Twilio dashboards
2. Verify URL is correct (www vs non-www)
3. Verify signature secret matches
