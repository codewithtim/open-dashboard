# Open Dashboard

A public-facing web dashboard tracking a transparent "0 to $1M Challenge." Built with Next.js, it visualizes revenue, costs, and net profit across multiple projects with a live progress bar toward the $1,000,000 goal.

## Tech Stack

- **Next.js 16** (App Router) with React 19
- **Tailwind CSS v4** for styling
- **Notion** as a headless CMS/database
- **Vercel** for hosting with daily cron jobs
- **GitHub Actions** for CI/CD (tests gate deploys)
- **Jest** + **React Testing Library** for TDD

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

Copy `.env.local.example` or create `.env.local` with:

```
NOTION_TOKEN=
NOTION_PARENT_PAGE_ID=
NOTION_PROJECTS_DB_ID=
NOTION_COSTS_DB_ID=
NOTION_REVENUE_DB_ID=
NOTION_METRICS_DB_ID=
CRON_SECRET=
USE_LOCAL_DATA=false
```

Set `USE_LOCAL_DATA=true` to run with mock data (no Notion setup required).

## Testing

```bash
pnpm test
```

27 tests across 9 suites covering components, data clients, API routes, and page integration.

## Project Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    api/cron/             # Daily metrics ingestion endpoint
    projects/[id]/        # Dynamic project detail pages
  components/             # Reusable UI components (ProgressBar, DashboardCard, etc.)
  lib/                    # Data abstraction layer
    data-client.ts        # DataClient interface
    client-factory.ts     # Factory pattern (Notion vs local mock)
    notion-client.ts      # Notion API integration
    local-mock-client.ts  # Static mock data for development
```

## Deployment

Deploys to Vercel via GitHub Actions. Pushes to `main` trigger the CI pipeline: tests run first, and production deploy only proceeds on green.
