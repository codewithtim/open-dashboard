# Invoice Extraction — Standalone Product Exploration

## The Idea

A simple SaaS product for non-technical users (freelancers, small business owners, sole traders) who need to track their invoices and expenses without manually typing everything into a spreadsheet. Forward your invoices, we extract the data, you download a clean CSV or view it on a dashboard.

---

## How Do Users Get Invoices In?

### Option A: Email Forwarding (Recommended — Start Here)

Each user gets a unique address like `tim@receipts.yourproduct.com`. They set up one auto-forward rule in Gmail/Outlook and forget about it. Every invoice that hits their inbox automatically gets processed.

**User experience:**
1. Sign up, get your unique email address
2. Go to Gmail settings, add an auto-forward rule for emails from vendors (or all emails — we'll ignore non-invoices)
3. Done. Invoices appear on your dashboard as they come in.

**Pros:** Zero ongoing effort for the user. Works with any email provider. No scary permissions dialogs.

**Cons:** Requires the one-time forwarding setup (we'd provide step-by-step guides with screenshots for Gmail, Outlook, Yahoo, etc.). Can't scan historical inbox.

**Who does this:** Veryfi, Dext, Shoeboxed, Hubdoc — it's the industry standard.

### Option B: Manual Upload (Secondary)

Drag-and-drop on the web app. For paper receipts or one-off invoices that don't come via email.

### Option C: OAuth Mailbox Access (Future — Maybe)

Connect directly to Gmail/Outlook and scan automatically. More powerful but users are (rightly) uncomfortable granting full email read access. Requires Google Cloud verification for production. Probably not worth the trust barrier for an MVP.

### Recommendation

**Email forwarding + manual upload.** Covers 95% of use cases without any privacy concerns or complex integrations.

---

## The Extraction Pipeline

All invisible to the user. They just see invoices appearing on their dashboard.

### Step 1: Receive and Parse Email

- Extract PDF/image attachments
- Also parse the email HTML body — many SaaS invoices (Vercel, Stripe, AWS, Shopify) arrive as styled HTML, not PDF attachments
- Ignore non-invoice emails (signature detection, "thanks for your order" vs actual invoices)

### Step 2: Extract Data with AI

Send the invoice (as image or text) to a vision LLM. The LLM returns structured data.

Best options right now:
- **Claude Sonnet**: Highest accuracy, best with messy/varied documents
- **Gemini Flash**: Cheapest and fastest, good enough for clean digital invoices

### Step 3: Validate and Store

- Check extracted fields make sense (amount is a number, date is valid, currency is recognised)
- Auto-categorise (SaaS/software, office, travel, marketing, etc.)
- Deduplicate (same invoice forwarded twice)
- Flag anything low-confidence for user review

### What Gets Extracted

| Field | Example |
|-------|---------|
| Vendor name | "Vercel Inc." |
| Invoice number | "INV-2026-0042" |
| Date | "2026-03-01" |
| Due date | "2026-03-31" |
| Description | "Pro Plan — March 2026" |
| Subtotal | 20.00 |
| Tax | VAT 20%: 4.00 |
| Total | 24.00 |
| Currency | USD / GBP / EUR |

Line-item breakdown (individual items on the invoice) is a stretch goal — start with the header-level totals.

---

## What Does the User Get?

### Dashboard

Simple web dashboard showing:
- **Inbox**: Recently processed invoices, with status (processed / needs review / failed)
- **Monthly summary**: Total spend, broken down by category and vendor
- **Vendor list**: All vendors with running totals
- **Search and filter**: By date range, vendor, category, amount

### CSV Export

One-click download of all invoices as a CSV:

```
date, vendor, invoice_number, description, amount, tax, total, currency, category
2026-03-01, Vercel Inc., INV-042, Pro Plan, 20.00, 4.00, 24.00, GBP, software
2026-03-01, GitHub, GH-1234, Team Plan, 3.40, 0.68, 4.08, GBP, software
2026-02-28, Adobe, ADB-9981, Creative Cloud, 49.99, 10.00, 59.99, GBP, software
```

Importable into QuickBooks, Xero, FreeAgent, Wave, or any spreadsheet. Filterable by date range before download.

### API

Simple REST API with an API key (generated in account settings). Lets accountants, bookkeepers, or Zapier/Make integrations pull data without logging into the dashboard.

```
GET /api/v1/invoices?from=2026-01-01&to=2026-03-31&format=csv
GET /api/v1/invoices?from=2026-01-01&to=2026-03-31&format=json
GET /api/v1/invoices/:id
GET /api/v1/summary?month=2026-03
```

- Same filters as the dashboard (date range, vendor, category)
- `format=csv` returns the same CSV as the dashboard download
- `format=json` returns structured data for integrations
- API key auth (Bearer token), no OAuth complexity

This is low effort since the dashboard already needs these queries — the API is just a different output format on the same data.

### Email Summary (Nice-to-Have)

Weekly or monthly email: "You had 12 invoices totalling $487 this month. Top vendor: AWS ($190). Download CSV."

---

## Pricing Model

### $10/month Base + Credits

- **$10/month**: Account, dashboard, CSV export, email forwarding address, storage
- **Includes 50 invoice extractions/month** (covers most freelancers/sole traders)
- **Additional credits**: $0.05 per invoice beyond the included 50
- Credits roll over for 1 month (so light months aren't wasted)

### Why This Model

- **Predictable for the user**: Most people know roughly how many invoices they get. 50/month covers the vast majority.
- **Covers our costs**: LLM extraction costs ~$0.01-0.03 per invoice. At $0.05 per overage credit, there's healthy margin.
- **$10/month is impulse-buy territory**: Cheaper than Dext ($24/mo), Shoeboxed ($18/mo). Competitive with Tailride ($15/mo).
- **No per-invoice anxiety**: Users shouldn't have to think "is this invoice worth processing?" — the base tier is generous enough that most never hit the limit.

### Potential Tiers (Later)

| Plan | Price | Included | Extra |
|------|-------|----------|-------|
| Starter | $10/mo | 50 invoices | $0.05 each |
| Pro | $25/mo | 200 invoices | $0.03 each |
| Business | $50/mo | 500 invoices + team seats | $0.02 each |

---

## Competitive Landscape

| Product | Target User | Price | Approach |
|---------|------------|-------|----------|
| **Dext** | Accountants, bookkeepers | ~$24/mo | Email + mobile, feeds into Xero/QBO |
| **Hubdoc** | Xero users | Free w/ Xero | Locked to Xero ecosystem |
| **Shoeboxed** | Small biz, receipt hoarders | ~$18/mo | Email + physical mail-in |
| **Tailride** | Small biz | ~$15/mo | Email + OAuth + WhatsApp |
| **Veryfi** | Developers | Pay-per-doc | API-first |

### Where's the Gap?

Existing products are either:
1. **Tied to an accounting platform** (Hubdoc = Xero only, Dext pushes you toward QBO/Xero)
2. **Expensive** for someone who just wants a CSV
3. **Overcomplicated** — most freelancers don't need approval workflows, team permissions, or multi-entity support

The gap is: **a simple, cheap, standalone tool that turns invoices into a spreadsheet.** No accounting software required. No onboarding wizard with 15 steps. Forward emails, get a CSV.

---

## MVP Scope

### Build

1. **Landing page + auth** (email/password or Google sign-in)
2. **Inbound email** (Cloudflare Email Workers — free, routes to our API)
3. **Extraction worker** (Claude or Gemini, structured prompt, Zod validation)
4. **Dashboard** (processed invoices, monthly summary, search/filter)
5. **CSV export** (date range selector, one-click download)
6. **Billing** (Stripe, $10/mo + metered credits for overages)

### Don't Build (Yet)

- Accounting software integrations (Xero, QuickBooks)
- OAuth mailbox scanning
- Team/multi-user accounts
- Line-item extraction
- Mobile app
- Receipt photo capture

### Tech Stack

- Next.js (same as Open Dashboard — reuse knowledge)
- Turso or Postgres for data
- Cloudflare Email Workers for inbound email
- Claude API or Gemini for extraction
- Stripe for billing
- Vercel for hosting

---

## User Flow

```
1. User signs up
2. Gets unique forwarding address: tim-k7x@receipts.invoiceapp.com
3. Follows our guide to set up auto-forward in Gmail (2 minutes)
4. Invoices start arriving and getting processed automatically
5. User checks dashboard whenever they want
6. End of month: downloads CSV, sends to accountant
7. Done.
```

---

## Open Questions

1. **Naming**: Own brand, or under the Open Dashboard umbrella?
2. **Multi-currency**: Do we normalize to one currency or keep original? (Probably keep original + add a normalized column)
3. **Tax handling**: UK VAT, US sales tax, EU VAT with different rates — how deep do we go? (Start simple: extract whatever the invoice says, don't try to validate tax rates)
4. **Failed extractions**: What's the UX when AI can't parse an invoice? (Show the original with a "we couldn't read this" message + manual entry fallback?)
5. **Duplicate detection**: Same invoice forwarded twice? (Match on vendor + invoice number + amount + date)
6. **Data retention**: How long do we keep processed invoices? (Probably 7 years — UK/US tax retention requirements)
