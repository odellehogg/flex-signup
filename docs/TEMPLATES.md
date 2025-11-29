# FLEX WhatsApp Templates

Complete specification for all 44 WhatsApp Business API templates.

**Important:** Create these templates in Twilio Content Template Builder, get them approved by Meta, then add the Content SIDs to your `.env` file.

---

## Quick Reference

| Category | Count | Approval Time |
|----------|-------|---------------|
| Business-Initiated (UTILITY) | 11 | 24-48 hours |
| Business-Initiated (MARKETING) | 1 | 48-72 hours |
| Conversational (UTILITY) | 32 | 24-48 hours |
| **Total** | **44** | |

---

## Business-Initiated Templates (12)

These are sent proactively by the system (crons, webhooks) without prior customer message.

### 1. flex_welcome
**Env Variable:** `TEMPLATE_WELCOME_SID`  
**Trigger:** After successful Stripe checkout  
**Category:** UTILITY

```
Hi {{1}}! 👋

Welcome to FLEX! Your {{2}} subscription is now active.

Head to {{3}} reception and show them this message to collect your FLEX bag.

After your workout, fill the bag with your sweaty clothes (up to 5 items), drop it at reception, then message us your bag number (like B001).

We'll take care of the rest!
```

**Variables:** `{{1}}` firstName, `{{2}}` planName, `{{3}}` gymName  
**Buttons:** `[How It Works]` → HOW_WORKS | `[Start a Drop]` → DROP

---

### 2. flex_drop_confirmed
**Env Variable:** `TEMPLATE_DROP_CONFIRMED_SID`  
**Trigger:** When drop is created via WhatsApp  
**Category:** UTILITY

```
Got it! 🧺

Bag {{1}} received at {{2}}.

We'll have your clothes cleaned and ready by {{3}}.

We'll message you when they're ready for pickup.
```

**Variables:** `{{1}}` bagNumber, `{{2}}` gymName, `{{3}}` expectedDate  
**Buttons:** `[Track Order]` → TRACK | `[Main Menu]` → MENU

---

### 3. flex_ready_pickup
**Env Variable:** `TEMPLATE_READY_PICKUP_SID`  
**Trigger:** When bag status changes to "Ready"  
**Category:** UTILITY

```
Your clothes are ready! ✨

Bag {{1}} is waiting at {{2}} reception.

Available until {{3}}. Just ask the reception team to grab it for you.
```

**Variables:** `{{1}}` bagNumber, `{{2}}` gymName, `{{3}}` availableUntil  
**Buttons:** `[Got It]` → CONFIRM_PICKUP | `[Need Help]` → HELP

---

### 4. flex_pickup_confirmed
**Env Variable:** `TEMPLATE_PICKUP_CONFIRMED_SID`  
**Trigger:** When bag status changes to "Collected"  
**Category:** UTILITY

```
Thanks for picking up! 

How was your FLEX experience this time?
```

**Variables:** None  
**Buttons:** `[😊 Great]` → FEEDBACK_GREAT | `[😐 OK]` → FEEDBACK_OK | `[😞 Not Good]` → FEEDBACK_BAD

---

### 5. flex_reengagement
**Env Variable:** `TEMPLATE_REENGAGEMENT_SID`  
**Trigger:** Daily cron for 14+ days inactive  
**Category:** MARKETING ⚠️

```
Hey {{1}}! 👋

We noticed you haven't dropped off in a while. Your gym kit misses us! 😄

You have {{2}} drops remaining this month (resets {{3}}).

Ready to drop off your next bag?
```

**Variables:** `{{1}}` firstName, `{{2}}` dropsRemaining, `{{3}}` expiryDate  
**Buttons:** `[Start a Drop]` → DROP | `[Not Now]` → MENU

---

### 6. flex_pause_reminder
**Env Variable:** `TEMPLATE_PAUSE_REMINDER_SID`  
**Trigger:** 3 days before pause ends  
**Category:** UTILITY

