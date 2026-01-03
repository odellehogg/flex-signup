# Environment Setup

## Overview

FLEX requires environment variables for all third-party services. These are stored in Vercel for production and `.env.local` for development.

## Required Variables

### Stripe

```bash
# API Keys
STRIPE_SECRET_KEY=sk_live_xxx    # Live key for production
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Webhook signing secret

# Price IDs (from Stripe Dashboard > Products)
STRIPE_PRICE_ONEOFF=price_xxx     # One-Off £5 price
STRIPE_PRICE_ESSENTIAL=price_xxx  # Essential £35/month price
STRIPE_PRICE_UNLIMITED=price_xxx  # Unlimited £48/month price

# Optional
STRIPE_COUPON_20_OFF=coupon_xxx   # 20% off retention coupon
```

**How to get:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. API Keys: Developers > API Keys
3. Webhook Secret: Developers > Webhooks > Your endpoint > Signing secret
4. Price IDs: Products > Select product > Price ID

---

### Twilio (WhatsApp)

```bash
# Account credentials
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx

# WhatsApp number
TWILIO_WHATSAPP_NUMBER=whatsapp:+447366907286

# Template Content SIDs (from Twilio Console > Content Editor)
TEMPLATE_WELCOME_SID=HXxxx
TEMPLATE_DROP_CONFIRMED_SID=HXxxx
TEMPLATE_READY_PICKUP_SID=HXxxx
TEMPLATE_PICKUP_CONFIRMED_SID=HXxxx
TEMPLATE_MAIN_MENU_SID=HXxxx
TEMPLATE_DROP_GUIDE_SID=HXxxx
TEMPLATE_CHECK_DROPS_SID=HXxxx
TEMPLATE_TRACK_ACTIVE_SID=HXxxx
TEMPLATE_TRACK_NONE_SID=HXxxx
TEMPLATE_MANAGE_SUB_SID=HXxxx
TEMPLATE_SUPPORT_MENU_SID=HXxxx
TEMPLATE_SUPPORT_CONFIRM_SID=HXxxx
TEMPLATE_PAUSE_CONFIRMED_SID=HXxxx
TEMPLATE_RESUME_CONFIRMED_SID=HXxxx
TEMPLATE_REENGAGEMENT_SID=HXxxx
TEMPLATE_PAUSE_REMINDER_SID=HXxxx
```

**How to get:**
1. Go to [Twilio Console](https://console.twilio.com)
2. Account SID & Auth Token: Dashboard home
3. WhatsApp Number: Messaging > Senders > WhatsApp Senders
4. Content SIDs: Messaging > Content Editor > Select template > SID

**Note:** Template SIDs are optional - the system falls back to plain text if not set.

---

### Airtable

```bash
AIRTABLE_API_KEY=patxxx       # Personal Access Token
AIRTABLE_BASE_ID=appkU13tG14ZLVZZ9  # Your base ID
```

**How to get:**
1. Go to [Airtable](https://airtable.com/create/tokens)
2. Create personal access token with:
   - Scope: `data.records:read`, `data.records:write`
   - Access: Your FLEX base
3. Base ID: Found in base URL: `airtable.com/appXXX/...`

---

### Resend (Email)

```bash
RESEND_API_KEY=re_xxx
```

**How to get:**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create API key

**Note:** Domain must be verified in Resend for `@flexlaundry.co.uk` sending.

---

### Security

```bash
# Cron job authentication
CRON_SECRET=xxx

# Ops dashboard authentication
OPS_AUTH_TOKEN=xxx

# JWT signing (for auth tokens)
JWT_SECRET=xxx
```

**How to generate:**
```bash
# Generate secure random secrets
openssl rand -hex 32  # For CRON_SECRET
openssl rand -hex 32  # For OPS_AUTH_TOKEN
openssl rand -hex 32  # For JWT_SECRET
```

---

### Application

```bash
# Base URL for callbacks
NEXT_PUBLIC_BASE_URL=https://flexlaundry.co.uk

# Ops notification email
OPS_EMAIL=odellehogg@gmail.com
```

---

## Complete .env.example

```bash
# =============================================================================
# STRIPE
# =============================================================================
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ONEOFF=price_xxx
STRIPE_PRICE_ESSENTIAL=price_xxx
STRIPE_PRICE_UNLIMITED=price_xxx
STRIPE_COUPON_20_OFF=

# =============================================================================
# TWILIO (WhatsApp)
# =============================================================================
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+447366907286

# Template SIDs (optional - falls back to plain text)
TEMPLATE_WELCOME_SID=
TEMPLATE_DROP_CONFIRMED_SID=
TEMPLATE_READY_PICKUP_SID=
TEMPLATE_PICKUP_CONFIRMED_SID=
TEMPLATE_MAIN_MENU_SID=
TEMPLATE_DROP_GUIDE_SID=
TEMPLATE_CHECK_DROPS_SID=
TEMPLATE_TRACK_ACTIVE_SID=
TEMPLATE_TRACK_NONE_SID=
TEMPLATE_MANAGE_SUB_SID=
TEMPLATE_SUPPORT_MENU_SID=
TEMPLATE_SUPPORT_CONFIRM_SID=
TEMPLATE_PAUSE_CONFIRMED_SID=
TEMPLATE_RESUME_CONFIRMED_SID=
TEMPLATE_REENGAGEMENT_SID=
TEMPLATE_PAUSE_REMINDER_SID=

# =============================================================================
# AIRTABLE
# =============================================================================
AIRTABLE_API_KEY=patxxx
AIRTABLE_BASE_ID=appkU13tG14ZLVZZ9

# =============================================================================
# RESEND (Email)
# =============================================================================
RESEND_API_KEY=re_xxx

# =============================================================================
# SECURITY
# =============================================================================
CRON_SECRET=xxx
OPS_AUTH_TOKEN=xxx
JWT_SECRET=xxx

# =============================================================================
# APPLICATION
# =============================================================================
NEXT_PUBLIC_BASE_URL=https://flexlaundry.co.uk
OPS_EMAIL=odellehogg@gmail.com
```

---

## Vercel Setup

### Adding Variables

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add each variable with appropriate environment:
   - Production: Live keys
   - Preview: Test keys (optional)
   - Development: Test keys

### After Adding/Changing Variables

Variables are NOT automatically applied. You must:

1. **Redeploy** the project for changes to take effect
2. Or use Vercel CLI to verify:
   ```bash
   vercel env pull .env.local
   ```

---

## Local Development

### Setup

```bash
# Copy example file
cp .env.example .env.local

# Fill in values (use test keys for development)
# Edit .env.local with your values
```

### Test Keys

For development, use Stripe test mode:
- Test keys start with `sk_test_`
- Use test card: `4242 4242 4242 4242`

For Twilio, use sandbox:
- Sandbox number: `whatsapp:+14155238886`
- Join sandbox in Twilio Console

---

## Troubleshooting

### "Environment variable not found"

1. Check variable is set in Vercel Dashboard
2. Ensure correct environment (Production/Preview/Development)
3. Redeploy after adding variables
4. Check for typos in variable names

### "Invalid API key"

1. Ensure using correct key type (test vs live)
2. Check key hasn't been revoked
3. Verify key has necessary permissions

### "Webhook signature verification failed"

1. Ensure STRIPE_WEBHOOK_SECRET matches endpoint in Stripe Dashboard
2. Ensure using raw request body for verification
3. Check webhook URL matches exactly (www vs non-www)

### Templates not sending

1. Template SID might not be set - check Vercel env vars
2. Template might not be approved by Meta - check Twilio Console
3. Fallback plain text should work - check logs
