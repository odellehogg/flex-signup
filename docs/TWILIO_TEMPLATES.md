# FLEX WhatsApp Templates - MVP

## Overview

We only need **2 Content Templates** registered with Meta/Twilio for business-initiated messages.
Everything else uses dynamic Interactive Messages within the 24-hour session window.

---

## Template 1: flex_welcome

**Purpose:** Sent after successful Stripe payment (business-initiated, outside session window)

**Twilio Console Setup:**
1. Go to: Twilio Console → Messaging → Content Editor → Create New
2. Template Name: `flex_welcome`
3. Language: English (en)
4. Category: UTILITY (not MARKETING - better approval rates)

**Template Structure:**

```
Type: twilio/quick-reply

Body:
Welcome to FLEX, {{1}}! 🎽

Your {{2}} subscription is active at {{3}}.

Ready to drop off your first bag of sweaty gym clothes?

Quick Replies:
- Title: "How It Works"    |  Payload: HOW_IT_WORKS
- Title: "Start First Drop" |  Payload: START_DROP
```

**Variables:**
| Variable | Description | Example |
|----------|-------------|---------|
| {{1}} | First name | "Sarah" |
| {{2}} | Plan name | "Essential" |
| {{3}} | Gym name | "PureGym Shoreditch" |

**Content Variables JSON (for API):**
```json
{
  "1": "Sarah",
  "2": "Essential", 
  "3": "PureGym Shoreditch"
}
```

---

## Template 2: flex_ready_pickup

**Purpose:** Sent when drop status changes to "Ready" (business-initiated notification)

**Twilio Console Setup:**
1. Go to: Twilio Console → Messaging → Content Editor → Create New
2. Template Name: `flex_ready_pickup`
3. Language: English (en)
4. Category: UTILITY

**Template Structure:**

```
Type: twilio/quick-reply

Body:
Your clothes are ready! 🎉

Bag {{1}} is at {{2}} reception.
Available until {{3}}.

Just ask staff for your FLEX bag.

Quick Replies:
- Title: "On My Way"      |  Payload: ON_MY_WAY
- Title: "Need More Time" |  Payload: NEED_MORE_TIME
```

**Variables:**
| Variable | Description | Example |
|----------|-------------|---------|
| {{1}} | Bag number | "B042" |
| {{2}} | Gym name | "PureGym Shoreditch" |
| {{3}} | Available until | "Friday 8pm" |

**Content Variables JSON (for API):**
```json
{
  "1": "B042",
  "2": "PureGym Shoreditch",
  "3": "Friday 8pm"
}
```

---

## How to Create Templates in Twilio Console

### Step-by-Step:

1. **Log into Twilio Console**
   - https://console.twilio.com

2. **Navigate to Content Editor**
   - Left sidebar: Messaging → Content Editor
   - Or direct: https://console.twilio.com/us1/develop/sms/content-editor

3. **Create New Template**
   - Click "Create new" button
   - Select "Start from scratch"

4. **Configure Template**
   - Name: `flex_welcome` (exact - no spaces)
   - Language: English (en)
   - Category: UTILITY

5. **Build Content**
   - Select "Quick Reply" template type
   - Enter body text with {{1}}, {{2}}, {{3}} variables
   - Add quick reply buttons with exact payloads

6. **Submit for Approval**
   - Click "Submit for WhatsApp Approval"
   - Usually approved within 24-48 hours for UTILITY category

7. **Copy Content SID**
   - After creation, note the Content SID (starts with HX...)
   - Add to Vercel environment variables

---

## Environment Variables Needed

After creating templates, add these to Vercel:

```bash
# Twilio Content Template SIDs
TEMPLATE_WELCOME_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_READY_PICKUP_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## All Other Messages (Dynamic - No Template Needed)

These are sent within the 24-hour session window using Interactive Messages:

| Message | Trigger | Format |
|---------|---------|--------|
| Main Menu | Any inbound message | Quick Reply (3 buttons) |
| Drop Guide | "Start Drop" button | Quick Reply (1 button) |
| Bag Confirmed | Valid bag number | Quick Reply (2 buttons) |
| Track Order | "Track" button | Quick Reply (2 buttons) |
| Track None | "Track" with no drops | Quick Reply (2 buttons) |
| Account Info | "Account" button | Quick Reply (2 buttons) |
| Help Menu | "Help" button | Quick Reply (4 buttons) |
| Support Photo Ask | After issue description | Quick Reply (2 buttons) |
| Support Confirmed | After ticket created | Quick Reply (1 button) |

---

## Testing Templates Before Approval

While waiting for Meta approval, you can test using the **Twilio Sandbox**:

1. Send "join <your-sandbox-word>" to Twilio sandbox number
2. Templates work immediately in sandbox (no approval needed)
3. Test full flow before going live

---

## Troubleshooting

### Template Rejected?
- Make sure category is UTILITY not MARKETING
- Remove any promotional language
- Ensure variables are clearly transactional

### Content Variables Invalid?
- Variables must be strings: `"1": "value"` not `"1": 123`
- Use `JSON.stringify()` in code
- Variable keys are strings: `"1"` not `1`

### Template Not Sending?
- Check Content SID is correct (starts with HX)
- Verify env var is loaded: `console.log(process.env.TEMPLATE_WELCOME_SID)`
- Check user has opted in (messaged first or completed signup)

---

## Quick Reference

| Template | Content SID Env Var | Payload Buttons |
|----------|---------------------|-----------------|
| flex_welcome | TEMPLATE_WELCOME_SID | HOW_IT_WORKS, START_DROP |
| flex_ready_pickup | TEMPLATE_READY_PICKUP_SID | ON_MY_WAY, NEED_MORE_TIME |
