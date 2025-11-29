# FLEX System Audit & Roadmap

## Executive Summary

This document provides a comprehensive audit of the FLEX platform, identifying scalability gaps, missing features, and prioritised actions for a robust production system.

**Last Updated:** November 2024
**Status:** Phase 1 Complete ✅

---

## 1. SCALABILITY AUDIT

### ✅ Now Fully Scalable

| Component | Implementation | Status |
|-----------|---------------|--------|
| **Gyms** | Dynamic from Airtable | ✅ Complete |
| **Plans (Display)** | Dynamic from Airtable | ✅ Complete |
| **Plans (Checkout)** | Fetches Stripe Price ID from Airtable | ✅ Complete |
| **Laundry Partners** | Dynamic with assignment in pickup flow | ✅ Complete |
| **Gym → Partner Routing** | Default mapping with override | ✅ Complete |
| **Member Lookup** | Live Airtable search | ✅ Complete |
| **Drop Status Tracking** | Status-based queries with audit logging | ✅ Complete |

### ⚠️ Remaining Items (Phase 2)

| Component | Notes | Priority |
|-----------|-------|----------|
| **WhatsApp Plan Changes** | Dynamic plan loading | 🟡 Medium |
| **Drop Limits Enforcement** | Link to plan config | 🟡 Medium |

---

## 2. IMPLEMENTED FEATURES

### ✅ 2.1 Laundry Partner Assignment (Complete)
- Partner selector in pickup workflow
- Default based on gym→partner mapping
- Override capability for load balancing
- Partner saved to drop record

### ✅ 2.2 Dynamic Plan Configuration (Complete)
- Stripe Price ID stored in Airtable Plans table
- Checkout fetches price ID dynamically
- No code changes to add new plans

### ✅ 2.3 Audit Trail (Complete)
- `lib/audit.js` - Logging functions
- `app/ops/audit/page.js` - Audit viewer
- Logs all status changes with operator, timestamp, source
- Filterable by entity type and source

### ✅ 2.4 SLA Monitoring (Complete)
- `lib/sla.js` - SLA calculation functions
- `app/api/cron/sla-check/route.js` - Hourly monitoring
- Email alerts for critical breaches
- Warning/critical thresholds configurable

### ✅ 2.5 Financial Reporting Dashboard (Complete)
- `app/ops/reports/page.js` - Full reporting page
- Revenue by plan tier
- Churn rate and reasons
- Utilisation metrics
- SLA performance

### ✅ 2.6 Enhanced Member Portal (Complete)
- `app/member/dashboard/page.js` - Self-service dashboard
- Token-based authentication via WhatsApp
- View drops remaining, active bags, history
- Link to Stripe billing portal
- Quick actions to WhatsApp

---

## 3. NOT IMPLEMENTING (Per Requirements)

| Feature | Reason |
|---------|--------|
| Route Optimisation | Future phase |
| Partner Portal | Future phase |
| Mobile PWA | Future phase |
| Auto Bag Assignment | MVP uses manual flow - bags picked up with drops |

---

## 4. AIRTABLE SCHEMA REQUIREMENTS

### New Tables Required

#### Audit Log
| Field | Type | Purpose |
|-------|------|---------|
| Timestamp | DateTime | When action occurred |
| Entity Type | Single Select | Drop, Member, Subscription, Bag, Issue |
| Entity ID | Text | Record ID |
| Action | Text | What happened |
| Old Value | Text | Previous state |
| New Value | Text | New state |
| Operator | Text | Who did it |
| Source | Single Select | Ops Dashboard, WhatsApp, System, Stripe |
| Metadata | Long Text | JSON additional context |

#### Laundry Partners
| Field | Type | Purpose |
|-------|------|---------|
| Name | Text | Partner name e.g. "CleanCo East London" |
| Address | Text | Facility address |
| Contact | Text | Primary contact phone/email |
| Status | Single Select | Active, Inactive, Paused |
| Daily Capacity | Number | Max bags per day |
| SLA Hours | Number | Expected turnaround |

### Table Modifications Required

#### Gyms (Add Fields)
| Field | Type | Purpose |
|-------|------|---------|
| Laundry Partner | Text or Link | Default partner for this gym |
| Status | Single Select | Active, Coming Soon, Paused |

#### Drops (Add Fields)
| Field | Type | Purpose |
|-------|------|---------|
| Laundry Partner | Text | Which partner processed this drop |
| Assignment Time | DateTime | When assigned to partner |
| Status Changed | DateTime | Last status change timestamp |

#### Plans (Ensure Fields Exist)
| Field | Type | Purpose |
|-------|------|---------|
| Stripe Price ID | Text | **CRITICAL** - For checkout |
| Drops Per Month | Number | Usage limit |
| Is Subscription | Checkbox | vs one-off payment |
| Slug | Text | URL-friendly identifier |
| Is Active | Checkbox | Show on pricing page |

#### Members (Add Fields)
| Field | Type | Purpose |
|-------|------|---------|
| Login Token | Text | For portal authentication |
| Token Expiry | DateTime | When token expires |

---

## 5. ENVIRONMENT VARIABLES

Add to `.env`:

```bash
# SLA Monitoring
OPS_ALERT_EMAIL=ops@flexlaundry.co.uk

# Member Portal
NEXT_PUBLIC_BASE_URL=https://flexlaundry.co.uk
```

---

## 6. CRON JOBS

| Job | Schedule | Purpose |
|-----|----------|---------|
| `/api/cron/sla-check` | Hourly | Monitor SLA breaches, send alerts |
| `/api/cron/issue-detection` | Every 2 hours | Detect stuck bags |
| `/api/cron/pickup-confirm` | Daily 11am | Chase unconfirmed pickups |
| `/api/cron/reengagement` | Daily 10am | Engage inactive members |
| `/api/cron/pause-reminder` | Daily 9am | Remind paused members |
| `/api/cron/payment-retry` | Daily 12pm | Retry failed payments |

---

## 7. OPS DASHBOARD PAGES

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/ops` | KPIs and overview |
| Pickups | `/ops/pickups` | Collect from gyms, assign to partners |
| Laundry | `/ops/laundry` | Track bags at laundry partners |
| Delivery | `/ops/delivery` | Return bags to gyms |
| Members | `/ops/members` | Search and view members |
| Reports | `/ops/reports` | Financial and operational metrics |
| Audit | `/ops/audit` | Complete action history |

---

## 8. IMMEDIATE ACTIONS

### Before Launch
1. ✅ Create Airtable schema updates
2. ✅ Populate Stripe Price IDs in Plans table
3. ✅ Create at least one Laundry Partner record
4. ✅ Set gym default partners
5. 🔲 Test full flow: signup → drop → pickup → laundry → delivery

### Post-Launch (Week 1-2)
6. 🔲 Monitor SLA alerts
7. 🔲 Review audit logs for issues
8. 🔲 Gather ops team feedback

---

## 9. SUCCESS METRICS

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to add new plan | < 5 mins | Airtable only, no deploy |
| Time to add new gym | < 5 mins | Airtable only |
| Time to add new partner | < 10 mins | Airtable only |
| Average turnaround | < 48 hours | SLA tracking |
| SLA compliance | > 95% | Automated monitoring |
| Ops errors | < 1% | Audit log analysis |

---

*Document created: November 2024*
*Implementation complete: November 2024*
