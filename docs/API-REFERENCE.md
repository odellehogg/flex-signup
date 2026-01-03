# API Reference

## Overview

All API routes are serverless functions deployed on Vercel. Routes are located in `app/api/`.

## Webhooks

### POST /api/webhooks/stripe

Handles Stripe webhook events.

**Headers:**
- `stripe-signature` - Stripe signature for verification

**Events Handled:**
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create member, send welcome |
| `invoice.payment_succeeded` | Reset drops, log payment |
| `invoice.payment_failed` | Send retry notification |
| `customer.subscription.updated` | Update member status |
| `customer.subscription.deleted` | Mark cancelled |

**Response:** `200 OK` with `{ received: true }`

---

### POST /api/webhooks/whatsapp

Handles incoming WhatsApp messages from Twilio.

**Headers:**
- `x-twilio-signature` - Twilio signature for verification

**Body (form-urlencoded):**
```
From=whatsapp:+44...
Body=MENU
ButtonPayload=MAIN_MENU (for button presses)
NumMedia=0
MediaUrl0=https://... (if photo sent)
```

**Handled Payloads:**
| Payload | Action |
|---------|--------|
| `MAIN_MENU`, `MENU` | Send main menu |
| `START_DROP` | Send drop guide, set AWAITING_BAG_NUMBER |
| `TRACK_ORDER` | Show active drops |
| `CHECK_DROPS` | Show remaining drops |
| `MANAGE_SUBSCRIPTION` | Show manage menu |
| `PAUSE_SUBSCRIPTION` | Pause subscription |
| `RESUME_SUBSCRIPTION` | Resume subscription |
| `CHANGE_GYM` | Start gym change flow |
| `BILLING` | Send Stripe portal link |
| `HELP` | Show support menu |
| `REPORT_ISSUE` | Start issue flow |
| `FEEDBACK_GREAT` | Log positive feedback |
| `FEEDBACK_OK` | Log neutral feedback |
| `FEEDBACK_BAD` | Start issue flow |

**Response:** `200 OK` (empty body for Twilio)

---

## Portal APIs

### POST /api/portal/request-code

Request login code via WhatsApp.

**Body:**
```json
{
  "phone": "+447123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code sent to WhatsApp"
}
```

**Errors:**
- `400` - Invalid phone number
- `404` - Member not found
- `429` - Too many requests

---

### POST /api/portal/verify-code

Verify login code and get session.

**Body:**
```json
{
  "phone": "+447123456789",
  "code": "123456"
}
```

**Response:** Sets `flex_auth` cookie, returns:
```json
{
  "success": true,
  "member": {
    "id": "recXXX",
    "firstName": "John",
    "gym": "Third Space"
  }
}
```

**Errors:**
- `400` - Invalid code
- `401` - Code expired or max attempts
- `404` - Member not found

---

### GET /api/portal/me

Get authenticated member data.

**Headers:**
- Cookie: `flex_auth=<jwt>`

