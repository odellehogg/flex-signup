# FLEX WhatsApp Templates - MVP
## Twilio Content Templates Setup Guide

---

## Overview

You need to create **12 templates** in Twilio Console → Messaging → Content Editor.
These are the ONLY templates needed for the MVP.

**Important Notes:**
- Templates with variables use `{{1}}`, `{{2}}`, etc.
- Quick Reply buttons are for user-initiated responses (within 24hr window)
- Business-initiated templates (WELCOME, READY_PICKUP) need Meta approval
- All other templates work immediately within a conversation

---

## Template 1: WELCOME (Business-Initiated)

**Name:** `flex_welcome`
**Type:** Quick Reply
**Category:** UTILITY
**Needs Meta Approval:** ✅ Yes

**Body:**
```
Welcome to FLEX, {{1}}! 🎽

Your {{2}} plan is active at {{3}}.

Ready to drop off your first bag of gym clothes?
```

**Variables:**
- `{{1}}` = firstName
- `{{2}}` = planName  
- `{{3}}` = gymName

**Buttons:**
| Button Text | Payload |
|-------------|---------|
| How it works | HOW |
| Start my first drop | DROP |

---

## Template 2: READY_PICKUP (Business-Initiated)

**Name:** `flex_ready_pickup`
**Type:** Quick Reply
**Category:** UTILITY
**Needs Meta Approval:** ✅ Yes

**Body:**
```
Your clothes are ready! 🎉

Bag {{1}} is at {{2}} reception.
Available until {{3}}.

Just ask staff for your FLEX bag.
```

**Variables:**
- `{{1}}` = bagNumber
- `{{2}}` = gymName
- `{{3}}` = availableUntil (e.g., "Sat 15 Jan")

**Buttons:**
| Button Text | Payload |
|-------------|---------|
| I'm on my way | OMW |
| Need more time | MORE_TIME |

---

## Template 3: MAIN_MENU

**Name:** `flex_main_menu`
**Type:** Quick Reply
**Category:** UTILITY

**Body:**
```
Hey {{1}}! 👋 What would you like to do?
```

**Variables:**
- `{{1}}` = firstName

**Buttons:**
| Button Text | Payload |
|-------------|---------|
| Start a drop | DROP |
| Track my bag | TRACK |
| My account | ACCOUNT |
| Get help | HELP |

---

## Template 4: DROP_GUIDE

**Name:** `flex_drop_guide`
**Type:** Text (no buttons - expecting text input)
**Category:** UTILITY

**Body:**
```
Making a drop at {{1}}:

1️⃣ Grab a FLEX bag from reception
2️⃣ Fill with gym clothes (no shoes)
3️⃣ Note the bag number on the tag
4️⃣ Leave at reception before 6pm

📝 Reply with your bag number (e.g. B042 or just 42)
```

**Variables:**
- `{{1}}` = gymName

**Buttons:** None (awaiting text input)

---

## Template 5: BAG_CONFIRMED

**Name:** `flex_bag_confirmed`
**Type:** Quick Reply
**Category:** UTILITY

**Body:**
```
Got it! ✅

Bag {{1}} logged at {{2}}.
Expected ready: {{3}}

We'll text you when it's ready for pickup.
```

**Variables:**
- `{{1}}` = bagNumber
- `{{2}}` = gymName
- `{{3}}` = expectedDate

**Buttons:**
| Button Text | Payload |
|-------------|---------|
| Track this bag | TRACK |
| Main menu | MENU |

---

## Template 6: TRACK_SINGLE

**Name:** `flex_track_single`
**Type:** Quick Reply
**Category:** UTILITY

**Body:**
```
📦 Bag {{1}}

Status: {{2}}
{{3}}
Expected: {{4}}
```

**Variables:**
- `{{1}}` = bagNumber
- `{{2}}` = status (e.g., "At Laundry 🧺")
- `{{3}}` = statusDetail (e.g., "Being professionally cleaned")
- `{{4}}` = expectedDate

**Buttons:**
| Button Text | Payload |
|-------------|---------|
| Refresh | REFRESH |
| Main menu | MENU |

---

## Template 7: TRACK_MULTIPLE

**Name:** `flex_track_multiple`
**Type:** Text
**Category:** UTILITY

**Body:**
```
You have {{1}} active drops:

{{2}}

Reply with a bag number to see details.
```

**Variables:**
- `{{1}}` = count
- `{{2}}` = dropsList (formatted list)

**Buttons:** None (expecting bag number input)

---

## Template 8: TRACK_NONE

**Name:** `flex_track_none`
**Type:** Quick Reply
**Category:** UTILITY

**Body:**
```
You don't have any active drops right now.

Drops this month: {{1}}/{{2}}
```

