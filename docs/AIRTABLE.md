# FLEX Airtable Database Setup

Complete guide to setting up your Airtable base for FLEX.

## Create New Base

1. Go to airtable.com
2. Create new base called "FLEX Production"
3. Create the tables below

---

## Table 1: Members

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| First Name | Single line text | |
| Last Name | Single line text | |
| Email | Email | |
| Phone Number | Phone | |
| Gym | Single line text | |
| Subscription Tier | Single select | Essential, Unlimited, Single |
| Status | Single select | Active, Paused, Cancelled, Past Due, Cancelling |
| Signup Date | Date | |
| Stripe Customer ID | Single line text | |
| Stripe Subscription ID | Single line text | |
| Conversation State | Single line text | Default: idle |
| Referral Code | Single line text | |
| Referred By | Link to Members | |
| Free Drops | Number | Integer |
| Last Drop Date | Date | |
| Pause Resume Date | Date | |
| Notes | Long text | |

**Views:**
- All Members (Grid)
- Active Members (Filter: Status = Active)
- Inactive (Filter: Last Drop Date > 14 days ago)
- Paused (Filter: Status = Paused)

---

## Table 2: Drops

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| Bag Number | Single line text | |
| Member | Link to Members | |
| Gym Name | Single line text | |
| Status | Single select | Dropped, At Laundry, Ready, Collected, Cancelled |
| Drop Date | Date | Include time |
| Ready Date | Date | Include time |
| Pickup Date | Date | Include time |
| Is Free Drop | Checkbox | |
| Pickup Confirm Sent | Checkbox | For tracking confirmation flow |
| Pickup Reminder Sent | Checkbox | For tracking reminder flow |
| Notes | Long text | |

**Views:**
- All Drops (Grid)
- Active Drops (Filter: Status NOT Collected, NOT Cancelled)
- Ready for Pickup (Filter: Status = Ready)
- Awaiting Collection (Filter: Status = Ready) - for pickup confirmation tracking
- Today's Drops (Filter: Drop Date = Today)

---

## Table 3: Issues

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| Ticket ID | Single line text | |
| Member | Link to Members | |
| Type | Single select | Feedback, Lost Item, Damage, Billing, Other |
| Description | Long text | |
| Status | Single select | Open, In Progress, Resolved |
| Priority | Single select | Low, Medium, High, Urgent |
| Resolution | Long text | |
| Created | Date | Include time |
| Resolved Date | Date | Include time |
| Assigned To | Single line text | |

**Views:**
- All Issues (Grid)
- Open Issues (Filter: Status = Open OR In Progress)
- Urgent (Filter: Priority = Urgent, High)

---

## Table 4: Plans (CMS)

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| Name | Single line text | |
| Slug | Single line text | |
| Price | Number | Decimal |
| Drops Per Month | Number | Integer |
| Description | Single line text | |
| Stripe Price ID | Single line text | |
| Is Popular | Checkbox | |
| Is Active | Checkbox | Default: true |
| Sort Order | Number | Integer |
| Features | Long text | One per line |

**Sample Data:**

| Name | Slug | Price | Drops | Stripe Price ID | Is Popular |
|------|------|-------|-------|-----------------|------------|
| Essential | essential | 30 | 10 | price_xxx | ❌ |
| Unlimited | unlimited | 48 | 16 | price_xxx | ✅ |
| Single Drop | single | 5 | 1 | price_xxx | ❌ |

---

## Table 5: Gyms (CMS)

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| Name | Single line text | |
| Slug | Single line text | |
| Address | Single line text | |
| Postcode | Single line text | |
| Contact Name | Single line text | |
| Contact Email | Email | |
| Contact Phone | Phone | |
| Drop Off Cutoff | Single line text | e.g., "6pm" |
| Pickup Hours | Single line text | |
| Is Active | Checkbox | Default: true |
| Launch Date | Date | |
| Logo | Attachment | |
| Notes | Long text | |

**Sample Data:**

| Name | Slug | Address | Postcode |
|------|------|---------|----------|
| East London Fitness | east-london-fitness | 123 Mare Street | E8 3RH |
| The Yard | the-yard | 45 Shoreditch High St | E2 6JJ |
| CrossFit Hackney | crossfit-hackney | 78 Wallis Road | E9 5LN |

---

## Table 6: Addons (CMS)

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| Name | Single line text | |
| Slug | Single line text | |
| Price | Number | Decimal |
| Description | Single line text | |
| Stripe Price ID | Single line text | |
| Is Active | Checkbox | Default: true |
| Sort Order | Number | Integer |

**Sample Data:**

| Name | Slug | Price | Description |
|------|------|-------|-------------|
| Shoe Refresh | shoe-refresh | 5 | Deodorise your trainers |
| Express 24hr | express | 8 | 24-hour turnaround |
| Extra Bag | extra-bag | 3 | Additional FLEX bag |

