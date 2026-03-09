# Expense & Cost Tracking — Plan

## Goal

Automatically track all project expenses from two sources:
1. **Email-forwarded invoices** — parsed by an LLM to extract structured data
2. **API integrations** — pull usage/billing data directly from services (OpenRouter, Vercel, etc.)

---

## Current State

The `costs` table already exists but is minimal:
```sql
costs (id, project_id, amount, note)
```
No dates, no categories, no vendor info, no way to ingest data automatically.

---

## Approach Options for Email Ingestion

### Email Receiving

Since creating a new Gmail account isn't an option, here are the alternatives:

#### Option A: Cloudflare Email Workers (Recommended) ⭐

If you have a domain on Cloudflare, you can create an email address like `expenses@yourdomain.com` for free — no email account needed at all. Cloudflare receives the email and runs a Worker that POSTs the content to your app's API route.

**How it works:**
1. Add an MX record in Cloudflare DNS (automatic when you enable Email Routing)
2. Create a route: `expenses@yourdomain.com` → Email Worker
3. The Worker extracts the email body + attachments and POSTs to your `/api/webhooks/invoice` endpoint

**Pros:** Completely free, no email account to manage, event-driven (no polling), attachments included.
**Cons:** Need a domain on Cloudflare. The Worker is a small piece of Cloudflare-hosted code (~20 lines).

#### Option B: Outlook.com / Other Free Email + IMAP Polling

Create a free Outlook.com (Hotmail) account and poll via IMAP on a cron schedule. Outlook still allows free account creation and has IMAP access.

**Pros:** Free, standard IMAP, no vendor lock-in.
**Cons:** Need to create/manage another account, polling delay, IMAP library dependency.

#### Option C: Use Your Existing Email + Filter

No new account at all. Forward invoices to your existing email with a subject tag like `[expense]`. Cron job polls for emails matching that tag/label.

**Pros:** Zero setup. **Cons:** Mixes personal/business email, needs OAuth for your personal account.

#### Option D: Manual Upload

File upload form in the dashboard. Upload a PDF/screenshot.

**Pros:** Simplest, no infrastructure. **Cons:** Not automated.

#### Recommendation

**Option A (Cloudflare Email Workers)** if you have a domain on Cloudflare — it's free, needs no email account, and is event-driven rather than polling. If not on Cloudflare, **Option B (Outlook.com)** is the easiest free alternative. **Option D (manual upload)** as a universal fallback regardless.

---

### Invoice Parsing — Cost-Conscious Options

The concern with LLM-based parsing is the per-invoice cost, especially with vision models on PDFs/images. Here are the options from cheapest to most capable:

#### Option 1: Vendor-Specific Text Parsers (Zero LLM cost) ⭐

Most SaaS invoices arrive as **HTML emails**, not PDFs. The email body itself contains the amount, date, and vendor in predictable HTML structures. Build simple regex/template parsers for your known vendors.

```
Incoming email → Match sender (from: billing@vercel.com)
  → Run vercel parser → Extract amount, date, description
  → Write to DB
```

**Reality check:** You probably only have 5–10 vendors. A parser per vendor covers 80%+ of invoices with zero API cost. Only need LLM as fallback for unknown formats.

**Pros:** Free, fast, deterministic, no API dependency.
**Cons:** Brittle if vendor changes email format (but easy to fix). Doesn't handle PDFs.

#### Option 2: Haiku for Text Extraction (Very cheap)

Use Claude Haiku (`claude-haiku-4-5`) for parsing email text. Haiku is ~$0.001 per invoice — essentially free even at volume.

```
Incoming email → Strip HTML to text → Send to Haiku with structured prompt
  → Extract vendor, amount, date, line items → Write to DB
```

**Pros:** Handles any vendor format without custom parsers, extremely cheap.
**Cons:** Still an API call per invoice. Doesn't handle PDF/image attachments.

#### Option 3: Hybrid Approach (Recommended) ⭐

Combine vendor parsers with Haiku as fallback:

```
Incoming email
  → Known vendor? → Use regex parser (free)
  → Unknown vendor, text body? → Use Haiku ($0.001)
  → PDF/image attachment only? → Use Sonnet vision ($0.01–0.05) OR queue for manual review
```

