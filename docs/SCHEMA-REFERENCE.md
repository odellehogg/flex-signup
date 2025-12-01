# FLEX Airtable Schema - Complete Reference
## December 2024

---

## Tables Overview

| Table | Status | Purpose |
|-------|--------|---------|
| Members | ✅ Complete | Customer database |
| Gyms | ✅ Complete | Partner gyms (CMS) |
| Drops | ✅ Complete | Bag tracking |
| Issues | ✅ Complete | Support tickets |
| Plans | ✅ Complete | Subscription plans (CMS) |
| Laundry Partners | ✅ Complete | Laundry facilities |
| Gyms Laundry Mapping | ✅ Complete | Junction table |
| Bags | ❌ Deleted | Use Drops table views instead |
| Discounts | ✅ Complete | Promo codes |
| Addons | ⏸️ Skipped | Future upsells |
| Config | ✅ Complete | System settings |
| Content | ✅ Complete | Legacy CMS content |
| Page Sections | ✅ Complete | CMS section visibility |
| Page Content | ✅ Complete | CMS editable text |
| Audit Logs | ✅ Complete | Activity tracking |
| Gym Interest | ✅ Complete | BD leads |

---

## Field Reference by Table

### Members
| Field | Type | Notes |
|-------|------|-------|
| First Name | Single line text | |
| Last Name | Single line text | |
| Email | Email | |
| Phone | Phone number | Renamed from "Phone Number" |
| Gym | Link to Gyms | |
| Gym Name | Lookup → Gym → Name | For display (fixed) |
| Subscription Tier | Single select | Essential, Unlimited, Pay As You Go |
| Subscription Status | Single select | Active, Paused, Cancelled, Past Due |
| Stripe Customer ID | Single line text | |
| Stripe Subscription ID | Single line text | |
| Signup Date | Date | |
| Conversation State | Single select | 14 options |
| Referral Code | Single line text | |
| Pending Issue Type | Single line text | |
| Drops Used | Number | |
| Drops Allowed | Number | |

### Gyms
| Field | Type | Notes |
|-------|------|-------|
| Name | Single line text | Primary field |
| Slug | Single line text | URL-friendly |
| Address | Single line text | |
| Postcode | Single line text | |
| Laundry Partner | Link to Laundry Partners | |
| Contact Name | Single line text | |
| Contact Email | Email | |
| Contact Phone | Phone | |
| Drop Off Cutoff | Single line text | e.g., "6pm" |
| Pickup Hours | Single line text | e.g., "7am-10pm" |
| Is Active | Checkbox | |
| Launch Date | Date | |
| Members | Link to Members | |
| Drops | Link to Drops | |

### Drops
| Field | Type | Notes |
|-------|------|-------|
| Bag Number | Single line text | Primary, e.g., "B001" |
| Member | Link to Members | |
| Gym | Link to Gyms | |
| Status | Single select | Dropped, In Transit, At Laundry, Ready, Collected, Cancelled |
| Drop Date | Date with time | |
| Ready Date | Date with time | |
| Pickup Date | Date with time | |
| Is Free Drop | Checkbox | |
| Pickup Confirm Sent | Checkbox | |
| Pickup Reminder Sent | Checkbox | |
| Notes | Long text | |

### Issues
| Field | Type | Notes |
|-------|------|-------|
| Ticket ID | Single line text | Primary, e.g., "FLEX-ABC123" |
| Member | Link to Members | |
| Type | Single select | Late Delivery, Missing Bag, Wrong Items, Damage Claim, Feedback, Other |
| Description | Long text | |
| Status | Single select | Open, In Progress, Waiting on Customer, Resolved, Closed |
| Priority | Single select | Low, Medium, High, Urgent |
| Resolution | Long text | |
| Created | Date | |
| Resolved Date | Date | |
| Assigned To | Single line text | |
| Photo URL | URL | For damage claims |

### Plans
| Field | Type | Notes |
|-------|------|-------|
| Name | Single line text | Primary |
| Slug | Single line text | |
| Price | Number | Formatted as £ |
| Drops Per Month | Number | |
| Description | Long text | |
| Features | Long text | |
| Stripe Price ID | Single line text | |
| Is Popular | Checkbox | |
| Is Active | Checkbox | |
| Sort Order | Number | |

### Laundry Partners
| Field | Type | Notes |
|-------|------|-------|
| Name | Single line text | Primary |
| Address | Single line text | |
| Contact | Single line text | |
| Phone | Phone | |
| Email | Email | |
| Status | Single select | Active, Inactive |
| Notes | Long text | |
| Gyms | Link to Gyms Laundry Mapping | |

### Config
| Field | Type | Notes |
|-------|------|-------|
| Key | Single line text | Primary |
| Value | Single line text | |

Current values:
- turnaround_hours: 48
- max_items_per_bag: 5
- retention_days: 7
- reengagement_days: 14
- support_email: hello@flexlaundry.co.uk
- website_url: https://flexlaundry.co.uk
- referral_drops: 1
- maintenance_mode: false

### Discounts
| Field | Type | Notes |
|-------|------|-------|
| Code | Single line text | Primary |
| Type | Single select | Promo, Referral, Retention, Partner |
| Value | Number | |
| Description | Single line text | |
| Stripe Coupon ID | Single line text | |
| Valid From | Date | |
| Valid To | Date | |
| Max Uses | Number | |
| Used Count | Number | |
| Applies To | Single select | All, etc. |
| Is Active | Checkbox | |
| Is First Month Only | Checkbox | |

### Audit Logs
| Field | Type | Notes |
|-------|------|-------|
| Timestamp | Date with time | |
| Action | Single select | Created, Updated, Deleted, Login, Signup, Drop Created, Status Changed, Payment Failed, Payment Success |
| Actor | Single line text | |
| Entity Type | Single select | Member, Drop, Issue, Subscription, Payment |
| Entity ID | Single line text | |
| Details | Long text | |
| IP Address | Single line text | |

### Gym Interest
| Field | Type | Notes |
|-------|------|-------|
| Email | Email | Primary |
| First Name | Single line text | |
| Last Name | Single line text | |
| Phone Number | Phone | |
| Gym Name | Single line text | |
| Location | Single line text | |
| Status | Single select | New, Contacted, Meeting Scheduled, Negotiating, Won, Lost |
| Source | Single select | Website, Referral, Cold Outreach, Event, LinkedIn, Other |
| Created | Date | |
| Notes | Long text | |

---

## Pending Tasks

1. ✅ Airtable schema configured
2. ✅ Code updated to match schema
3. ⏳ Build Ops Dashboard (with inventory tracking from Drops views)
4. ⏳ Test WhatsApp flow end-to-end
5. ⏳ Deploy to Vercel

---

## Files Updated

- `/home/claude/flex-updated/lib/airtable.js` - Database functions
- `/home/claude/flex-updated/app/api/webhooks/whatsapp/route.js` - WhatsApp webhook

---

## Key Fixes Applied

1. **Gym Name lookup** - Fixed to lookup Name not Slug
2. **Phone field** - Renamed from "Phone Number" to "Phone"
3. **Drops.Gym** - Now properly linked to Gyms table
4. **Plans** - "Single Drop" renamed to "Pay As You Go"
5. **Discount types** - Updated to Promo, Referral, Retention, Partner
6. **Bags table** - Deleted (use Drops views instead)
