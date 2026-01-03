# WhatsApp Conversation Flows

## Overview

FLEX uses WhatsApp as the primary communication channel. All interactions are button-based (no free text parsing required) with plain text fallbacks for template failures.

## WhatsApp Number

**Production:** +447366907286  
**Twilio Account:** See environment variables

## Template Structure

Each template has:
1. **ContentSid template** (with buttons) - Preferred
2. **Plain text fallback** - Used if template fails

```javascript
// Example from lib/whatsapp.js
export async function sendWelcome(to, firstName, planName, gymName) {
  const contentSid = process.env.TEMPLATE_WELCOME_SID;
  
  if (contentSid) {
    try {
      await client.messages.create({
        from: FROM_NUMBER,
        to: `whatsapp:${to}`,
        contentSid,
        contentVariables: JSON.stringify({
          '1': firstName,
          '2': planName,
          '3': gymName
        })
      });
      return;
    } catch (err) {
      console.error('Template failed, using fallback:', err.message);
    }
  }
  
  // Plain text fallback
  await client.messages.create({
    from: FROM_NUMBER,
    to: `whatsapp:${to}`,
    body: `Welcome to FLEX, ${firstName}! Your ${planName} plan is now active at ${gymName}.\n\nReady to drop off your first bag? Reply:\n• HOW_IT_WORKS - See how it works\n• START_DROP - Make your first drop`
  });
}
```

## Conversation States

Stored in Airtable `Members.Conversation State`:

| State | Description |
|-------|-------------|
| `IDLE` | Default state, awaiting button press |
| `AWAITING_BAG_NUMBER` | User is entering bag number |
| `AWAITING_ISSUE_TYPE` | User selecting issue type |
| `AWAITING_ISSUE_DESCRIPTION` | User typing issue description |
| `AWAITING_ISSUE_PHOTO` | User sending photo (optional) |
| `AWAITING_GYM_SELECTION` | User selecting new gym |

## Main Menu Flow

```
MAIN_MENU
├── START_DROP → Drop Guide → AWAITING_BAG_NUMBER
├── TRACK_ORDER → Show active drops status
├── CHECK_DROPS → Show remaining drops
├── MANAGE_SUBSCRIPTION → Manage Menu
│   ├── PAUSE_SUBSCRIPTION → Pause confirmation
│   ├── RESUME_SUBSCRIPTION → Resume confirmation
│   ├── CHANGE_GYM → AWAITING_GYM_SELECTION
│   └── BILLING → Stripe portal link
└── HELP → Support Menu
    ├── REPORT_ISSUE → AWAITING_ISSUE_TYPE
    └── FAQ → FAQ responses
```

## Message Templates

### 1. Welcome (Business-Initiated)
**Trigger:** After Stripe checkout.session.completed
```
Welcome to FLEX, {firstName}! Your {planName} plan is now active at {gymName}.

Ready to drop off your first bag?

[How it works] [Make first drop]
```

### 2. Drop Confirmed (Business-Initiated)
**Trigger:** Bag number submitted
```
Got your FLEX bag! Bag {bagNumber} dropped at {gymName}.

Expected ready by {expectedDate}. We'll text you when your clothes are ready for pickup.

[Track order] [Main menu]
```

### 3. Ready for Pickup (Business-Initiated)
**Trigger:** Status changed to "Ready"
```
Your clothes are ready! 🎉

Bag {bagNumber} is waiting at {gymName} reception. Available until {availableUntil}.

Just ask for your FLEX bag.

[On my way] [Need more time]
```

### 4. Pickup Confirmed (Business-Initiated)
**Trigger:** Status changed to "Collected"
```
Pickup confirmed! Enjoy your fresh gym clothes.

Quick question - how was your FLEX experience this time?

[Great 😊] [OK 😐] [Not happy 😞]
```

### 5. Main Menu (User-Initiated)
**Trigger:** User sends "MENU" or presses Main Menu button
```
Hi {firstName}! What would you like to do?

[Start a drop] [Track order]
[Check drops] [Manage subscription]
[Help]
```

### 6. Drop Guide
**Trigger:** START_DROP button
```
Making a drop at {gymName}:

1️⃣ Go to reception and ask for a FLEX bag
2️⃣ Fill with gym clothes (tops, shorts, leggings, sports bras, towels, socks - no shoes)
3️⃣ Note the bag number on the tag
4️⃣ Leave at reception before 6pm

Reply with your bag number to track it (e.g., B042)
```

