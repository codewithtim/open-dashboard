# 0-$1M Challenge Public Dashboard - Detailed Implementation Plan

This document outlines the detailed plan to implement the open dashboard using Next.js (App Router), Tailwind CSS (with `shadcn/ui` aesthetic), and Notion as the datastore.

## 1. Project Setup and Architecture

We will build this using:
- **Next.js (App Router)** for building React Server Components and API Routes.
- **Tailwind CSS** for rapid and consistent styling (light/dark mode support).
- **Notion API** (`@notionhq/client`) to use Notion databases as our headless CMS/backend.
- **Vercel** for hosting the application, which natively supports Next.js routing, image optimization, and provides a daily free Cron Job for our data fetching logic.

## 2. Setting Up the Database (Notion Schema)

We will use multiple Notion Databases to keep our domain model flexible and project-specific metrics separated:

1. **Projects Database**: Tracks the top-level metadata of each project.
   - `ID` (Text) - Unique identifier (e.g., "youtube-main", "saas-app")
   - `Name` (Title)
   - `Type` (Select: "Software", "Content", "Service")
   - `Status` (Status: "Active", "Archived")

2. **Costs Database**: Tracks all expenses. Making `Project_ID` optional allows us to represent both global/shared costs (e.g. Vercel, Claude Code) and project-specific costs (e.g. Thumbnail designs, Hosting).
   - `Description` (Title)
   - `Amount` (Number)
   - `Date` (Date)
   - `Project_ID` (Text - Optional) - Links to Projects.ID if project-specific.

3. **Revenue Database**: Tracks income streams.
   - `Description` (Title)
   - `Amount` (Number)
   - `Date` (Date)
   - `Project_ID` (Text) - Links to Projects.ID

4. **Metrics Database**: Tracks project-specific KPIs. Different types of projects will have different metrics, so we log them generically.
   - `Metric Name` (Title) - e.g., "Subscribers", "Views", "MAU", "MRR"
   - `Value` (Number)
   - `Date` (Date)
   - `Project_ID` (Text) - Links to Projects.ID

### Example: Programmatic Database Migration (Schema Update)

Instead of relying solely on manual UI clicks, we can write small Node.js scripts to apply schema changes to Notion programmatically. This ensures our database changes are version-controlled alongside our code.

```typescript
// scripts/migrate.ts
import { Client } from '@notionhq/client'

// Load environment variables for the script
const notion = new Client({ auth: process.env.NOTION_TOKEN })

async function runMigration() {
  const databaseId = process.env.NOTION_PROJECTS_DB_ID!;

  console.log('Running migration: Adding "Launch Date" column to Projects...');
  
  await notion.databases.update({
    database_id: databaseId,
    properties: {
      "Launch Date": {
        date: {}
      }
    }
  });

  console.log('Migration complete!');
}

runMigration().catch(console.error);
```

### Example: Initializing Notion Client

```typescript
// src/lib/notion.ts
import { Client } from '@notionhq/client'

// Initializing a client
export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

// Helper to fetch global aggregated stats
export async function getDashboardStats() {
  const projectsDb = process.env.NOTION_PROJECTS_DB_ID!;
  const costsDb = process.env.NOTION_COSTS_DB_ID!;
  const revenueDb = process.env.NOTION_REVENUE_DB_ID!;
  
  const projects = await notion.databases.query({
    database_id: projectsDb,
    filter: { property: 'Status', status: { equals: 'Active' } }
  });

  // Calculate totals from response.results and aggregate costs/revenue
  let totalRevenue = 0;
  let totalCosts = 0;
  // ... shape the data for the frontend ...

  return { totalRevenue, totalCosts /* ... */ };
}
```

## 3. Data Automation (Cron Job API Route)

Because we don't want to manually update Notion with our YouTube views or Stripe payouts every day, we will set up an API route that **Vercel Cron** hits daily. 

Here is the exact flow:
1. **Trigger (Vercel Cron)**: Based on a schedule in `vercel.json` (e.g. at midnight), Vercel's infrastructure automatically sends a secure `GET` request to our `/api/cron` route. Vercel automatically injects an `Authorization: Bearer <CRON_SECRET>` header into this request, acting as a password so that randos on the internet can't trigger our script.
2. **Verify (Our API Route)**: Our `/api/cron` route checks the `authHeader`. If it matches our `CRON_SECRET` environment variable, we know it's a legitimate request from Vercel. 
3. **Fetch External (YouTube/Stripe)**: Now that the route is authorized, it uses specific API Keys (e.g., `YOUTUBE_API_KEY`, `STRIPE_SECRET_KEY`) to fetch the latest metrics.
4. **Update Notion**: Finally, it pushes the updated metrics into the Notion Database using the Notion Integration Token.