**Response:**
```json
{
  "member": {
    "id": "recXXX",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+447123456789",
    "email": "john@example.com",
    "gym": "Third Space",
    "subscriptionTier": "Essential",
    "status": "Active",
    "dropsRemaining": 7,
    "totalDrops": 42
  },
  "subscription": {
    "status": "active",
    "currentPeriodEnd": "2025-02-15",
    "cancelAtPeriodEnd": false
  },
  "drops": [
    {
      "id": "recYYY",
      "bagNumber": "B042",
      "status": "Ready",
      "dropDate": "2025-01-14",
      "expectedReady": "2025-01-16"
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated

---

### POST /api/portal/subscription/pause

Pause subscription.

**Headers:**
- Cookie: `flex_auth=<jwt>`

**Response:**
```json
{
  "success": true,
  "resumeDate": "2025-02-15"
}
```

---

### POST /api/portal/subscription/resume

Resume paused subscription.

**Headers:**
- Cookie: `flex_auth=<jwt>`

**Response:**
```json
{
  "success": true,
  "status": "active"
}
```

---

### POST /api/portal/subscription/cancel

Cancel subscription at period end.

**Headers:**
- Cookie: `flex_auth=<jwt>`

**Body:**
```json
{
  "reason": "Moving away"
}
```

**Response:**
```json
{
  "success": true,
  "cancelAt": "2025-02-15"
}
```

---

### POST /api/portal/change-gym

Change member's gym.

**Headers:**
- Cookie: `flex_auth=<jwt>`

**Body:**
```json
{
  "gymId": "recZZZ"
}
```

**Response:**
```json
{
  "success": true,
  "gym": "Gymbox"
}
```

---

### GET /api/portal/billing

Get Stripe billing portal URL.

**Headers:**
- Cookie: `flex_auth=<jwt>`

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

## Checkout APIs

### POST /api/create-checkout

Create Stripe checkout session.

**Body:**
```json
{
  "planId": "essential",
  "gymCode": "third-space",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

---

### GET /api/checkout/success

Verify checkout completion.

**Query:**
- `session_id` - Stripe session ID

**Response:**
```json
{
  "success": true,
  "plan": "Essential",
  "gym": "Third Space"
}
```

---

## Ops APIs

All ops APIs require `Authorization: Bearer <OPS_AUTH_TOKEN>` header.

### GET /api/ops/dashboard

Get dashboard overview metrics.

**Response:**
```json
{
  "metrics": {
    "activeMembers": 87,
    "activeDrops": 24,
    "openTickets": 3,
    "todayDrops": 8
  },
  "health": {
    "score": 92,
    "status": "healthy"
  }
}
```

---

### GET /api/ops/members

List members with filters.

**Query:**
- `status` - Filter by status (Active, Paused, etc.)
- `gym` - Filter by gym ID
- `search` - Search name/email/phone
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "members": [...],
  "total": 87,
  "page": 1,
  "totalPages": 5
}
```

---

### GET /api/ops/drops

List drops with filters.

**Query:**
- `status` - Filter by status
- `gym` - Filter by gym ID
- `dateFrom` - Start date
- `dateTo` - End date

**Response:**
```json
{
  "drops": [...],
  "total": 156
}
```

---

### PUT /api/ops/drops/:id

Update drop status.

**Body:**
```json
{
  "status": "Ready"
}
```

**Response:**
```json
{
  "success": true,
  "drop": {...}
}
```

---

### GET /api/ops/tickets

List support tickets.

**Query:**
- `status` - Filter by status (Open, In Progress, etc.)
- `priority` - Filter by priority

**Response:**
```json
{
  "tickets": [...],
  "total": 12
}
```

---

### PUT /api/ops/tickets/:id

Update ticket.

**Body:**
```json
{
  "status": "Resolved",
  "notes": "Refund processed"
}
```

---

### GET /api/ops/sla

Get SLA metrics.

**Response:**
```json
{
  "dropsAtRisk": [...],
  "ticketsNeedingAttention": [...],
  "metrics": {
    "complianceRate": 94.5,
    "avgTurnaround": 38.2
  }
}
```

---

## Cron APIs

All cron APIs require `Authorization: Bearer <CRON_SECRET>` header.

### POST /api/cron/reengagement

Send re-engagement messages to inactive members.

**Schedule:** Daily at 10:00 AM

**Logic:**
1. Find members with no drops in 14+ days
2. Filter to Active status only
3. Send re-engagement WhatsApp

**Response:**
```json
{
  "success": true,
  "sent": 5,
  "skipped": 2
}
```

---

### POST /api/cron/payment-retry

Notify members with failed payments.

**Schedule:** Daily at 9:00 AM

**Response:**
```json
{
  "success": true,
  "notified": 2
}
```

---

### POST /api/cron/pause-reminders

Send reminders to paused members about upcoming resume.

**Schedule:** Daily at 10:00 AM

**Response:**
```json
{
  "success": true,
  "sent": 1
}
```

---

## Utility APIs

### POST /api/notify-drop-status

Trigger WhatsApp notification for drop status change.
Called by Airtable automation.

**Body:**
```json
{
  "dropId": "recXXX",
  "newStatus": "Ready"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/gym-request

Capture interest for gym not yet partnered.

**Body:**
```json
{
  "gymName": "Fitness First",
  "location": "London Bridge",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "We'll notify you when we launch there"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_INPUT` | Missing or invalid parameters |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Not authorized |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