**Variables:**
- `{{1}}` = dropsUsed
- `{{2}}` = dropsTotal

**Buttons:**
| Button Text | Payload |
|-------------|---------|
| Start a drop | DROP |
| Main menu | MENU |

---

## Template 9: ACCOUNT_INFO

**Name:** `flex_account_info`
**Type:** Quick Reply
**Category:** UTILITY

**Body:**
```
👤 Your FLEX Account

Plan: {{1}}
Gym: {{2}}
Drops: {{3}}/{{4}} used this month
Renews: {{5}}

Need to update billing or change your plan?
👉 flexlaundry.co.uk/portal
```

**Variables:**
- `{{1}}` = planName
- `{{2}}` = gymName
- `{{3}}` = dropsUsed
- `{{4}}` = dropsTotal
- `{{5}}` = renewDate

**Buttons:**
| Button Text | Payload |
|-------------|---------|
| Main menu | MENU |

---

## Template 10: HELP_MENU

**Name:** `flex_help_menu`
**Type:** Quick Reply
**Category:** UTILITY

**Body:**
```
How can we help? 🤝
```

**Buttons:**
| Button Text | Payload |
|-------------|---------|
| Damaged item | DAMAGED |
| Missing item | MISSING |
| Billing question | BILLING |
| Something else | OTHER |

**Note:** Only 4 buttons allowed on Quick Reply. "Main menu" handled by text.

---

## Template 11: SUPPORT_PHOTO_ASK

**Name:** `flex_support_photo_ask`
**Type:** Text
**Category:** UTILITY

**Body:**
```
Got it - {{1}}.

Please describe what happened in one message.

If you have a photo, send it with your message.

Or reply SKIP to continue without a photo.
```

**Variables:**
- `{{1}}` = issueType

**Buttons:** None (expecting text/photo input)

---

## Template 12: SUPPORT_CONFIRMED

**Name:** `flex_support_confirmed`
**Type:** Quick Reply
**Category:** UTILITY

**Body:**
```
Ticket created! ✅

Reference: #{{1}}

We've sent details to {{2}}.
Our team will respond within 24 hours.

We'll ping you here when there's an update.
```

**Variables:**
- `{{1}}` = ticketId
- `{{2}}` = email

**Buttons:**
| Button Text | Payload |
|-------------|---------|
| Main menu | MENU |

---

## Environment Variables After Creation

After creating each template, copy the Content SID (starts with `HX...`) and add to Vercel:

```bash
# In Vercel Dashboard → Settings → Environment Variables

TEMPLATE_WELCOME_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_READY_PICKUP_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_MAIN_MENU_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_DROP_GUIDE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_BAG_CONFIRMED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_TRACK_SINGLE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_TRACK_MULTIPLE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_TRACK_NONE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_ACCOUNT_INFO_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_HELP_MENU_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_SUPPORT_PHOTO_ASK_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_SUPPORT_CONFIRMED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Quick Setup Checklist

- [ ] Create WELCOME template → Get SID → Add to Vercel
- [ ] Create READY_PICKUP template → Get SID → Add to Vercel
- [ ] Create MAIN_MENU template → Get SID → Add to Vercel
- [ ] Create DROP_GUIDE template → Get SID → Add to Vercel
- [ ] Create BAG_CONFIRMED template → Get SID → Add to Vercel
- [ ] Create TRACK_SINGLE template → Get SID → Add to Vercel
- [ ] Create TRACK_MULTIPLE template → Get SID → Add to Vercel
- [ ] Create TRACK_NONE template → Get SID → Add to Vercel
- [ ] Create ACCOUNT_INFO template → Get SID → Add to Vercel
- [ ] Create HELP_MENU template → Get SID → Add to Vercel
- [ ] Create SUPPORT_PHOTO_ASK template → Get SID → Add to Vercel
- [ ] Create SUPPORT_CONFIRMED template → Get SID → Add to Vercel
- [ ] Submit WELCOME for Meta approval
- [ ] Submit READY_PICKUP for Meta approval
- [ ] Redeploy Vercel after adding env vars

---

## Meta Approval Tips

For WELCOME and READY_PICKUP templates:

1. **Category:** Select "UTILITY" (not MARKETING)
2. **Use Case:** "Transaction updates for laundry service"
3. **Sample Values:** Provide realistic examples
   - firstName: "Sarah"
   - planName: "Essential"
   - gymName: "PureGym Shoreditch"
4. **Expected Turnaround:** Usually 24-48 hours

---

## Testing Without Templates

The system has **plain text fallbacks** for every template. If you haven't created the templates yet, or they're pending approval, the system will automatically send plain text versions that work identically.

This means you can test the full flow immediately without waiting for Meta approval!
