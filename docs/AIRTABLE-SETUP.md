# Airtable Setup Guide

## Overview

Airtable serves as FLEX's primary database. This guide documents the schema and setup process.

**Base ID:** `appkU13tG14ZLVZZ9`

## Tables

### 1. Members

Primary customer table.

| Field Name | Type | Description |
|------------|------|-------------|
| Phone Number | Single line text | **Primary key**. E.164 format (+447123456789) |
| Email | Email | Customer email |
| First Name | Single line text | |
| Last Name | Single line text | |
| Gym | Link to Gyms | Partner gym (single record) |
| Subscription Tier | Single select | One-Off, Essential, Unlimited |
| Status | Single select | Active, Paused, Cancelled, Prospect |
| Drops Remaining | Number | Current period remaining |
| Total Drops | Number | Lifetime total |
| Stripe Customer ID | Single line text | cus_xxx |
| Stripe Subscription ID | Single line text | sub_xxx |
| Conversation State | Single select | IDLE, AWAITING_BAG_NUMBER, AWAITING_ISSUE_TYPE, etc. |
| Pending Issue Type | Single line text | Temporary field during issue creation |
| Pending Description | Long text | Temporary field during issue creation |
| Verification Code | Single line text | 6-digit login code |
| Code Expires At | Date & time | Code expiration |
| Code Attempts | Number | Failed verification attempts |
| Created At | Date & time | Auto-set |
| Updated At | Date & time | Auto-set |

**Single Select Options:**

*Subscription Tier:*
- One-Off
- Essential
- Unlimited

*Status:*
- Prospect (signed up but not paid)
- Active (paid subscription)
- Paused (subscription paused)
- Cancelled (subscription ended)

*Conversation State:*
- IDLE
- AWAITING_BAG_NUMBER
- AWAITING_ISSUE_TYPE
- AWAITING_ISSUE_DESCRIPTION
- AWAITING_ISSUE_PHOTO
- AWAITING_GYM_SELECTION

---

### 2. Drops

Bag tracking table.

| Field Name | Type | Description |
|------------|------|-------------|
| Bag Number | Single line text | e.g., "B042" |
| Member | Link to Members | Single record |
| Status | Single select | Dropped, In Transit, At Laundry, Ready, Collected |
| Drop Date | Date & time | When bag was dropped |
| Expected Ready | Date & time | 48 hours from drop |
| Actual Ready | Date & time | When marked ready |
| Collected Date | Date & time | When picked up |
| Gym | Lookup | From linked Member |
| Notes | Long text | Ops notes |
| Created At | Date & time | Auto-set |

**Single Select Options:**

*Status:*
- Dropped (bag logged at gym)
- In Transit (collected from gym)
- At Laundry (at processing facility)
- Ready (clean, at gym for pickup)
- Collected (member picked up)

---

### 3. Gyms

Partner gym locations.

| Field Name | Type | Description |
|------------|------|-------------|
| Name | Single line text | Gym name |
| Code | Single line text | URL slug (e.g., "third-space") |
| Address | Long text | Full address |
| Collection Days | Multiple select | Mon, Tue, Wed, Thu, Fri, Sat, Sun |
| Drop Location | Single line text | "Reception", "Locker room", etc. |
| Commission Rate | Number | Percentage (0-100) |
| Contact Person | Single line text | Gym contact name |
| Contact Email | Email | Gym contact email |
| Contact Phone | Phone | Gym contact phone |
| Status | Single select | Active, Inactive, Pending |
| Members | Link to Members | All members at this gym |
| Notes | Long text | Internal notes |
| Created At | Date & time | |

---

### 4. Issues

Support ticket table.

| Field Name | Type | Description |
|------------|------|-------------|
| Member | Link to Members | Single record |
| Type | Single select | Missing Item, Damage, Quality, Billing, Delivery, Other |
| Description | Long text | Issue details |
| Photo URLs | Long text | JSON array of image URLs |
| Status | Single select | Open, In Progress, Resolved, Closed |
| Priority | Single select | Low, Normal, High, Urgent |
| Resolution | Long text | How issue was resolved |
| Resolved By | Single line text | Ops team member |
| Created At | Date & time | |
| Resolved At | Date & time | |

---

### 5. Audit Log

System activity log.

| Field Name | Type | Description |
|------------|------|-------------|
| Action | Single select | See AUDIT_ACTIONS in lib/audit.js |
| Actor Type | Single select | System, Member, Ops |
| Actor ID | Single line text | Who performed action |
| Target Type | Single select | Member, Drop, Subscription, etc. |
| Target ID | Single line text | What was affected |
| Details | Long text | Action description |
| Metadata | Long text | JSON additional data |
| IP Address | Single line text | Request IP |
| Created At | Date & time | |

---

### 6. Plans (CMS)

Subscription plan definitions.

