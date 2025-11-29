# FLEX Ops Dashboard Specification

## Overview

A lightweight internal operations dashboard for managing FLEX's daily logistics. Designed for ops team members to manage pickups, drop-offs, and monitor business health at a glance.

---

## Core Features

### 1. Dashboard Home (KPIs)

**Key Metrics Display:**
- Active Members (count + trend)
- Total Drops This Month (count + vs last month)
- Bags In Circulation (by status breakdown)
- Average Turnaround Time (hours)
- On-Time Delivery Rate (%)

**Quick Health Indicators:**
- 🟢 All systems normal
- 🟡 Attention needed (stuck bags, overdue pickups)
- 🔴 Critical issues (lost bags, complaints)

---

### 2. Drops Utilisation View

**Status Pipeline:**
```
Available → Dropped → At Laundry → Ready → Collected
```

**Visual Display:**
- Kanban-style columns OR
- Progress bar showing distribution
- Click any status to see bag list

**Metrics:**
- Bags per status (count + %)
- Average time in each status
- Bottleneck identification

---

### 3. Pickup Management (Gym → Laundry)

**Grouped by Gym:**
```
┌─────────────────────────────────────────────────────────────┐
│ PureGym Camden                                    3 bags    │
├─────────────────────────────────────────────────────────────┤
│ B0042 │ Sarah J.  │ Dropped 2hrs ago │ [Check In] │
│ B0087 │ Mike T.   │ Dropped 4hrs ago │ [Check In] │
│ B0103 │ Emma R.   │ Dropped 1hr ago  │ [Check In] │
├─────────────────────────────────────────────────────────────┤
│                              [Check In All]                 │
└─────────────────────────────────────────────────────────────┘
```

**Actions:**
- Individual "Check In" → Status: At Laundry
- "Check In All" for bulk processing
- Triggers: No customer message (internal transition)

**Filters:**
- By gym
- By time waiting (oldest first default)
- Search by bag number or member name

---

### 4. Laundry Partner Handoff

**Receive at Laundry:**
```
┌─────────────────────────────────────────────────────────────┐
│ Incoming Bags (In Transit)                        8 bags    │
├─────────────────────────────────────────────────────────────┤
│ B0042 │ PureGym Camden  │ Picked up 1hr ago │ [Confirm Receipt] │
│ B0087 │ PureGym Camden  │ Picked up 1hr ago │ [Confirm Receipt] │
│ B0103 │ The Gym Holborn │ Picked up 30m ago │ [Confirm Receipt] │
├─────────────────────────────────────────────────────────────┤
│                              [Confirm All]                   │
└─────────────────────────────────────────────────────────────┘
```

**Mark as Cleaned:**
```
┌─────────────────────────────────────────────────────────────┐
│ At Laundry (Being Cleaned)                       12 bags    │
├─────────────────────────────────────────────────────────────┤
│ B0042 │ Sarah J.  │ Received 6hrs ago │ [Mark Clean] │
│ B0087 │ Mike T.   │ Received 8hrs ago │ [Mark Clean] │
├─────────────────────────────────────────────────────────────┤
│                              [Mark All Clean]                │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Return to Gym (Delivery)

**Ready for Delivery:**
```
┌─────────────────────────────────────────────────────────────┐
│ Ready for Delivery                               15 bags    │
├─────────────────────────────────────────────────────────────┤
│ PUREGYM CAMDEN (5 bags)                                     │
│   B0042, B0087, B0103, B0156, B0189                        │
│                                         [Mark All Delivered]│
├─────────────────────────────────────────────────────────────┤
│ THE GYM HOLBORN (3 bags)                                    │
│   B0201, B0215, B0223                                       │
│                                         [Mark All Delivered]│
└─────────────────────────────────────────────────────────────┘
```

**On "Mark Delivered":**
- Status → Ready
- Customer WhatsApp: "Your bag is ready for pickup at [Gym]!"
- Email fallback if WhatsApp fails

---

### 6. Issues & Alerts Panel

**Priority Queue:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ ATTENTION NEEDED                                         │
├─────────────────────────────────────────────────────────────┤
│ 🔴 B0042 stuck in "Dropped" for 8 hours (SLA: 6hrs)        │
│    Sarah J. | PureGym Camden | [View] [Resolve]            │
├─────────────────────────────────────────────────────────────┤
│ 🟡 B0087 at laundry for 30 hours (SLA: 24hrs)              │
│    Mike T. | The Gym Holborn | [View] [Resolve]            │
├─────────────────────────────────────────────────────────────┤
│ 🟡 3 bags ready for 5+ days (overdue pickup)               │
│    [View List]                                              │
└─────────────────────────────────────────────────────────────┘
```

**Issue Types:**
- Stuck bags (exceeding SLA)
- Overdue pickups (customer not collecting)
- Damage claims (with photos)
- Customer complaints
- Missing bags

---

### 7. Member Quick Lookup

**Search by:**
- Phone number
- Email
- Name
- Bag number