```
Hi {{1}}! 

Just a heads up - your FLEX subscription resumes on {{2}}.

You'll be able to drop off bags again from that date.

Want to extend your pause or make changes?
```

**Variables:** `{{1}}` firstName, `{{2}}` resumeDate  
**Buttons:** `[Keep Current]` → MENU | `[Extend Pause]` → PAUSE_SUB | `[Cancel]` → CANCEL_SUB

---

### 7. flex_pickup_confirm_request
**Env Variable:** `TEMPLATE_PICKUP_CONFIRM_REQUEST_SID`  
**Trigger:** Cron, 24 hours after Ready status  
**Category:** UTILITY

```
Have you collected your bag? 👋

Bag {{1}} has been ready at {{2}} for 24 hours.

Please confirm so you can make your next drop!
```

**Variables:** `{{1}}` bagNumber, `{{2}}` gymName  
**Buttons:** `[Yes, Collected]` → CONFIRM_PICKUP | `[Not Yet]` → NOT_COLLECTED

---

### 8. flex_pickup_reminder
**Env Variable:** `TEMPLATE_PICKUP_REMINDER_SID`  
**Trigger:** Cron, 48 hours after Ready (if not confirmed)  
**Category:** UTILITY

```
Reminder: Your bag is still waiting! 📦

Bag {{1}} is at {{2}} reception.

Please collect it soon and confirm pickup to continue using FLEX.
```

**Variables:** `{{1}}` bagNumber, `{{2}}` gymName  
**Buttons:** `[Yes, Collected]` → CONFIRM_PICKUP | `[Need Help]` → HELP

---

### 9. flex_payment_failed
**Env Variable:** `TEMPLATE_PAYMENT_FAILED_SID`  
**Trigger:** Stripe webhook for failed payment  
**Category:** UTILITY

```
Hi {{1}}, 

We couldn't process your FLEX payment. This can happen if your card expired or has insufficient funds.

Please update your payment method to continue using FLEX:

{{2}}
```

**Variables:** `{{1}}` firstName, `{{2}}` updateUrl  
**Buttons:** `[Update Payment]` → URL | `[Need Help]` → HELP

---

### 10. flex_payment_retry_day3
**Env Variable:** `TEMPLATE_PAYMENT_RETRY_DAY3_SID`  
**Trigger:** Payment retry cron, day 3  
**Category:** UTILITY

```
Hi {{1}}, 

Your FLEX payment is still pending. We'll retry in a few days.

To avoid service interruption, please update your payment method:

{{2}}
```

**Variables:** `{{1}}` firstName, `{{2}}` updateUrl  
**Buttons:** `[Update Payment]` → URL | `[Need Help]` → HELP

---

### 11. flex_payment_retry_day7
**Env Variable:** `TEMPLATE_PAYMENT_RETRY_DAY7_SID`  
**Trigger:** Payment retry cron, day 7  
**Category:** UTILITY

```
Hi {{1}}, 

Final reminder: Your FLEX subscription will be paused in 3 days if payment isn't received.

Update now to keep your service active:

{{2}}
```

**Variables:** `{{1}}` firstName, `{{2}}` updateUrl  
**Buttons:** `[Update Payment]` → URL | `[Need Help]` → HELP

---

### 12. flex_stuck_bag_alert
**Env Variable:** `TEMPLATE_STUCK_BAG_ALERT_SID`  
**Trigger:** Issue detection cron (ops alert)  
**Category:** UTILITY

```
⚠️ FLEX Ops Alert

Bag {{1}} at {{2}} has been in "{{3}}" status for {{4}} hours.

Please investigate and update status.
```

**Variables:** `{{1}}` bagNumber, `{{2}}` gymName, `{{3}}` status, `{{4}}` hoursSince  
**Buttons:** None (ops notification)

---

## Conversational Templates (32)

These are sent in response to customer WhatsApp messages.