### Example: Next.js App Router API Route

```typescript
// src/app/api/cron/route.ts
import { NextResponse } from 'next/server';
import { notion } from '@/lib/notion';

export async function GET(request: Request) {
  // 1. Verify cron secret to ensure security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch external data (Example: Fake YouTube fetch)
    const ytSubscribers = await fetchYouTubeStats(); 

    // 3. Insert into Metrics Database
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_METRICS_DB_ID! },
      properties: {
        'Metric Name': { title: [{ text: { content: 'Subscribers' } }] },
        'Value': { number: ytSubscribers },
        'Date': { date: { start: new Date().toISOString() } },
        'Project_ID': { rich_text: [{ text: { content: 'youtube-main' } }] },
      },
    });

    return NextResponse.json({ success: true, message: 'Updated metrics successfully.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to update metrics' }, { status: 500 });
  }
}

async function fetchYouTubeStats() {
  // Logic to call YouTube Data API v3...
  return 15000;
}
```

## 4. Frontend Implementation & UI

The frontend needs to be strikingly clean, resembling a Stripe dashboard. We will leverage Tailwind to build Reusable Cards and Layouts.
We will employ **Incremental Static Regeneration (ISR)** in Next.js to ensure lightning-fast page loads without hammering the Notion API on every request.

### Example: Server Component Page (ISR Page)

```tsx
// src/app/page.tsx
import { getDashboardStats } from '@/lib/notion';
import { DashboardCard } from '@/components/dashboard-card';

// Revalidate this page every 3600 seconds (1 hour)
export const revalidate = 3600;

export default async function DashboardPage() {
  // Fetch from Notion at build/revalidation time
  const stats = await getDashboardStats();

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header section */}
        <header className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              0 to $1M Challenge
            </h1>
            <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
              A transparent, open dashboard tracking my progress.
            </p>
          </div>
          {/* Theme Toggle Component Placeholder */}
          <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        </header>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard 
            title="Total Revenue" 
            value={`$${stats.totalRevenue.toLocaleString()}`} 
            trend="+12%" 
          />
          <DashboardCard 
            title="Total Costs" 
            value={`$${stats.totalCosts.toLocaleString()}`} 
            trend="-5%" 
          />
          <DashboardCard 
            title="Net Profit" 
            value={`$${(stats.totalRevenue - stats.totalCosts).toLocaleString()}`} 
            trend="+18%" 
            featured
          />
        </section>

      </div>
    </main>
  );
}
```

### Example: Reusable UI Component (Tailwind)

```tsx
// src/components/dashboard-card.tsx
import clsx from 'clsx';

interface DashboardCardProps {
  title: string;
  value: string;
  trend?: string;
  featured?: boolean;
}

export function DashboardCard({ title, value, trend, featured }: DashboardCardProps) {
  return (
    <div 
      className={clsx(
        "p-6 rounded-2xl border transition-all duration-200 ease-in-out",
        featured 
          ? "bg-neutral-900 border-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:border-neutral-200 shadow-lg" 
          : "bg-white border-neutral-200 text-neutral-900 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-50 shadow-sm hover:shadow-md"
      )}
    >
      <h3 className={clsx(
        "text-sm font-medium mb-2",
        featured ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-500 dark:text-neutral-400"
      )}>
        {title}
      </h3>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
```

## 5. Implementation Roadmap (TDD Approach)

**CRITICAL REQUIREMENT:** All features MUST be implemented using Test-Driven Development (TDD) following the Red-Green-Refactor pattern.
1. **Red**: Write a failing test for the desired behavior.
2. **Green**: Write the minimum code required to make the test pass.
3. **Refactor**: Clean up the code while ensuring tests remain green.

### Phase 1: Database & Core Set Up
- [x] **Notion Workspace Setup**
  - [x] Create an Internal Integration in the Notion Developer Portal
  - [x] Store `NOTION_TOKEN` securely
  - [x] Create an empty parent page in Notion and share it with the Integration