---

## Table 7: Discounts (CMS)

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| Code | Single line text | |
| Type | Single select | Percentage, Fixed Amount, Free Drop |
| Value | Number | |
| Description | Single line text | |
| Stripe Coupon ID | Single line text | |
| Valid From | Date | |
| Valid To | Date | |
| Max Uses | Number | Integer |
| Used Count | Number | Integer, default: 0 |
| Applies To | Multiple select | Essential, Unlimited, Single, All |
| Is Active | Checkbox | Default: true |
| Is First Month Only | Checkbox | |

**Sample Data:**

| Code | Type | Value | Description |
|------|------|-------|-------------|
| FLEX20 | Percentage | 20 | 20% off first month |
| WELCOME | Percentage | 50 | 50% off first month |
| FREEDROP | Free Drop | 1 | One free drop |
| FRIEND10 | Fixed Amount | 10 | £10 off referral |

---

## Table 8: Config (System Settings)

**Fields:**

| Field Name | Type |
|------------|------|
| Key | Single line text |
| Value | Single line text |

**Required Records:**

| Key | Value |
|-----|-------|
| turnaround_hours | 48 |
| max_items_per_bag | 5 |
| retention_days | 7 |
| reengagement_days | 14 |
| support_email | hello@flexlaundry.co.uk |
| website_url | https://flexlaundry.co.uk |
| referral_drops | 1 |
| maintenance_mode | false |

---

## Table 9: Content (Website CMS)

**Fields:**

| Field Name | Type |
|------------|------|
| Key | Single line text |
| Value | Long text |

**Sample Records:**

| Key | Value |
|-----|-------|
| hero_headline | Gym Clothes Laundry Made Easy |
| hero_subheadline | Drop off sweaty gym clothes, pick up fresh... |
| how_it_works_step1 | Grab a FLEX bag from reception... |
| faq_what_is_drop | One drop is one FLEX bag with up to 5 items... |
| footer_copyright | © 2024 FLEX Active Group Ltd |

---

## Table 10: Page Sections (Show/Hide Sections)

**Purpose:** Control which sections appear on each page. Uncheck "Is Active" to hide a section entirely.

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| Page | Single select | homepage, partners, pricing, how-it-works, faq, gyms, contact, success |
| Section ID | Single line text | e.g., "revenue-share", "hero", "benefits" |
| Title | Single line text | For your reference |
| Is Active | Checkbox | Default: true. Uncheck to hide section |
| Sort Order | Number | Controls display order |

**Available Section IDs by Page:**

| Page | Section IDs |
|------|-------------|
| homepage | hero, problem, how-it-works, pricing-preview, whatsapp, testimonials, cta |
| partners | hero, benefits, setup, what-we-provide, revenue-share, contact-form |
| pricing | hero, plans, faqs, cta |
| how-it-works | hero, step-1, step-2, step-3, included, cta |
| faq | (content only, no sections) |
| gyms | hero, gyms-list, not-listed |
| contact | hero, contact-options, faq-cta |
| success | (no section control needed) |

**Example: Hide Revenue Share on Partners Page:**

| Page | Section ID | Title | Is Active |
|------|------------|-------|-----------|
| partners | revenue-share | Revenue Share Model | ❌ (HIDDEN) |

---

## Table 11: Page Content (Edit Text)

**Purpose:** Edit text content on pages without touching code.

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| Page | Single select | homepage, partners, pricing, how-it-works, faq, gyms, contact, success |
| Key | Single line text | Identifier for the content piece |
| Value | Long text | The actual content |
| Is Active | Checkbox | Default: true |

**Available Content Keys by Page:**

### Homepage
- hero_title, hero_title_accent, hero_subtitle, hero_cta_primary, hero_cta_secondary
- hero_badges (JSON array)
- problem_title, problem_subtitle
- how_title, how_subtitle, how_cta
- pricing_title, pricing_subtitle
- pricing_single_name, pricing_single_price, pricing_single_desc
- pricing_essential_name, pricing_essential_price, pricing_essential_desc
- whatsapp_title, whatsapp_subtitle, whatsapp_feature_1-4, whatsapp_demo_message
- testimonials (JSON array), testimonials_title
- cta_title, cta_subtitle, cta_primary, cta_secondary

### Partners
- hero_title, hero_subtitle, hero_cta
- benefits_title, benefits_subtitle, benefits_items (JSON)
- setup_title, setup_steps (JSON)
- provide_title, require_title, require_footer
- we_provide_items (JSON), you_provide_items (JSON)
- revenue_title, revenue_subtitle
- revenue_percent, revenue_percent_label
- revenue_amount, revenue_amount_label
- revenue_frequency, revenue_frequency_label
- form_title, form_subtitle