### 13. flex_how_it_works
**Env Variable:** `TEMPLATE_HOW_IT_WORKS_SID`  
**Trigger:** "HOW_WORKS" button or keyword  
**Category:** UTILITY

```
Here's how FLEX works:

1️⃣ DROP OFF
Grab a FLEX bag from your gym reception. Fill it with sweaty clothes (up to 5 items) and drop it back.

2️⃣ WE CLEAN
Message us your bag number. We collect daily and use activewear-safe products.

3️⃣ PICK UP
Your fresh clothes are back at your gym within 48 hours. We'll message you when ready!
```

**Variables:** None  
**Buttons:** `[Start a Drop]` → DROP | `[Main Menu]` → MENU

---

### 14. flex_drop_guide
**Env Variable:** `TEMPLATE_DROP_GUIDE_SID`  
**Trigger:** "DROP" keyword or button  
**Category:** UTILITY

```
Ready to drop off? 📦

1. Fill your FLEX bag (up to 5 items)
2. Note your bag number (e.g., B001)
3. Drop it at {{1}} reception
4. Reply with your bag number

What's your bag number?
```

**Variables:** `{{1}}` gymName  
**Buttons:** None (awaiting text input)

---

### 15. flex_bag_confirmed
**Env Variable:** `TEMPLATE_BAG_CONFIRMED_SID`  
**Trigger:** Valid bag number received  
**Category:** UTILITY

```
Perfect! ✅

Bag {{1}} is logged at {{2}}.

Expected ready: {{3}}

We'll message you when it's ready for pickup.
```

**Variables:** `{{1}}` bagNumber, `{{2}}` gymName, `{{3}}` expectedDate  
**Buttons:** `[Track Order]` → TRACK | `[Main Menu]` → MENU

---

### 16. flex_invalid_bag
**Env Variable:** `TEMPLATE_INVALID_BAG_SID`  
**Trigger:** Invalid bag number format  
**Category:** UTILITY

```
Hmm, that doesn't look like a bag number. 🤔

Bag numbers start with B followed by 3-4 digits, like B001 or B1234.

Check the tag on your bag and try again!
```

**Variables:** None  
**Buttons:** `[Main Menu]` → MENU

---

### 17. flex_main_menu
**Env Variable:** `TEMPLATE_MAIN_MENU_SID`  
**Trigger:** "MENU", "HI", "HELLO", "START" keywords  
**Category:** UTILITY

```
Hi {{1}}! How can I help? 

Reply with a number:

1️⃣ Check my drops
2️⃣ Track my order  
3️⃣ Manage subscription
4️⃣ My account
5️⃣ Get help
```

**Variables:** `{{1}}` firstName  
**Buttons:** None (awaiting number input)

---

### 18. flex_check_drops
**Env Variable:** `TEMPLATE_CHECK_DROPS_SID`  
**Trigger:** Menu option 1 or "CHECK_DROPS"  
**Category:** UTILITY

```
📊 Your {{1}} Plan

Used: {{2}} of {{3}} drops
Remaining: {{4}} drops

Resets on {{5}}
```

**Variables:** `{{1}}` planName, `{{2}}` usedDrops, `{{3}}` totalDrops, `{{4}}` remainingDrops, `{{5}}` renewDate  
**Buttons:** `[Start a Drop]` → DROP | `[Main Menu]` → MENU

---

### 19. flex_track_active
**Env Variable:** `TEMPLATE_TRACK_ACTIVE_SID`  
**Trigger:** Menu option 2 with active drop  
**Category:** UTILITY

```
📦 Tracking: Bag {{1}}

Status: {{2}}
Location: {{3}}
Expected: {{4}}
```

**Variables:** `{{1}}` bagNumber, `{{2}}` status, `{{3}}` gymName, `{{4}}` expectedDate  
**Buttons:** `[Main Menu]` → MENU | `[Need Help]` → HELP