**Member Card:**
```
┌─────────────────────────────────────────────────────────────┐
│ Sarah Johnson                                               │
│ sarah@email.com | +447700900123                            │
├─────────────────────────────────────────────────────────────┤
│ Plan: Essential (£30/mo)  │  Status: Active                │
│ Gym: PureGym Camden       │  Member since: Oct 2024        │
│ Drops: 7/10 remaining     │  Next billing: Dec 15          │
├─────────────────────────────────────────────────────────────┤
│ Recent Drops:                                               │
│ • B0042 - Ready (waiting at gym)                           │
│ • B0038 - Collected (Nov 25)                               │
│ • B0031 - Collected (Nov 20)                               │
├─────────────────────────────────────────────────────────────┤
│ [Send Message] [View Full History] [Manage Subscription]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Additional Recommended Features

### 8. Route Optimization View

**Daily Route Planner:**
- Map view of gyms with bag counts
- Suggested pickup route (nearest neighbour algorithm)
- Estimated time per stop
- Print/export route sheet

**Why Critical:**
- Reduces driver time
- Ensures no gym forgotten
- Optimizes fuel costs

---

### 9. Laundry Partner Portal (Separate Login)

**Limited View for Laundry Partner:**
- Incoming bags (today's expected)
- Bags currently with them
- Mark as complete button
- No access to customer data (privacy)

**Why Critical:**
- Reduces your ops workload
- Partner self-service
- Better accountability

---

### 10. SLA & Performance Tracking

**Metrics Dashboard:**
- Average turnaround time (target: <48hrs)
- On-time rate (target: >95%)
- Re-wash rate (quality indicator)
- Customer satisfaction (from feedback)

**Trend Charts:**
- Weekly/monthly performance
- By gym comparison
- By laundry partner comparison

**Why Critical:**
- Identify underperforming partners
- Data for gym partnership discussions
- Investor-ready metrics

---

### 11. Capacity Planning

**Forecasting:**
- Expected drops today/this week
- Laundry partner capacity limits
- Peak day identification (Mondays typically)

**Alerts:**
- "Approaching capacity at [Laundry Partner]"
- "Unusual volume spike at [Gym]"

**Why Critical:**
- Prevent bottlenecks
- Plan staffing
- Negotiate partner capacity

---

### 12. Audit Trail

**Full History Log:**
- Every status change with timestamp
- Who made the change (ops user)
- Automatic vs manual changes
- Searchable and exportable

**Why Critical:**
- Dispute resolution
- Quality control
- Compliance

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FLEX Ops Dashboard                       │
│                   (Next.js + Tailwind)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │Dashboard│  │ Pickups │  │Laundry │  │Delivery │        │
│  │  Home   │  │  Mgmt   │  │ Handoff │  │  Mgmt   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │            │             │
│       └────────────┴─────┬──────┴────────────┘             │
│                          │                                  │
│                    ┌─────┴─────┐                           │
│                    │  API      │                           │
│                    │  Routes   │                           │
│                    └─────┬─────┘                           │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
      ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
      │ Airtable  │  │  Twilio   │  │  Stripe   │
      │ (Database)│  │(WhatsApp) │  │(Payments) │
      └───────────┘  └───────────┘  └───────────┘
```

### Authentication

**Simple PIN/Password for MVP:**
- Shared ops password (single team)
- No individual logins initially

**Future:**
- Individual logins
- Role-based access (admin, ops, laundry partner)
- Audit trail per user

### API Endpoints Needed

```
GET  /api/ops/dashboard     - KPI summary
GET  /api/ops/drops         - All drops with filters
POST /api/ops/drops/checkin - Bulk status update
GET  /api/ops/members       - Member search
GET  /api/ops/issues        - Active issues
POST /api/ops/issues/resolve - Close issue
GET  /api/ops/gyms          - Gym summary with counts
```

---

## Security Considerations

1. **Separate subdomain:** ops.flexlaundry.co.uk
2. **Password protected:** Simple auth for MVP
3. **No public access:** Not indexed, no public links
4. **Minimal PII display:** Phone numbers masked except last 4 digits
5. **Action logging:** All changes logged with timestamp

---

## Priority Phases

### Phase 1 (MVP) - Build Now
- [ ] Dashboard home with KPIs
- [ ] Pickup management (gym → laundry)
- [ ] Delivery management (laundry → gym)
- [ ] Basic member lookup
- [ ] Simple auth

### Phase 2 (Month 2-3)
- [ ] Laundry partner handoff view
- [ ] Issues panel
- [ ] SLA tracking
- [ ] Route optimization

### Phase 3 (Month 4+)
- [ ] Laundry partner portal
- [ ] Capacity planning
- [ ] Advanced analytics
- [ ] Mobile app version

---

## Estimated Build Time

| Component | Hours | Priority |
|-----------|-------|----------|
| Dashboard Home | 4 | P1 |
| Pickup Management | 6 | P1 |
| Delivery Management | 4 | P1 |
| Member Lookup | 3 | P1 |
| Auth | 2 | P1 |
| **Phase 1 Total** | **19** | |
| Issues Panel | 4 | P2 |
| SLA Tracking | 4 | P2 |
| Laundry Handoff | 4 | P2 |
| **Phase 2 Total** | **12** | |

---

*Last Updated: November 2024*
