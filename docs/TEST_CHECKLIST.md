# FLEX WhatsApp MVP - Test Checklist

## Pre-Deployment Setup

### Twilio Templates
- [ ] Create `flex_welcome` template in Twilio Console
  - [ ] Copy Content SID to TEMPLATE_WELCOME_SID env var
  - [ ] Submit for Meta approval
  - [ ] Verify approval (allow 24-48 hours)
- [ ] Create `flex_ready_pickup` template in Twilio Console
  - [ ] Copy Content SID to TEMPLATE_READY_PICKUP_SID env var
  - [ ] Submit for Meta approval
  - [ ] Verify approval (allow 24-48 hours)

### Environment Variables (Vercel)
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN
- [ ] TWILIO_WHATSAPP_NUMBER
- [ ] TEMPLATE_WELCOME_SID
- [ ] TEMPLATE_READY_PICKUP_SID
- [ ] AIRTABLE_API_KEY
- [ ] AIRTABLE_BASE_ID
- [ ] STRIPE_SECRET_KEY
- [ ] RESEND_API_KEY
- [ ] FROM_EMAIL
- [ ] ADMIN_EMAIL
- [ ] CRON_SECRET
- [ ] OPS_AUTH_TOKEN

### Airtable Schema
- [ ] Members table has fields:
  - [ ] Phone Number
  - [ ] Email
  - [ ] First Name
  - [ ] Last Name
  - [ ] Gym (linked to Gyms)
  - [ ] Subscription Tier
  - [ ] Status
  - [ ] Conversation State
  - [ ] State Data
  - [ ] Drops Used This Month
  - [ ] Stripe Customer ID
  - [ ] Stripe Subscription ID
- [ ] Drops table has fields:
  - [ ] Bag Number
  - [ ] Member (linked to Members)
  - [ ] Gym (linked to Gyms)
  - [ ] Status
  - [ ] Drop Date
  - [ ] Expected Ready Date
  - [ ] Extended Once (checkbox)
- [ ] Issues table has fields:
  - [ ] Ticket ID
  - [ ] Member (linked to Members)
  - [ ] Type
  - [ ] Description
  - [ ] Status
  - [ ] Photo (attachment)
  - [ ] Created At
  - [ ] Resolution Notes

### Twilio Webhook Configuration
- [ ] Set WhatsApp webhook URL to: `https://flexlaundry.co.uk/api/webhooks/whatsapp`
- [ ] Method: POST
- [ ] Test webhook connectivity

---

## Flow Testing

### Test 1: Main Menu Display
**Trigger:** Send any message (e.g., "Hi")
**Expected:**
- [ ] Response within 3 seconds
- [ ] Shows "Hey [Name]! What would you like to do?"
- [ ] Shows 3 options: Start Drop, Track Bag, My Account
- [ ] Numbered fallback works (reply "1", "2", or "3")

### Test 2: How It Works
**Trigger:** New member taps "How It Works" from welcome
**Expected:**
- [ ] Shows 3-step explanation
- [ ] Shows "Start First Drop" and "Main Menu" options

### Test 3: Start Drop Flow
**Trigger:** Tap "Start Drop" button
**Expected:**
- [ ] Shows drop guide with gym name
- [ ] Prompts for bag number
- [ ] "Back to Menu" option available

### Test 4: Bag Number - Valid
**Trigger:** Reply with "B042" (or similar valid format)
**Expected:**
- [ ] Confirmation message with bag number
- [ ] Shows expected ready date (48 hours)
- [ ] Drop record created in Airtable
- [ ] Status set to "Dropped"
- [ ] "Track This Bag" option available

### Test 5: Bag Number - Invalid
**Trigger:** Reply with "42" or "mybag" or other invalid format
**Expected:**
- [ ] Shows "doesn't look like a bag number" message
- [ ] Shows example format (B001, B042, B123)
- [ ] Allows retry or cancel

### Test 6: Track Order - No Drops
**Trigger:** Tap "Track Bag" with no active drops
**Expected:**
- [ ] Shows "no active drops" message
- [ ] Shows drops remaining for month
- [ ] "Start a Drop" option available

### Test 7: Track Order - Single Drop
**Trigger:** Tap "Track Bag" with 1 active drop
**Expected:**
- [ ] Shows bag number and status
- [ ] Shows status detail (e.g., "Being cleaned with care")
- [ ] Shows expected date
- [ ] "Refresh" and "Main Menu" options

### Test 8: Track Order - Multiple Drops
**Trigger:** Tap "Track Bag" with 2+ active drops
**Expected:**
- [ ] Shows all active drops inline
- [ ] Each has status emoji and detail
- [ ] Ready drops show location
- [ ] In-progress drops show expected date

### Test 9: My Account
**Trigger:** Tap "My Account"
**Expected:**
- [ ] Shows plan name
- [ ] Shows gym name
- [ ] Shows drops used/total
- [ ] Shows renewal date
- [ ] "Manage Account" option available

### Test 10: Manage Account - Portal Link
**Trigger:** Tap "Manage Account"
**Expected:**
- [ ] Shows Stripe Customer Portal link
- [ ] Link is valid and opens portal
- [ ] Lists what can be done in portal
- [ ] "Main Menu" option available

### Test 11: Help Menu
**Trigger:** Tap "Help" (or send "help")
**Expected:**
- [ ] Shows 4 options: Damaged, Missing, Billing, Other
- [ ] Numbered fallback works (1-4)

### Test 12: Support - Damaged Item
**Trigger:** Select "Damaged Item" from Help
**Expected:**
- [ ] Prompts for description
- [ ] After description, asks for photo
- [ ] "Yes, I'll Send One" and "No Photo" options