---

### 20. flex_track_none
**Env Variable:** `TEMPLATE_TRACK_NONE_SID`  
**Trigger:** Menu option 2 with no active drop  
**Category:** UTILITY

```
You don't have any active drops right now.

Ready to drop off your gym clothes?
```

**Variables:** None  
**Buttons:** `[Start a Drop]` → DROP | `[Main Menu]` → MENU

---

### 21. flex_manage_sub
**Env Variable:** `TEMPLATE_MANAGE_SUB_SID`  
**Trigger:** Menu option 3 or "MANAGE_SUB"  
**Category:** UTILITY

```
⚙️ Your Subscription

Plan: {{1}} (£{{2}}/month)
Next billing: {{3}}

What would you like to do?

1️⃣ Pause subscription
2️⃣ Resume subscription
3️⃣ Cancel subscription
4️⃣ Change gym
5️⃣ Change plan
```

**Variables:** `{{1}}` planName, `{{2}}` price, `{{3}}` nextBillingDate  
**Buttons:** None (awaiting number input)

---

### 22. flex_pause_menu
**Env Variable:** `TEMPLATE_PAUSE_MENU_SID`  
**Trigger:** Subscription menu option 1  
**Category:** UTILITY

```
How long would you like to pause?

1️⃣ 2 weeks
2️⃣ 1 month

You won't be charged during the pause, and you can resume anytime.
```

**Variables:** None  
**Buttons:** `[Cancel]` → MENU

---

### 23. flex_pause_confirmed
**Env Variable:** `TEMPLATE_PAUSE_CONFIRMED_SID`  
**Trigger:** Pause duration selected  
**Category:** UTILITY

```
Your subscription is now paused. ⏸️

It will automatically resume on {{1}}.

Enjoy your break! Message us anytime if you need help.
```

**Variables:** `{{1}}` resumeDate  
**Buttons:** `[Main Menu]` → MENU

---

### 24. flex_resume_confirmed
**Env Variable:** `TEMPLATE_RESUME_CONFIRMED_SID`  
**Trigger:** Resume subscription selected  
**Category:** UTILITY

```
Welcome back! 🎉

Your subscription is now active again. You can start dropping off bags immediately.
```

**Variables:** None  
**Buttons:** `[Start a Drop]` → DROP | `[Main Menu]` → MENU

---

### 25. flex_cancel_reason
**Env Variable:** `TEMPLATE_CANCEL_REASON_SID`  
**Trigger:** Subscription menu option 3  
**Category:** UTILITY

```
We're sorry to see you go! 😢

Before you cancel, could you tell us why?

1️⃣ Too expensive
2️⃣ Not using it enough
3️⃣ Moving away
4️⃣ Service issues
5️⃣ Other
```

**Variables:** None  
**Buttons:** `[Never Mind]` → MENU

---

### 26. flex_cancel_retention
**Env Variable:** `TEMPLATE_CANCEL_RETENTION_SID`  
**Trigger:** Cancel reason selected  
**Category:** UTILITY

```
We'd hate to lose you! 

How about 20% off your next 2 months? That's just £24/month for Essential or £38/month for Unlimited.
```

**Variables:** None  
**Buttons:** `[Accept Offer]` → ACCEPT_OFFER | `[Cancel Anyway]` → CONFIRM_CANCEL

---

### 27. flex_cancel_confirmed
**Env Variable:** `TEMPLATE_CANCEL_CONFIRMED_SID`  
**Trigger:** Cancel confirmed  
**Category:** UTILITY

```
Your subscription has been cancelled.

You can still use your remaining {{1}} drops until {{2}}.

We hope to see you back someday! 👋
```

**Variables:** `{{1}}` remainingDrops, `{{2}}` endDate  
**Buttons:** `[Main Menu]` → MENU

---

### 28. flex_discount_applied
**Env Variable:** `TEMPLATE_DISCOUNT_APPLIED_SID`  
**Trigger:** Retention offer accepted  
**Category:** UTILITY