### Pricing
- hero_title, hero_subtitle
- faqs_title, faqs (JSON array)
- cta_title, cta_subtitle, cta_button

### How It Works
- hero_title, hero_subtitle
- step1_title, step1_description, step1_feature1-3
- step2_title, step2_description, step2_feature1-3
- step3_title, step3_description, step3_feature1-3
- included_title, included_subtitle, included_items (JSON), included_note
- cta_title, cta_subtitle, cta_primary, cta_secondary

### FAQ
- hero_title, hero_subtitle
- faqs (JSON - full FAQ structure)
- cta_title, cta_subtitle
- whatsapp_link, email_link

### Gyms
- hero_title, hero_subtitle
- not_listed_title, not_listed_subtitle, not_listed_cta, partner_cta

### Contact
- hero_title, hero_subtitle
- whatsapp_title, whatsapp_description, whatsapp_link, whatsapp_number
- email_title, email_description, email_link, email_address
- partner_title, partner_description, partner_link_text
- faq_title, faq_subtitle, faq_button

### Success
- hero_title, hero_subtitle
- next_title, help_title, help_subtitle
- whatsapp_link

---

## Table 12: Gym Interest (BD Leads)

**Purpose:** Track potential customers who want FLEX at gyms we don't serve yet.

**Fields:**

| Field Name | Type | Options |
|------------|------|---------|
| Email | Email | Required |
| First Name | Single line text | |
| Last Name | Single line text | |
| Phone Number | Phone | |
| Gym Name | Single line text | Required |
| Location | Single line text | Postcode or area |
| Status | Single select | New, Contacted, Converted, Not Interested |
| Source | Single select | Website, QR Code, Referral, Social |
| Created | Date | Include time |
| Notes | Long text | |

**Views:**
- New Leads (Filter: Status = New)
- By Gym Name (Group by Gym Name, Sort by count descending)
- Hot Gyms (Filter: More than 3 requests for same gym)

**Automation:** When 5+ people request the same gym, alert the team for BD outreach.

---

## CMS Quick Reference

### To hide a section on any page:
1. Go to **Page Sections** table
2. Add row: Page = [page name], Section ID = [section-id], Is Active = ❌

### To change text on any page:
1. Go to **Page Content** table
2. Add row: Page = [page name], Key = [content-key], Value = [your text]

### To hide/show a plan:
1. Go to **Plans** table
2. Check/uncheck **Is Active** checkbox

### To add/remove a gym:
1. Go to **Gyms** table
2. Add row or check/uncheck **Is Active**

---

## Automations

### Automation 1: Drop Status Changed

**Trigger:** When record matches conditions
- Table: Drops
- Condition: Status is not empty
- Watch field: Status

**Action:** Run script

```javascript
const config = input.config();
const record = config.record;

const bagNumber = record.getCellValue('Bag Number');
const status = record.getCellValue('Status').name;
const memberLink = record.getCellValue('Member');
const memberId = memberLink ? memberLink[0].id : null;

if (memberId) {
  await fetch('https://flexlaundry.co.uk/api/notify-drop-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bagNumber, status, memberId })
  });
}
```

### Automation 2: Daily Re-engagement (Optional)

If not using Vercel Cron, set up daily automation:

**Trigger:** At scheduled time (10:00 AM daily)

**Action:** Run script calling `/api/cron/reengagement`

---

## API Access

### Get API Key

1. Go to airtable.com/create/tokens
2. Create new token
3. Scopes: data.records:read, data.records:write
4. Access: Your FLEX base

### Get Base ID

1. Open your base
2. Look at URL: airtable.com/appXXXXXXXXX/...
3. The appXXX part is your Base ID

---

## Views for Operations

Create these views for daily operations:

### Members Table
- **Active Members**: Status = Active
- **Needs Attention**: Status = Past Due OR Status = Cancelling
- **New This Week**: Signup Date is within past 7 days

### Drops Table  
- **Active Drops**: Status ≠ Picked Up AND Status ≠ Cancelled
- **Ready for Pickup**: Status = Ready
- **Overdue Pickup**: Status = Ready AND Ready Date < 5 days ago
- **Today's Activity**: Drop Date is today OR Ready Date is today

### Issues Table
- **Open Issues**: Status = Open
- **Urgent**: Priority = High OR Priority = Urgent
- **Unassigned**: Assigned To is empty AND Status = Open

---

## Backup

Set up automated backups:

1. Use Airtable's built-in snapshot feature (Pro plan)
2. Or use third-party like On2Air Backups
3. Recommended: Daily backups, keep 30 days

---

## Rate Limits

Airtable API limits:
- 5 requests per second per base
- Batch operations: max 10 records

The FLEX code handles rate limiting automatically.