**Cost estimate:** If you process ~50 invoices/month, maybe 5 hit the LLM, 1–2 need vision. Total LLM cost: ~$0.10/month.

#### Option 4: Local OCR + Pattern Matching (Free but more work)

For PDF attachments specifically: use Tesseract (open-source OCR) to extract text, then regex/Haiku on the text output. Avoids vision API entirely.

**Pros:** Completely free. **Cons:** More setup, OCR quality varies.

#### Option 5: Full LLM Vision (Most capable, most expensive)

Send everything to Claude Sonnet/Opus vision. Best extraction quality but ~$0.03–0.10 per invoice with images.

**Only justified** for complex multi-page invoices or when accuracy is critical.

#### Recommendation

**Option 3 (Hybrid)** — vendor parsers for known senders, Haiku for unknown text, and either queue PDFs for manual review or use Sonnet vision only when needed. Keeps costs to pennies per month.

---

## Approach for API Integrations

Pull billing data directly from service APIs on a cron schedule (extend the existing `/api/cron` route).

### Priority APIs

| Service | API Available? | Notes |
|---------|---------------|-------|
| **OpenRouter** | Yes — `/api/v1/auth/key` returns usage/credits | Simple API key auth |
| **Vercel** | Yes — Usage API | Already deploying here |
| **Turso** | Yes — Platform API | Already using for DB |
| **GitHub** | Yes — Billing API | Actions minutes, etc. |
| **Anthropic** | Yes — Usage API | If using Claude directly |

Each integration becomes a small provider module that returns `{ vendor, amount, period, breakdown[] }`.

---

## Schema Changes

Evolve the existing `costs` table and add a many-to-many relationship with projects to handle both shared and project-specific expenses.

### The Problem

Some expenses are **project-specific** (e.g., Vercel hosting for one app), others are **shared** (e.g., a Claude Code subscription used across all projects). A single `project_id` FK can't represent this.

### Solution: Join Table with Allocation + Auto-Linking via Project Services

```sql
-- Richer costs table (no direct project FK)
costs (
  id            TEXT PRIMARY KEY,
  amount        REAL NOT NULL,                 -- total amount in base currency
  currency      TEXT DEFAULT 'USD',
  vendor        TEXT,                          -- 'openrouter', 'vercel', 'anthropic', etc.
  category      TEXT,                          -- 'compute', 'api', 'hosting', 'tools', 'domain', 'other'
  description   TEXT,                          -- human-readable note
  date          TEXT NOT NULL,                 -- ISO date of the charge
  period_start  TEXT,                          -- billing period start (for subscriptions)
  period_end    TEXT,                          -- billing period end
  source        TEXT DEFAULT 'manual',         -- 'email', 'api', 'manual'
  source_ref    TEXT,                          -- email message ID, API response ID, etc.
  recurring     INTEGER DEFAULT 0,            -- 1 = recurring, 0 = one-time
  shared        INTEGER DEFAULT 0,            -- 1 = shared across projects, 0 = specific
  created_at    TEXT DEFAULT (datetime('now'))
)

-- Many-to-many: which projects does this cost apply to?
cost_projects (
  id            TEXT PRIMARY KEY,
  cost_id       TEXT REFERENCES costs(id) NOT NULL,
  project_id    TEXT REFERENCES projects(id) NOT NULL,
  allocation    REAL DEFAULT 1.0,             -- proportion of cost allocated (0.0–1.0)
  UNIQUE(cost_id, project_id)
)

-- Which services/vendors does each project use? (for auto-linking)
project_services (
  id            TEXT PRIMARY KEY,
  project_id    TEXT REFERENCES projects(id) NOT NULL,
  vendor        TEXT NOT NULL,                 -- must match costs.vendor values
  exclusive     INTEGER DEFAULT 0,            -- 1 = this project is the ONLY user of this vendor
  UNIQUE(project_id, vendor)
)
```

### Auto-Linking: How It Works

When a new cost is created (from API sync, email, or manual entry), the system auto-assigns projects:

```
New cost arrives with vendor='vercel'
  → Query project_services WHERE vendor='vercel'
  → Found 1 project with exclusive=1?
      → Assign 100% to that project, shared=0
  → Found 3 projects with exclusive=0?
      → Assign equally (0.33 each), shared=1
  → Found 0 projects?
      → Leave unallocated, flag for manual review
```

**Examples:**

| `project_services` rows | Incoming cost | Result |
|------------------------|---------------|--------|
| Project X → vercel (exclusive=1) | Vercel invoice | 100% to Project X |
| Project A → openrouter, Project B → openrouter | OpenRouter bill | Split 50/50, shared |
| Project A → claude-code, Project B → claude-code, Project C → claude-code | Claude Code sub | Split 33/33/33, shared |
| (none for 'namecheap') | Namecheap domain | Unallocated, flagged |

Auto-linking is a **suggestion** — the user can always override allocations manually. The `/expenses` page would show "auto-assigned" costs with a one-click confirm or edit option.

**Populating `project_services`:** Part of Phase 1. Add a "Services" section to each project's detail page where you declare which vendors/tools that project uses. Could also seed this from existing data (e.g., projects deployed on Vercel are already known).

### Manual Allocation

| Scenario | `shared` | `cost_projects` rows |
|----------|----------|---------------------|
| Vercel hosting for App X | 0 | 1 row: App X, allocation=1.0 |
| Claude Code sub (3 projects) | 1 | 3 rows: each project, allocation=0.33 |
| Claude Code sub (split unevenly) | 1 | 2 rows: Project A=0.7, Project B=0.3 |
| General business expense (no project) | 1 | 0 rows (unallocated) |

**Querying a project's costs:**
```sql
SELECT c.*, cp.allocation, (c.amount * cp.allocation) as allocated_amount
FROM costs c
JOIN cost_projects cp ON cp.cost_id = c.id
WHERE cp.project_id = ?
```

**Querying unallocated costs:**
```sql
SELECT c.* FROM costs c
LEFT JOIN cost_projects cp ON cp.cost_id = c.id
WHERE cp.id IS NULL
```

### Invoices Table (for Phase 3)

Raw email/attachment storage:

```sql
invoices (
  id            TEXT PRIMARY KEY,
  email_from    TEXT,
  email_subject TEXT,
  received_at   TEXT NOT NULL,
  raw_body      TEXT,                          -- email body text
  attachment_url TEXT,                         -- link to stored PDF/image (e.g. in R2/S3)
  status        TEXT DEFAULT 'pending',        -- 'pending', 'processed', 'failed', 'ignored'
  extracted_data TEXT,                         -- JSON blob of what was extracted
  cost_id       TEXT REFERENCES costs(id),     -- linked cost record once processed
  created_at    TEXT DEFAULT (datetime('now'))
)
```

---

## Architecture

### New Files

```
src/lib/db/schema.ts                          -- Update costs, add cost_projects, project_services, invoices
src/app/api/expenses/route.ts                  -- Manual expense CRUD
src/app/api/webhooks/invoice/route.ts          -- Webhook for Cloudflare Email Worker (Phase 3)
src/lib/providers/openrouter-provider.ts       -- OpenRouter billing API
src/lib/providers/vercel-provider.ts           -- Vercel billing API
src/lib/invoice-parser.ts                      -- Vendor-specific parsers + LLM fallback (Phase 3)
src/lib/cost-linker.ts                         -- Auto-link costs to projects via project_services
src/app/expenses/page.tsx                      -- Expense listing/dashboard page
cf-email-worker/                               -- Cloudflare Email Worker (separate deploy, Phase 3)
```

### Auto-Linking Flow (Phase 1)

When any cost is created (manual, API, or email):

```
New cost with vendor='vercel'
  → cost-linker.ts: query project_services WHERE vendor='vercel'
  → 1 exclusive project? → assign 100%, shared=0
  → N non-exclusive projects? → split equally, shared=1
  → 0 matches? → leave unallocated
  → Insert cost + cost_projects rows
```

### Invoice Processing Pipeline (Phase 3)

Email arrives → Cloudflare Worker POSTs to `/api/webhooks/invoice`:

1. **Receive email** — webhook gets sender, subject, body, attachments
2. **Store raw data** in `invoices` table with status `pending`
3. **Parse** using the hybrid approach:
   - Known vendor (matched by sender)? → Use vendor-specific regex parser (free)
   - Unknown vendor, text body? → Use Haiku ($0.001)
   - PDF/image only? → Queue for manual review (or Sonnet vision if enabled)
4. **Validate & write** extracted data to `costs` table
5. **Auto-link** to projects via `cost-linker.ts`
6. **Update invoice** status to `processed` and link to cost record

### API Cost Sync (Cron)

Extend the existing cron job:

```
/api/cron → existing sync tasks
         → NEW: pull billing from OpenRouter, Vercel, etc.
         → Upsert costs with source='api' and dedup by source_ref
```

Each provider implements a simple interface:
```typescript
interface BillingProvider {
  name: string;
  fetchCosts(since: Date): Promise<{ amount: number; date: string; description: string; }[]>;
}
```

---

## Dashboard UI

### New `/expenses` Page

- **Summary cards**: Total spend (month), Total spend (all-time), By category breakdown
- **Expense table**: Date, Vendor, Amount, Category, Project, Source (email/api/manual)
- **Filters**: By date range, vendor, category, project
- **Monthly trend chart** (optional, later)

### Updates to Existing Pages

- Project detail pages already show costs — they'll automatically pick up richer data
- Home dashboard already shows totalCosts/netProfit — no changes needed

---

## Implementation Phases

### Phase 1: Schema, Project Services & Manual Entry
- Migrate `costs` table to richer schema (drop old `project_id` FK)
- Add `cost_projects` join table for many-to-many project linking
- Add `project_services` table for declaring which vendors each project uses
- Add `invoices` table (empty for now, ready for Phase 3)
- Update `data-client.ts` and `turso-client.ts` — project cost queries now go through join table
- Add "Services" section to project detail pages (declare vendors: vercel, openrouter, etc.)
- Update project detail pages to show allocated costs (shared vs specific breakdown)
- Build `/expenses` page:
  - Expense listing with project tags
  - "Add Expense" form with auto-linking (based on vendor → project_services lookup)
  - Manual override for allocation (single project, multi-project split, or unallocated)
- Update home dashboard to show unallocated costs separately

### Phase 2: API Integrations
- Build OpenRouter billing provider
- Wire into cron job
- Add more providers incrementally (Vercel, Turso, etc.)

### Phase 3: Email Ingestion
- Set up email receiving (Cloudflare Email Workers preferred, or Outlook.com IMAP polling)
- If Cloudflare: deploy Email Worker + webhook endpoint in the app
- If IMAP: build polling client, wire into cron job
- Build vendor-specific parsers for top vendors (Vercel, OpenRouter, etc.)
- Build Haiku fallback parser for unknown vendors
- Store raw invoices, process and link to costs
- Auto-assign projects using `project_services` vendor mapping

### Phase 4: Polish
- Expense categorization refinement
- Duplicate detection
- Monthly reports/summaries
- Notification when unusual charges detected

---

## Open Questions

1. **Shared cost default allocation**: When a shared expense is added, should it default to equal split across all active projects, or require manual allocation each time?
2. **Attachment storage**: For Phase 3 — store invoice PDFs in Cloudflare R2, Vercel Blob, or just keep text content in the DB (skip storing actual PDF files)?
3. **Currency**: Are all expenses in USD, or do we need multi-currency support?
4. **Budget/alerts**: Want budget thresholds per project or category that trigger alerts?
5. **Historical data**: Do you want to backfill existing costs from invoices you already have, or start fresh from a certain date?

---

## Alternatives Considered

### Spreadsheet Sync (Google Sheets)
Could use Google Sheets as an intermediate — forward invoices, manually log in sheets, sync via API. **Rejected:** Adds a manual step and another dependency without clear benefit.

### Dedicated Expense Service (e.g., Plaid, Ramp API)
If you have a business card, could pull transactions directly. **Worth considering later** if the business scales, but overkill for now.

### Receipt Scanning App (Dext, Expensify)
These apps do the OCR/extraction well but are designed for accounting workflows, not developer dashboards. **Could complement** this system but don't replace the API integration piece.