```
Brilliant! 🎉

Your 20% discount is now active for the next 2 months.

Thanks for staying with FLEX!
```

**Variables:** None  
**Buttons:** `[Main Menu]` → MENU

---

### 29. flex_help_menu
**Env Variable:** `TEMPLATE_HELP_MENU_SID`  
**Trigger:** "HELP" keyword or menu option 5  
**Category:** UTILITY

```
How can we help? 

1️⃣ What counts as a drop?
2️⃣ How long until pickup?
3️⃣ What can I include?
4️⃣ How does cleaning work?
5️⃣ Can I pause/cancel?
6️⃣ WhatsApp commands
7️⃣ Report an issue
8️⃣ Billing
9️⃣ Pricing
```

**Variables:** None  
**Buttons:** `[Main Menu]` → MENU

---

### 30. flex_feedback_great
**Env Variable:** `TEMPLATE_FEEDBACK_GREAT_SID`  
**Trigger:** Great feedback emoji selected  
**Category:** UTILITY

```
Awesome! Thanks for the feedback! 🙌

Love FLEX? Share your referral code with gym buddies:

{{1}}

They get £5 off, you get a free drop!
```

**Variables:** `{{1}}` referralCode  
**Buttons:** `[Main Menu]` → MENU

---

### 31. flex_feedback_bad
**Env Variable:** `TEMPLATE_FEEDBACK_BAD_SID`  
**Trigger:** Bad feedback emoji selected  
**Category:** UTILITY

```
We're really sorry to hear that. 😔

Can you tell us what went wrong? We'll make it right.

Just type your message and we'll get back to you within 24 hours.
```

**Variables:** None  
**Buttons:** None (awaiting text input)

---

### 32. flex_issue_reported
**Env Variable:** `TEMPLATE_ISSUE_REPORTED_SID`  
**Trigger:** Issue description received  
**Category:** UTILITY

```
Thanks for letting us know. 

Your issue has been logged:
Ticket: {{1}}

We'll investigate and get back to you within 24 hours via WhatsApp.
```

**Variables:** `{{1}}` ticketId  
**Buttons:** `[Main Menu]` → MENU

---

### 33. flex_pickup_blocked
**Env Variable:** `TEMPLATE_PICKUP_BLOCKED_SID`  
**Trigger:** Customer tries to drop with uncollected bag  
**Category:** UTILITY

```
Hold on! 🛑

You have bag {{1}} waiting at {{2}} reception.

Please collect it and confirm pickup before making a new drop.
```

**Variables:** `{{1}}` bagNumber, `{{2}}` gymName  
**Buttons:** `[Yes, Collected]` → CONFIRM_PICKUP | `[Track Order]` → TRACK

---

### 34. flex_pickup_confirmed_thanks
**Env Variable:** `TEMPLATE_PICKUP_CONFIRMED_THANKS_SID`  
**Trigger:** Customer confirms pickup manually  
**Category:** UTILITY

```
Thanks for confirming! ✅

How was your FLEX experience this time?
```

**Variables:** None  
**Buttons:** `[😊 Great]` → FEEDBACK_GREAT | `[😐 OK]` → FEEDBACK_OK | `[😞 Not Good]` → FEEDBACK_BAD

---

### 35. flex_not_a_member
**Env Variable:** `TEMPLATE_NOT_A_MEMBER_SID`  
**Trigger:** Unknown phone number messages  
**Category:** UTILITY

```
Hi there! 👋

It looks like this number isn't registered with FLEX yet.

Want to join? We're a gym laundry service - drop off your sweaty kit, pick it up fresh within 48 hours!

Sign up at: https://flexlaundry.co.uk/join
```

**Variables:** None  
**Buttons:** `[Sign Up]` → URL | `[Learn More]` → URL

---