- [x] **Programmatic Schema Initialization**
  - [x] Write `scripts/init-db.ts` to programmatically create the 4 databases within the parent page:
    - [x] `Projects` Database (ID, Name, Type, Status)
    - [x] `Costs` Database (Description, Amount, Date, Optional: Project_ID)
    - [x] `Revenue` Database (Description, Amount, Date, Project_ID)
    - [x] `Metrics` Database (Metric Name, Value, Date, Project_ID)
  - [x] Review execution logs and store the 4 returned database IDs as environment variables
- [x] **Migration Infrastructure**
  - [x] Set up `npm run migrate` script in `package.json` to execute `.ts` scripts securely for future schema updates

### Phase 2: Next.js Boilerplate, Config, & Test Setup
- [x] Initialize Next.js app (`npx create-next-app@latest`) with Tailwind and App Router
- [x] Install App Dependencies (`@notionhq/client`, `clsx`, `tailwind-merge`, `next-themes`, `lucide-react`)
- [x] **Test Setup**
  - [x] Install Test Dependencies (e.g. `vitest` or `jest`, `@testing-library/react`, `@testing-library/jest-dom`)
  - [x] Configure Test Runner (`vitest.config.ts` or `jest.config.js`)
  - [x] Setup global test setup file (e.g., `setupTests.ts`)
- [x] Setup Light/Dark Mode (`next-themes` ThemeProvider)
- [x] Add base typography and colors to `tailwind.config.ts` to emulate Stripe's clean aesthetic
- [x] Configure `globals.css`
- [x] Create `.env.local` for local development

### Phase 3: Data Fetching Layer (Notion SDK) - strictly TDD
- [x] Initialize global Notion Client (`src/lib/notion.ts`)
- [x] **`getProjects()` helper:**
  - [x] *Test:* Write failing test verifying it queries the active projects and maps the response correctly (mocking Notion client).
  - [x] *Implement:* Write `getProjects()` to pass the test.
- [x] **`getAggregatedDashboardStats()` helper:**
  - [x] *Test:* Write failing test ensuring it calculates total revenue, total costs, and net profit correctly based on mocked arrays.
  - [x] *Implement:* Write `getAggregatedDashboardStats()` to pass the test.
- [x] **`getProjectDetails(projectId)` helper:**
  - [x] *Test:* Write failing test for fetching specific metadata, filtering/summing costs/revenue, and fetching latest metrics.
  - [x] *Implement:* Write `getProjectDetails()` to pass the test.

### Phase 4: Frontend UI (Components & Pages) - strictly TDD
- [x] **`DashboardCard` component**
  - [x] *Test:* Write failing rendering tests for title, value, trend, and featured variant.
  - [x] *Implement:* Build `DashboardCard` to pass the tests.
- [x] **Global `Header` component**
  - [x] *Test:* Write tests verifying logo presence, breadcrumbs functionality, and theme toggle interaction.
  - [x] *Implement:* Build `Header` to pass the tests.
- [x] **Home Page (`/`)**
  - [x] *Test:* Write integration tests mocking the data layer to ensure stats grid and project list render correctly.
  - [x] *Implement:* Build Home Page to pass tests.
- [x] **Project Detail Page (`/projects/[id]`)**
  - [x] *Test:* Write integration tests mocking specific project data, ensuring charts/grids render.
  - [x] *Implement:* Build Project Detail Page to pass tests.
- [x] Test layout responsiveness (Mobile/Tablet/Desktop)

### Phase 5: Automation (Vercel Cron) - strictly TDD
- [x] **Cron API Route (`src/app/api/cron/route.ts`)**
  - [x] *Test:* Write test asserting 401 Unauthorized when `CRON_SECRET` is missing/invalid.
  - [x] *Test:* Write test asserting success and correct mock insertions to Notion when valid payload is received.
  - [x] *Implement:* Write API route logic to pass all auth and DB manipulation tests.
- [x] Configure `vercel.json` to schedule the cron job (e.g. `0 0 * * *` for daily at midnight)

### Phase 6: Deployment & Launch
- [x] Push repository to GitHub
- [x] Deploy to Vercel
- [x] Add all Notion, Stripe, and YouTube secrets to Vercel Environment Variables
- [x] Validate Vercel Cron is running successfully
- [x] Perform manual testing of public routing and ISR loading states
