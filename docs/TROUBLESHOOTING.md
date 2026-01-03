# Troubleshooting Guide

## Quick Diagnosis

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| WhatsApp returns "OK" only | Template SIDs not set | Check env vars or use plain text fallback |
| "Content Variables invalid" | Wrong variable format | Use JSON.stringify for contentVariables |
| Webhook 404 | Route not deployed | Check vercel.json, redeploy |
| Member not created | Webhook not receiving | Check Stripe webhook config |
| Drops query empty | Linked record query wrong | Use ARRAYJOIN formula |

---

## WhatsApp Issues

### Problem: Customers receive generic "OK" instead of menu

**Cause:** Template ContentSid not configured or template not approved.

**Solution:**
1. Check if `TEMPLATE_*_SID` env vars are set in Vercel
2. If not approved, the plain text fallback should work
3. Check function logs for template errors

```javascript
// Templates should fall back automatically:
if (contentSid) {
  try {
    await client.messages.create({ contentSid, ... });
    return;
  } catch (err) {
    console.error('Template failed:', err.message);
    // Falls through to plain text
  }
}
// Plain text fallback runs here
```

### Problem: "Content Variables parameter is invalid"

**Cause:** Variables not properly stringified.

**Solution:**
```javascript
// WRONG
contentVariables: { '1': firstName }

// CORRECT
contentVariables: JSON.stringify({ '1': firstName })
```

### Problem: Button payloads not triggering handlers

**Cause:** Mismatch between template payload and code handler.

**Solution:** Check `lib/constants.js` BUTTON_PAYLOADS matches Twilio templates:

| Template Button | Expected Payload |
|-----------------|------------------|
| How it works | `HOW_IT_WORKS` |
| Start a drop | `START_DROP` |
| Track order | `TRACK_ORDER` |
| Main menu | `MAIN_MENU` |

### Problem: Duplicate messages sent

**Cause:** Multiple code paths triggered or retry logic.

**Solution:**
1. Check for multiple handlers matching same payload
2. Add idempotency checks using conversation state
3. Check if webhook is being called multiple times

---

## Stripe Issues

### Problem: Webhook returns 404

**Cause:** Route not found or wrong URL.

**Solution:**
1. Verify route file exists at `app/api/webhooks/stripe/route.js`
2. Check URL matches: `https://flexlaundry.co.uk/api/webhooks/stripe`
3. Redeploy after any route changes

### Problem: Webhook signature verification failed

**Cause:** Secret mismatch or modified body.

**Solution:**
1. Get signing secret from Stripe Dashboard > Webhooks > Your endpoint
2. Update `STRIPE_WEBHOOK_SECRET` in Vercel
3. Ensure using raw request body:

```javascript
const body = await request.text();  // NOT request.json()
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, sig, secret);
```

### Problem: Member not created after checkout

**Cause:** Webhook not receiving or failing.

**Solution:**
1. Check Stripe Dashboard > Webhooks > Recent attempts
2. Look for failed deliveries
3. Check Vercel function logs for errors
4. Verify checkout.session.completed event is selected

### Problem: Subscription not syncing

**Cause:** Missing webhook events.

**Solution:** Ensure these events are selected in Stripe:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## Airtable Issues

### Problem: AbortSignal error

**Cause:** Airtable npm package incompatible with serverless.

**Solution:** Use direct REST API instead:

```javascript
// WRONG - npm package
const Airtable = require('airtable');
const base = new Airtable({ apiKey }).base(baseId);

// CORRECT - REST API
const response = await fetch(
  `https://api.airtable.com/v0/${baseId}/Members`,
  {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### Problem: Linked record query returns empty

**Cause:** Can't directly filter by linked record content.

**Solution:** Use ARRAYJOIN in filter formula:

```javascript
// WRONG
filterByFormula: `{Member} = '${memberId}'`

// CORRECT
filterByFormula: `FIND('${memberId}', ARRAYJOIN({Member}))`
```

### Problem: Rate limiting (429 errors)

**Cause:** Too many API calls.

**Solution:**
1. Add retry logic with exponential backoff
2. Batch requests where possible
3. Cache frequently accessed data

```javascript
async function retryAirtable(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.statusCode === 429 && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}
```

---

## Authentication Issues

### Problem: Login code not received

**Cause:** WhatsApp message failed.

**Solution:**
1. Check phone number format (must be E.164: +447123456789)
2. Check Twilio logs for send failures
3. Verify member exists in Airtable

### Problem: "Code expired" error

**Cause:** 15-minute code expiry.

**Solution:** Request new code. Codes expire after 15 minutes.

### Problem: "Max attempts exceeded"

**Cause:** 3 wrong code attempts.

**Solution:** Request new code. After 3 failures, previous code is invalidated.

### Problem: JWT verification failed

**Cause:** Invalid or expired token.

**Solution:**
1. Clear `flex_auth` cookie
2. Request new login code
3. Verify `JWT_SECRET` matches between requests

---

## Vercel Issues

### Problem: Environment variables not loading

**Cause:** Variables not deployed or wrong environment.

**Solution:**
1. Go to Vercel Dashboard > Settings > Environment Variables
2. Verify variable exists and is set for correct environment
3. Redeploy after changes:
```bash
vercel --prod
```

### Problem: Function timeout

**Cause:** Operation taking too long (>10s default).

**Solution:**
1. Optimize slow operations
2. Increase timeout in vercel.json:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Problem: Cold start delays

**Cause:** Serverless function spinning up.

**Solution:**
1. Keep functions small and focused
2. Use edge functions where possible
3. Consider Vercel's serverless pre-warming (paid plans)

---

## Portal Issues

### Problem: Dashboard shows wrong drops count

**Cause:** Query not filtering correctly.

**Solution:**
1. Check member ID is correct
2. Verify Airtable query uses ARRAYJOIN:
```javascript
filterByFormula: `AND(
  FIND('${memberId}', ARRAYJOIN({Member})),
  NOT({Status} = 'Collected')
)`
```

### Problem: Subscription status not updating

**Cause:** Stripe sync issue.

**Solution:**
1. Check Stripe subscription status directly
2. Verify webhook is updating Airtable
3. Manual fix in Airtable if needed

---

## Common Error Messages

### "Member not found"
- Check phone number format
- Verify member exists in Airtable
- Check for typos in phone number

### "Invalid gym code"
- Check gym exists in Airtable Gyms table
- Verify gym code field matches URL parameter
- Check gym status is "Active"

### "No drops remaining"
- Check Airtable Drops Remaining field
- Verify subscription is active
- Check billing date for reset

### "Subscription not active"
- Check Stripe subscription status
- Verify payment method is valid
- Check for failed payments

---

## Debug Mode

Enable verbose logging by adding to function:

```javascript
const DEBUG = process.env.DEBUG === 'true';

function debug(...args) {
  if (DEBUG) console.log('[DEBUG]', ...args);
}

// Usage
debug('Processing message:', payload);
debug('Member found:', member.id);
```

Set `DEBUG=true` in Vercel environment variables for troubleshooting.

---

## Getting Help

1. **Check logs:** Vercel Dashboard > Deployments > Function Logs
2. **Check external services:** Stripe Dashboard, Twilio Console, Airtable
3. **Contact:** odellehogg@gmail.com for urgent issues