### 36. flex_my_account
**Env Variable:** `TEMPLATE_MY_ACCOUNT_SID`  
**Trigger:** Menu option 4 or "MY_ACCOUNT"  
**Category:** UTILITY

```
👤 Your Account

Name: {{1}}
Email: {{2}}
Gym: {{3}}
Plan: {{4}}

Drops: {{5}} of {{6}} remaining
Next billing: {{7}}
```

**Variables:** `{{1}}` firstName, `{{2}}` email, `{{3}}` gymName, `{{4}}` planName, `{{5}}` remaining, `{{6}}` total, `{{7}}` nextBilling  
**Buttons:** `[Main Menu]` → MENU | `[Manage Sub]` → MANAGE_SUB

---

### 37. flex_change_gym_menu
**Env Variable:** `TEMPLATE_CHANGE_GYM_MENU_SID`  
**Trigger:** Subscription menu option 4  
**Category:** UTILITY

```
Which gym would you like to switch to?

Current gym: {{1}}

Available gyms:
{{2}}

Reply with the gym name or number.
```

**Variables:** `{{1}}` currentGym, `{{2}}` availableGyms (formatted list)  
**Buttons:** `[Cancel]` → MENU

---

### 38. flex_gym_changed
**Env Variable:** `TEMPLATE_GYM_CHANGED_SID`  
**Trigger:** Gym change confirmed  
**Category:** UTILITY

```
Done! ✅

Your home gym is now {{1}}.

You can drop off and collect bags from there starting now.
```

**Variables:** `{{1}}` newGymName  
**Buttons:** `[Main Menu]` → MENU | `[Start a Drop]` → DROP

---

### 39. flex_change_plan_menu
**Env Variable:** `TEMPLATE_CHANGE_PLAN_MENU_SID`  
**Trigger:** Subscription menu option 5  
**Category:** UTILITY

```
Your current plan: {{1}}

Available plans:

1️⃣ Essential - £30/month (10 drops)
2️⃣ Unlimited - £48/month (16 drops)

Reply with 1 or 2 to switch.
```

**Variables:** `{{1}}` currentPlan  
**Buttons:** `[Cancel]` → MENU

---

### 40. flex_plan_changed
**Env Variable:** `TEMPLATE_PLAN_CHANGED_SID`  
**Trigger:** Plan change confirmed or unavailable  
**Category:** UTILITY

```
{{1}}
```

**Variables:** `{{1}}` message (dynamic - either confirmation or unavailable message)  
**Buttons:** `[Main Menu]` → MENU

**Note:** This template is used for both success and "unavailable" scenarios. The message content varies.

Success example: "Done! ✅ You're now on the Essential plan (£30/month, 10 drops). Changes take effect from your next billing date."

Unavailable example: "Sorry, the Unlimited plan isn't available for new signups yet. We'll let you know when it opens up!"

---

### 41. flex_billing_help
**Env Variable:** `TEMPLATE_BILLING_HELP_SID`  
**Trigger:** Help menu option 8  
**Category:** UTILITY

```
💳 Your Billing

Plan: {{1}}
Price: £{{2}}/month
Next billing: {{3}}

Need to update your payment method or view invoices? Use the link below:
```

**Variables:** `{{1}}` planName, `{{2}}` price, `{{3}}` nextBilling  
**Buttons:** `[Manage Billing]` → URL | `[Main Menu]` → MENU

---

### 42. flex_issue_type_menu
**Env Variable:** `TEMPLATE_ISSUE_TYPE_MENU_SID`  
**Trigger:** Help menu option 7  
**Category:** UTILITY

```
What type of issue would you like to report?

1️⃣ Late delivery
2️⃣ Missing bag
3️⃣ Wrong items returned
4️⃣ Damage claim
5️⃣ Other

Reply with a number.
```

**Variables:** None  
**Buttons:** `[Cancel]` → MENU

---