| Field Name | Type | Description |
|------------|------|-------------|
| Name | Single line text | Plan name |
| Slug | Single line text | URL-safe identifier |
| Price | Number | Monthly price in £ |
| Drops | Number | Drops per month |
| Description | Long text | Marketing description |
| Features | Long text | JSON array of features |
| Stripe Price ID | Single line text | price_xxx |
| Is Subscription | Checkbox | Monthly recurring? |
| Is Popular | Checkbox | Show "Popular" badge? |
| Order | Number | Display order |
| Active | Checkbox | Available for purchase? |

---

### 7. Content (CMS)

Website content management.

| Field Name | Type | Description |
|------------|------|-------------|
| Page | Single select | home, pricing, faq, etc. |
| Key | Single line text | Content identifier |
| Value | Long text | Content value |
| Type | Single select | text, html, markdown, json |

---

### 8. Config (CMS)

System configuration.

| Field Name | Type | Description |
|------------|------|-------------|
| Key | Single line text | Config key |
| Value | Single line text | Config value |
| Description | Long text | What this config does |

---

### 9. Discounts

Promotional codes.

| Field Name | Type | Description |
|------------|------|-------------|
| Code | Single line text | Promo code |
| Type | Single select | Percentage, Fixed |
| Value | Number | Discount amount |
| Stripe Coupon ID | Single line text | coupon_xxx |
| Valid From | Date | Start date |
| Valid Until | Date | End date |
| Max Uses | Number | Maximum redemptions |
| Current Uses | Number | Times used |
| Active | Checkbox | Currently valid? |

---

## Automations

### 1. Drop Ready Notification

**Trigger:** When Drop status changes to "Ready"

**Action:** Send webhook to notify member

```javascript
// Automation script
const dropId = input.config().dropId;

await fetch('https://flexlaundry.co.uk/api/notify-drop-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dropId: dropId,
    newStatus: 'Ready'
  })
});
```

### 2. Auto-Set Expected Ready

**Trigger:** When Drop record created

**Action:** Set Expected Ready = Drop Date + 48 hours

```javascript
const dropDate = input.config().dropDate;
const expectedReady = new Date(dropDate);
expectedReady.setHours(expectedReady.getHours() + 48);

output.set('expectedReady', expectedReady.toISOString());
```

### 3. Increment Member Total Drops

**Trigger:** When Drop status changes to "Collected"

**Action:** Increment Member.Total Drops

---

## Views

### Members Table Views

1. **All Members** - Default, all records
2. **Active Members** - Status = Active
3. **Paused Members** - Status = Paused
4. **By Gym** - Grouped by Gym
5. **Recent Signups** - Sorted by Created At desc

### Drops Table Views

1. **All Drops** - Default
2. **Active Drops** - Status NOT Collected
3. **At Risk** - Expected Ready < Now AND Status != Ready
4. **Ready for Pickup** - Status = Ready
5. **By Gym** - Grouped by Gym lookup

### Issues Table Views

1. **All Issues** - Default
2. **Open Issues** - Status = Open
3. **High Priority** - Priority = High OR Urgent
4. **My Issues** - Filter by assigned

---

## API Access

### Authentication

Use Personal Access Token (PAT):

```javascript
const headers = {
  'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json'
};
```

### Base URL

```
https://api.airtable.com/v0/{baseId}/{tableName}
```

### Common Queries

**Get member by phone:**
```javascript
const url = `https://api.airtable.com/v0/${baseId}/Members`;
const params = new URLSearchParams({
  filterByFormula: `{Phone Number} = '${phone}'`,
  maxRecords: '1'
});

const response = await fetch(`${url}?${params}`, { headers });
```

**Get active drops for member:**
```javascript
const url = `https://api.airtable.com/v0/${baseId}/Drops`;
const params = new URLSearchParams({
  filterByFormula: `AND(
    FIND('${memberId}', ARRAYJOIN({Member})),
    NOT({Status} = 'Collected')
  )`
});
```

**Create record:**
```javascript
await fetch(url, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    fields: {
      'Phone Number': '+447123456789',
      'Email': 'john@example.com',
      'Status': 'Active'
    }
  })
});
```

**Update record:**
```javascript
await fetch(`${url}/${recordId}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    fields: {
      'Status': 'Collected'
    }
  })
});
```

---

## Best Practices

### Phone Number Format
Always store in E.164 format: `+447123456789`

```javascript
function normalizePhone(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('44')) cleaned = '+' + cleaned;
  else if (cleaned.startsWith('0')) cleaned = '+44' + cleaned.slice(1);
  else if (!cleaned.startsWith('+')) cleaned = '+44' + cleaned;
  return cleaned;
}
```

### Linked Records
Use ARRAYJOIN for filtering:
```javascript
// CORRECT
`FIND('${recordId}', ARRAYJOIN({Member}))`

// WRONG
`{Member} = '${recordId}'`
```

### Error Handling
Handle rate limits:
```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After') || 30;
  await new Promise(r => setTimeout(r, retryAfter * 1000));
  // Retry request
}
```
