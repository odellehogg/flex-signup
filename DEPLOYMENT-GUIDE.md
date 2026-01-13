# FLEX MVP - Deployment Guide
## Session 2 Core Changes

---

## What's Been Created

### New/Modified Files

```
flex-mvp/
├── lib/
│   ├── constants.js      ← REPLACE (simplified statuses/states)
│   ├── airtable.js       ← REPLACE (added bag functions)
│   ├── whatsapp.js       ← REPLACE (simplified messages)
│   ├── email.js          ← REPLACE (added support ticket email)
│   ├── verification.js   ← NEW (OTP handling)
│   └── plans.js          ← KEEP (unchanged)
│
├── app/api/
│   ├── webhooks/whatsapp/route.js  ← REPLACE (3-state handler)
│   ├── verify-phone/
│   │   ├── send/route.js           ← NEW
│   │   └── check/route.js          ← NEW
│   └── portal/drop/route.js        ← NEW
│
└── app/portal/
    └── drop/page.js                ← NEW
```

---

## Deployment Steps

### Step 1: Create Bags Table in Airtable

1. Go to your Airtable base
2. Create new table called "Bags"
3. Add fields:
   - `Bag Number` (Single line text) - Primary field
   - `Status` (Single select) - Options: `Available`, `In Use`, `Retired`
   - `Current Drop` (Link to Drops table)
   - `Gym` (Link to Gyms table) - optional for now
   - `Notes` (Long text)

4. Import the `flex_bags_import.csv` file I provided

### Step 2: Update Members Table

Add these fields if they don't exist:
- `Pending Phone` (Single line text) - For phone update verification
- `Verification Code` (Single line text)
- `Verification Expires` (Date time)
- `Verification Attempts` (Number)

### Step 3: Update Drops Table

Change the Status field options to:
- `Dropped`
- `Processing`
- `Ready`
- `Collected`

(Remove: `In Transit`, `At Laundry`, `Cancelled`)

### Step 4: Replace Files in Your Codebase

For each file in `/lib/`:
1. Backup the existing file
2. Replace with the new version

For API routes:
1. Replace `/app/api/webhooks/whatsapp/route.js`
2. Create new directories and add new files

### Step 5: Add Environment Variable

Add to Vercel:
```
SUPPORT_EMAIL=support@flexlaundry.co.uk
```

### Step 6: Deploy

```bash
git add .
git commit -m "MVP: Simplified WhatsApp flow with bag validation"
git push
```

Vercel will auto-deploy.

---

## Testing Checklist

### WhatsApp Flow Tests

1. **Unknown number → "I don't recognise this number"**
   - Message from unregistered phone
   - Expected: Sign up prompt

2. **MENU → Main menu**
   - Message: "MENU", "Hi", "Hello", "0"
   - Expected: 3 options (DROP, STATUS, HELP)

3. **DROP → Drop guide → Valid bag → Confirmed**
   - Message: "1" or "DROP"
   - Expected: Instructions + bag number prompt
   - Message: "B001" (valid available bag)
   - Expected: Confirmation with expected date

4. **DROP → Invalid bag → Error**
   - Message: "DROP"
   - Message: "B999" (non-existent)
   - Expected: "B999 isn't in our system"

5. **DROP → Bag already in use → Error**
   - Message: "DROP"
   - Message: "B001" (already used in step 3)
   - Expected: "B001 is already being used"

6. **STATUS → Shows active drops**
   - Message: "2" or "STATUS"
   - Expected: List of active drops + remaining

7. **HELP → Support prompt → Message → Ticket created**
   - Message: "3" or "HELP"
   - Expected: Support instructions
   - Message: "My clothes smell weird"
   - Expected: Ticket confirmation + email sent to support

8. **Random text → Back to menu**
   - Message: "asdfasdf"
   - Expected: "I didn't catch that" + menu options

### Portal Tests

1. **Login → Dashboard → Start Drop**
   - Login via magic link
   - Click "Start a Drop"
   - Enter valid bag number
   - Expected: Confirmation + WhatsApp sent

2. **No drops remaining**
   - Use all drops
   - Try to start another
   - Expected: "No drops remaining" message

---

## Key Changes Summary

| Before | After |
|--------|-------|
| 6 drop statuses | 4 drop statuses |
| 6 conversation states | 3 conversation states |
| 44+ WhatsApp templates | ~10 simple messages |
| No bag validation | Validates against Bags table |
| Complex support flow | Single message → ticket |
| WhatsApp-only drops | Portal + WhatsApp drops |

---

## Rollback Plan

If something breaks:

1. Keep backups of original files
2. Revert via git: `git revert HEAD`
3. Re-deploy

---

## Next Steps (Session 3)

1. Phone verification in signup flow
2. Portal settings page with phone update
3. Test end-to-end with real signup
4. Ops dashboard updates

---

*FLEX Active Group Limited*
*MVP Deployment Guide v1.0*
