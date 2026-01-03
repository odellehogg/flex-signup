# FLEX WhatsApp MVP - Testing Checklist

## Pre-Test Setup

- [ ] All environment variables set in Vercel
- [ ] Twilio webhook URL configured: `https://flexlaundry.co.uk/api/webhooks/whatsapp`
- [ ] Test member exists in Airtable with your phone number
- [ ] Airtable has at least one Gym record linked to test member

---

## Test 1: Non-Member Flow

**Steps:**
1. Send any message from a phone NOT in Airtable

**Expected:**
- Receive "I don't recognize this number" message
- Link to flexlaundry.co.uk/join included

**Status:** [ ] Pass / [ ] Fail

---

## Test 2: Main Menu (IDLE State)

**Steps:**
1. Send "hi" from registered number
2. Send "menu"
3. Send "hello"

**Expected:**
- Each should return main menu with 4 options
- Name should be personalized

**Status:** [ ] Pass / [ ] Fail

---

## Test 3: Drop Flow - Complete

**Steps:**
1. Send "drop" or tap "Start a drop" button
2. Receive drop guide with gym name
3. Reply with bag number: "42"
4. Receive confirmation

**Expected:**
- Step 2: Instructions specific to your gym
- Step 4: Confirmation with bag number "B042"
- Airtable: New drop record created with status "Dropped"

**Status:** [ ] Pass / [ ] Fail

---

## Test 4: Drop Flow - Invalid Bag Number

**Steps:**
1. Send "drop"
2. Reply with "xyz123"

**Expected:**
- "I didn't recognize that bag number" message
- Prompt to try again or MENU to go back

**Status:** [ ] Pass / [ ] Fail

---

## Test 5: Drop Flow - Menu Escape

**Steps:**
1. Send "drop"
2. Reply "menu" instead of bag number

**Expected:**
- Returns to main menu
- State reset to IDLE

**Status:** [ ] Pass / [ ] Fail

---

## Test 6: Track - Single Drop

**Prerequisites:** Have one active drop in system

**Steps:**
1. Send "track"

**Expected:**
- Shows bag number, status, expected date
- Status emoji matches status
- Refresh and Menu buttons work

**Status:** [ ] Pass / [ ] Fail

---

## Test 7: Track - Multiple Drops

**Prerequisites:** Have 2+ active drops in system

**Steps:**
1. Send "track"

**Expected:**
- Shows list of all active drops
- Each with bag number and status
- Can reply with specific bag number for details

**Status:** [ ] Pass / [ ] Fail

---

## Test 8: Track - No Drops

**Prerequisites:** No active drops in system

**Steps:**
1. Send "track"

**Expected:**
- "No active drops" message
- Shows drops used this month
- Option to start a drop

**Status:** [ ] Pass / [ ] Fail

---

## Test 9: Account Info

**Steps:**
1. Send "account"

**Expected:**
- Shows plan name, gym, drops used
- Portal link included
- Renew date shown

**Status:** [ ] Pass / [ ] Fail

---

## Test 10: Help Menu

**Steps:**
1. Send "help"

**Expected:**
- 4 issue type options shown
- Damaged, Missing, Billing, Other

**Status:** [ ] Pass / [ ] Fail

---

## Test 11: Support Ticket - Damage (with photo)

**Steps:**
1. Send "help"
2. Send "damaged"
3. Send description: "My leggings have a tear"
4. Send a photo

**Expected:**
- Photo prompt received after step 3
- Ticket confirmation with reference number
- Email sent to OPS_EMAIL with photo
- Airtable: Issue record created with attachment

**Status:** [ ] Pass / [ ] Fail

---

## Test 12: Support Ticket - Without Photo

**Steps:**
1. Send "help"
2. Send "billing"
3. Send description: "I was charged twice"

**Expected:**
- No photo prompt (billing doesn't need photo)
- Ticket confirmation immediately
- Email sent to both ops and member

**Status:** [ ] Pass / [ ] Fail

---

## Test 13: Support Ticket - Skip Photo

**Steps:**
1. Send "help"
2. Send "damaged"
3. Send description
4. Send "skip"

**Expected:**
- Ticket created without photo
- Confirmation received

**Status:** [ ] Pass / [ ] Fail

---

## Test 14: How It Works

**Steps:**
1. Send "how"

**Expected:**
- 3-step explanation
- Personalized with gym name
- Options to DROP or MENU

**Status:** [ ] Pass / [ ] Fail

---

## Test 15: Direct Bag Number (Shortcut)

**Steps:**
1. From IDLE state, send "B042" or just "42"

**Expected:**
- Creates drop directly (skips drop guide)
- Confirmation received
- Works without saying "drop" first

**Status:** [ ] Pass / [ ] Fail

---

## Test 16: Ready Pickup - On My Way

**Prerequisites:** Have a drop with status "Ready"

**Steps:**
1. Simulate READY_PICKUP notification (or manually update drop to Ready)
2. Reply "omw" or "1"

**Expected:**
- Acknowledgment message
- Mentions gym name

**Status:** [ ] Pass / [ ] Fail

---

## Test 17: Ready Pickup - Need More Time (First Extension)

**Prerequisites:** Have a drop with status "Ready", Extended = false

**Steps:**
1. Reply "more" or "2" to ready notification

**Expected:**
- Extension confirmed
- New date shown (24hrs from now)
- Airtable: Extended = true, Available Until updated

**Status:** [ ] Pass / [ ] Fail

---

## Test 18: Ready Pickup - Need More Time (Second Extension Denied)

**Prerequisites:** Have a drop with status "Ready", Extended = true

**Steps:**
1. Reply "more" or "2"

**Expected:**
- Extension denied message
- Offered HELP option instead

**Status:** [ ] Pass / [ ] Fail

---

## Test 19: Response Time Check

**Steps:**
1. Send any message
2. Time the response

**Expected:**
- Response within 3 seconds
- No timeout or delay

**Status:** [ ] Pass / [ ] Fail
**Measured Time:** ______ seconds

---

## Test 20: Error Recovery

**Steps:**
1. Temporarily break something (e.g., invalid Airtable API key)
2. Send a message

**Expected:**
- User receives friendly error message
- Logs show error details
- System doesn't crash

**Status:** [ ] Pass / [ ] Fail

---

## Airtable Verification Checklist

After testing, verify in Airtable:

- [ ] Drops table: New records with correct bag numbers
- [ ] Drops table: Status updates working
- [ ] Members table: Conversation State updates
- [ ] Members table: Pending Issue fields populated/cleared
- [ ] Issues table: Support tickets created
- [ ] Issues table: Attachments (photos) saved

---

## Email Verification Checklist

Check email inboxes:

- [ ] Ops email receives ticket notifications
- [ ] Ops email includes photo inline (if sent)
- [ ] Member email receives ticket confirmation
- [ ] Reply-to address works for ops email

---

## Production Readiness Checklist

Before going live:

- [ ] All 20 tests pass
- [ ] Response time < 3 seconds
- [ ] Twilio templates created (or plain text fallbacks tested)
- [ ] Stripe webhooks configured and tested
- [ ] Domain verified in Resend
- [ ] Error logging visible in Vercel
- [ ] At least one full drop cycle tested (Drop → Ready → Collected)

---

## Notes

_Use this space to record any issues or observations during testing:_

```




```