### 43. flex_damage_photo_request
**Env Variable:** `TEMPLATE_DAMAGE_PHOTO_REQUEST_SID`  
**Trigger:** Damage claim selected  
**Category:** UTILITY

```
Sorry to hear about the damage! 😔

Please send a photo of the damaged item so we can investigate.

Just take a picture and send it in this chat.
```

**Variables:** None  
**Buttons:** None (awaiting photo)

---

### 44. flex_damage_received
**Env Variable:** `TEMPLATE_DAMAGE_RECEIVED_SID`  
**Trigger:** Photo received for damage claim  
**Category:** UTILITY

```
Thanks for the photo. 

Your damage claim has been logged:
Ticket: {{1}}

Our team will review and get back to you within 24-48 hours with next steps.
```

**Variables:** `{{1}}` ticketId  
**Buttons:** `[Main Menu]` → MENU

---

## Template Creation Guide

### Twilio Content Template Builder

1. Go to: https://console.twilio.com/us1/develop/sms/content-template-builder
2. Click "Create new template"
3. Select "WhatsApp" as channel
4. Choose category (UTILITY or MARKETING)
5. Enter template name (e.g., `flex_welcome`)
6. Paste template body from above
7. Add buttons if specified
8. Submit for Meta approval
9. Once approved, copy the Content SID (starts with `HX`)
10. Add to your `.env` file

### Meta Approval Guidelines

| Rule | Details |
|------|---------|
| No emojis in buttons | Meta rejects button text with emojis |
| Variable placement | Never at start or end of message |
| Button text | Max 20 characters |
| Body length | Max 1024 characters |
| Use case | Provide clear description |
| Category | UTILITY = faster approval |

### Button Configuration

**Quick Reply Buttons** (most common):
- User taps → webhook receives payload
- Example: `[Main Menu]` → payload: `MENU`

**Call to Action Buttons** (for URLs):
- Opens URL in browser
- Example: `[Update Payment]` → opens Stripe portal

### Testing Before Launch

1. Use Twilio sandbox for testing
2. Send to your own number
3. Verify variables populate correctly
4. Test all button payloads
5. Check webhook handles responses

---

## Environment Variables Checklist

Copy to your `.env` file after Meta approves each template:

```bash
# ============================================
# WHATSAPP TEMPLATES (44 total)
# ============================================

# Business-Initiated (12)
TEMPLATE_WELCOME_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_DROP_CONFIRMED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_READY_PICKUP_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PICKUP_CONFIRMED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_REENGAGEMENT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PAUSE_REMINDER_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PICKUP_CONFIRM_REQUEST_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PICKUP_REMINDER_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PAYMENT_FAILED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PAYMENT_RETRY_DAY3_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PAYMENT_RETRY_DAY7_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_STUCK_BAG_ALERT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Conversational (32)
TEMPLATE_HOW_IT_WORKS_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_DROP_GUIDE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_BAG_CONFIRMED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_INVALID_BAG_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_MAIN_MENU_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_CHECK_DROPS_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_TRACK_ACTIVE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_TRACK_NONE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_MANAGE_SUB_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PAUSE_MENU_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PAUSE_CONFIRMED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_RESUME_CONFIRMED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_CANCEL_REASON_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_CANCEL_RETENTION_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_CANCEL_CONFIRMED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_DISCOUNT_APPLIED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_HELP_MENU_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_FEEDBACK_GREAT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_FEEDBACK_BAD_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_ISSUE_REPORTED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PICKUP_BLOCKED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PICKUP_CONFIRMED_THANKS_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_NOT_A_MEMBER_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_MY_ACCOUNT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_CHANGE_GYM_MENU_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_GYM_CHANGED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_CHANGE_PLAN_MENU_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_PLAN_CHANGED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_BILLING_HELP_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_ISSUE_TYPE_MENU_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_DAMAGE_PHOTO_REQUEST_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEMPLATE_DAMAGE_RECEIVED_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

*Last Updated: November 2024*