### Test 13: Support - With Photo
**Trigger:** Tap "Yes" then send photo
**Expected:**
- [ ] Photo received and processed
- [ ] Ticket created in Airtable with photo
- [ ] Email sent to admin with photo
- [ ] Confirmation shown with ticket ID
- [ ] Confirmation email sent to user (if email on file)

### Test 14: Support - Without Photo
**Trigger:** Tap "No Photo"
**Expected:**
- [ ] Ticket created without photo
- [ ] Email sent to admin
- [ ] Confirmation shown with ticket ID

### Test 15: Support - Billing Issue
**Trigger:** Select "Billing Issue" from Help
**Expected:**
- [ ] Prompts for description
- [ ] After description, creates ticket immediately (no photo ask)
- [ ] Confirmation with ticket ID

---

## Business-Initiated Message Testing

### Test 16: Welcome Message (Post-Signup)
**Trigger:** Manually call welcome send function or test via Stripe webhook
**Expected:**
- [ ] Template message sent successfully
- [ ] Shows name, plan, gym
- [ ] "How It Works" and "Start First Drop" buttons work
- [ ] If template fails, fallback text sent

### Test 17: Ready for Pickup Notification
**Trigger:** Call notify-drop-status API with status "Ready"
```bash
curl -X POST https://flexlaundry.co.uk/api/notify-drop-status \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dropId": "recXXX", "status": "Ready", "memberId": "recYYY", "bagNumber": "B042"}'
```
**Expected:**
- [ ] Template message sent successfully
- [ ] Shows bag number, gym, availability
- [ ] "On My Way" and "Need More Time" buttons work
- [ ] If template fails, fallback text sent

### Test 18: On My Way Response
**Trigger:** Tap "On My Way" from ready notification
**Expected:**
- [ ] Confirmation message with bag and gym
- [ ] Friendly "see you soon" message

### Test 19: Need More Time - First Request
**Trigger:** Tap "Need More Time" from ready notification
**Expected:**
- [ ] Confirmation of extension
- [ ] Shows new availability date (+24 hours)
- [ ] Drop record updated (Extended Once = true)

### Test 20: Need More Time - Second Request
**Trigger:** Tap "Need More Time" again for same bag
**Expected:**
- [ ] Shows "can only extend once" message
- [ ] Offers support ticket option
- [ ] "Get Help" creates Collection Issue ticket

---

## Airtable Automation Testing

### Test 21: Status Change Automation
**Setup:** Create Airtable automation that calls /api/notify-drop-status when Drop status changes to "Ready"
**Trigger:** Manually change a Drop status to "Ready" in Airtable
**Expected:**
- [ ] API endpoint called successfully
- [ ] WhatsApp notification sent to member
- [ ] Logs show successful delivery

---

## Edge Cases

### Test 22: Unknown Phone Number
**Trigger:** Send message from number not in Members table
**Expected:**
- [ ] Shows "couldn't find your account" message
- [ ] Suggests checking phone number

### Test 23: Member Without Gym
**Trigger:** Member with no gym linked tries to start drop
**Expected:**
- [ ] Shows "your gym" as placeholder
- [ ] Flow still works

### Test 24: Long Response Handling
**Trigger:** Send very long support description (500+ chars)
**Expected:**
- [ ] Description truncated or handled gracefully
- [ ] Ticket still created

### Test 25: Multiple Rapid Messages
**Trigger:** Send 5 messages quickly in succession
**Expected:**
- [ ] Each message processed
- [ ] No duplicate responses
- [ ] State remains consistent

### Test 26: Session Timeout
**Trigger:** Start drop flow, wait 25 hours, then send bag number
**Expected:**
- [ ] Session window expired handling
- [ ] Shows main menu or asks to start again

---

## Performance Testing

### Test 27: Response Time
**Trigger:** Send "hi" and measure response time
**Expected:**
- [ ] Response in < 3 seconds
- [ ] Airtable query < 500ms
- [ ] WhatsApp send < 500ms

### Test 28: Cold Start
**Trigger:** Wait 10 minutes, then send message
**Expected:**
- [ ] Response in < 5 seconds (including cold start)

---

## Email Testing

### Test 29: Admin Notification Email
**Trigger:** Create support ticket
**Expected:**
- [ ] Email arrives at admin address
- [ ] Contains member details
- [ ] Contains issue description
- [ ] Photo embedded (if provided)
- [ ] Reply-to set to member email

### Test 30: User Confirmation Email
**Trigger:** Create support ticket (member has email)
**Expected:**
- [ ] Email arrives at member address
- [ ] Contains ticket ID
- [ ] Explains next steps
- [ ] Professional formatting

---

## Checklist Summary

| Category | Tests | Passed |
|----------|-------|--------|
| Setup | 3 | [ ] |
| Main Flows | 10 | [ ] |
| Support | 4 | [ ] |
| Business-Initiated | 5 | [ ] |
| Automation | 1 | [ ] |
| Edge Cases | 5 | [ ] |
| Performance | 2 | [ ] |
| Email | 2 | [ ] |
| **TOTAL** | **32** | **[ ]** |

---

## Quick Debug Commands

```bash
# Test webhook is responding
curl https://flexlaundry.co.uk/api/webhooks/whatsapp

# Test drop notification endpoint
curl https://flexlaundry.co.uk/api/notify-drop-status

# Test ticket update endpoint
curl https://flexlaundry.co.uk/api/update-ticket

# Check Vercel logs
vercel logs --follow

# Check env vars are set
vercel env ls
```

---

## Go-Live Checklist

- [ ] All 32 tests passing
- [ ] Templates approved by Meta
- [ ] Stripe in live mode
- [ ] Domain verified for emails
- [ ] Airtable automations configured
- [ ] Error monitoring set up
- [ ] Admin email receiving notifications
- [ ] Response times acceptable (<3s)