### 7. Check Drops
**Trigger:** CHECK_DROPS button
```
Your FLEX Status:

Plan: {planName}
Drops remaining: {dropsRemaining} of {totalDrops}
Subscription renews: {renewDate}

[Start a drop] [Main menu]
```

### 8. Track Active Orders
**Trigger:** TRACK_ORDER button
```
Your Active Orders:

📦 Bag B042 - Ready for pickup at Third Space
📦 Bag B051 - At laundry (ready by tomorrow)

[Main menu]
```

### 9. Manage Subscription Menu
**Trigger:** MANAGE_SUBSCRIPTION button
```
Manage your FLEX subscription:

Plan: {planName} (£{price}/month)
Status: {status}
Next billing: {nextBillingDate}

[Pause subscription] [Resume subscription]
[Change gym] [Billing & payments]
```

### 10. Support Menu
**Trigger:** HELP button
```
How can we help?

[Report an issue] [FAQ]
[Contact us] [Main menu]
```

### 11. Issue Type Selection
**Trigger:** REPORT_ISSUE button
```
What type of issue are you experiencing?

[Missing item] [Damage]
[Quality issue] [Billing]
[Other]
```

### 12. Issue Description
**Trigger:** Issue type selected
```
Please describe the issue in detail.

If it's about damage or a missing item, you can also send a photo.
```

### 13. Issue Confirmed
**Trigger:** Issue description received
```
We've received your report.

Issue type: {issueType}
Reference: #{ticketId}

Our team will respond within 24 hours. You'll get a WhatsApp update when we have news.

[Main menu]
```

## Button Payload Mapping

| Template Button | Payload |
|-----------------|---------|
| How it works | `HOW_IT_WORKS` |
| Make first drop | `START_DROP` |
| Track order | `TRACK_ORDER` |
| Main menu | `MAIN_MENU` |
| Start a drop | `START_DROP` |
| Check drops | `CHECK_DROPS` |
| Manage subscription | `MANAGE_SUBSCRIPTION` |
| Help | `HELP` |
| Pause subscription | `PAUSE_SUBSCRIPTION` |
| Resume subscription | `RESUME_SUBSCRIPTION` |
| Change gym | `CHANGE_GYM` |
| Billing & payments | `BILLING` |
| Report an issue | `REPORT_ISSUE` |
| FAQ | `FAQ` |
| On my way | `ON_MY_WAY` |
| Need more time | `NEED_MORE_TIME` |
| Great 😊 | `FEEDBACK_GREAT` |
| OK 😐 | `FEEDBACK_OK` |
| Not happy 😞 | `FEEDBACK_BAD` |

## Automated Messages

### Re-engagement (14 days inactive)
**Trigger:** Cron job at 10am daily
```
Hey {firstName}!

We haven't seen your gym clothes lately. You still have {dropsRemaining} drops remaining - they expire on {expiryDate}.

Ready to make a drop?

[How to drop] [Taking a break]
```

### Pause Reminder (3 days before resume)
**Trigger:** Cron job
```
Hi {firstName}!

Your FLEX subscription will resume on {resumeDate}. Your card will be charged then.

Want to extend your pause or jump back in early?

[Resume now] [Extend pause]
```

### Payment Failed
**Trigger:** Stripe invoice.payment_failed webhook
```
Hi {firstName},

We couldn't process your FLEX payment. Please update your payment method to keep your subscription active.

[Update payment]
```

## Error Handling

### Invalid Bag Number
```
Hmm, that doesn't look like a valid bag number.

Bag numbers are on the tag attached to the bag, like "B042".

Please check and try again, or reply MENU to go back.
```

### No Active Drops
```
You don't have any active drops right now.

Ready to make a drop?

[Start a drop] [Main menu]
```

### No Drops Remaining
```
You've used all your drops for this period.

Your drops reset on {resetDate}, or you can upgrade your plan.

[Upgrade plan] [Main menu]
```

## Testing

### Sandbox Numbers
For development, use Twilio sandbox:
- `whatsapp:+14155238886` (Twilio sandbox)

### Template Approval
Business-initiated templates require Meta approval:
1. Submit templates in Twilio Console > Content Editor
2. Wait for Meta approval (usually 24-48 hours)
3. Add ContentSid to environment variables

### Testing Checklist
- [ ] Welcome message after signup
- [ ] Main menu from "MENU" text
- [ ] All button payloads trigger correct handlers
- [ ] Bag number validation
- [ ] Drop status updates
- [ ] Pickup confirmation
- [ ] Feedback handling
- [ ] Issue reporting flow
- [ ] Pause/resume flow
- [ ] Plain text fallbacks work
