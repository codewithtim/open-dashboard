# Open Dashboard: Deep Project Research & Anatomy

This document provides a comprehensive report on the architecture, technical decisions, and current state of the "Open Dashboard" project. It is intended to serve as a deep-dive reference for understanding how the application functions under the hood.

## 1. Project Overview & Objective
The Open Dashboard is a public-facing web application built to track a transparent "0 to $1M Challenge." It visualizes top-level financial metrics (Total Revenue, Total Costs, Net Profit) alongside deep-dive statistics for individual projects (e.g., YouTube Channels, SaaS Boilerplates, Consulting). A prominent revenue progress bar tracks cumulative progress toward the $1,000,000 goal.

## 2. Core Technology Stack
- **Framework**: Built on **Next.js 16.1.6 (App Router)** leveraging React 19.
- **Styling**: **Tailwind CSS v4** combined with `clsx` and `tailwind-merge` for utility-class management, achieving a clean, Stripe-like aesthetic.
- **Theming**: Implements light and dark mode toggling using `next-themes`.
- **Icons**: Uses `lucide-react` for lightweight SVG iconography.
- **Testing**: Follows strict **Test-Driven Development (TDD)** using **Jest** and **React Testing Library**.
- **CI/CD**: **GitHub Actions** runs tests on every push and PR to `main`. Production deploys to **Vercel** are gated on all tests passing.

## 3. Architectural Design

### 3.1 Data Abstraction Layer (The Factory Pattern)
The application avoids tightly coupling the React components to any specific database. Instead, it relies on a robust abstraction layer:
- **`DataClient` Interface (`src/lib/data-client.ts`)**: Defines the strict contract (`getProjects`, `getAggregatedDashboardStats`, `getProjectDetails`, `getMultipleProjectDetails`) that any data provider must fulfill.
- **Client Factory (`src/lib/client-factory.ts`)**: A singleton factory that checks the `USE_LOCAL_DATA` environment variable.
  - If `true`, it provisions the `LocalMockClient`.
  - If `false` or undefined, it provisions the `NotionClient`.
- **`LocalMockClient`**: Returns instant, static dummy data (YouTube channel, SaaS, consulting) designed for layout development and offline resilience.

### 3.2 Notion Backend Integration
When deployed or running in production mode, the application uses **Notion** as a headless CMS and database:
- **SDK**: `@notionhq/client` v2.2.15. The `databases.query()` method is used for all database reads.
- **Schema**: Data is distributed across four relational Notion databases: `Projects`, `Costs`, `Revenue`, and `Metrics`. Property names are lowercase (e.g., `name`, `status`, `amount`, `projects`, `value`).
- **Initialization**: A programmatic lifecycle script (`scripts/init-db.ts`) handles the initial creation of these databases via the Notion SDK.
- **The `NotionClient` (`src/lib/notion-client.ts`)**: Implements the `DataClient` interface by orchestrating complex `Promise.all` queries to the Notion databases, aggregating properties explicitly to avoid TypeScript `any` types.
- **Filter Types**: The `status` property on the Projects DB is a `select` type (filter with `select: { equals: ... }`, not `status`). Relation properties are named `projects` (plural).

### 3.3 Application Routing (App Router)
- **Home Page (`src/app/page.tsx`)**: Renders the revenue progress bar above aggregated global stats. To optimize load times when rendering detailed project cards, it utilizes a bulk `getMultipleProjectDetails(ids)` API rather than iterating standalone requests.
- **Project Detail Page (`src/app/projects/[id]/page.tsx`)**: Utilizes dynamic routing to display specific metrics and calculations for a targeted project via `client.getProjectDetails(id)`. Handles 404s gracefully via `notFound()`.

### 3.4 Revenue Progress Bar
- **Component (`src/components/progress-bar.tsx`)**: Standalone, reusable component accepting `currentValue` and `targetValue` (default: 1,000,000) props. Calculates percentage dynamically, caps visual width at 100%, and displays formatted dollar amounts with a completion percentage.
- **Integration**: Mounted at the top of the home page, fed by `stats.totalRevenue` from the data client.

### 3.5 Data Automation (Vercel Cron)
To keep metrics (like YouTube subscribers) up to date without manual data entry, the application features an automated ingestion pipeline:
- **Cron Definition (`vercel.json`)**: Configured to ping the application daily at midnight (`0 0 * * *`).
- **Secure API Route (`src/app/api/cron/route.ts`)**: Protected by a `CRON_SECRET` Bearer token. Upon authorization, it programmatically inserts new rows into the Notion `Metrics` database.

### 3.6 CI/CD Pipeline
- **GitHub Actions (`.github/workflows/ci.yml`)**: Runs on pushes to `main` and pull requests. The `test` job installs dependencies via pnpm and runs the full Jest suite. The `deploy` job depends on `test` passing and only runs on `main` pushes — it uses the Vercel CLI to pull environment config, build, and deploy to production.
- **Vercel Hosting**: Auto-detection of Next.js with pnpm. Environment variables are configured in the Vercel dashboard (not committed to the repo). Automatic GitHub deploys are disabled in favor of the CI-gated workflow.

## 4. Test-Driven Development (TDD) Implementations
The repository maintains 27 passing tests across 9 suites, constructed prior to implementation:
- **Mock Interfaces**: Frontend components are tested by mocking `@/lib/client-factory` returns, ensuring rendering logic is validated independent of Notion's upstream latency.
- **Data Client Tests**: The `NotionClient` and `LocalMockClient` have their own independent suites guaranteeing the aggregation math (e.g., `Net Profit = Total Revenue - Total Costs`) operates flawlessly.
- **Progress Bar Tests**: Validate percentage calculation, 100% cap on overflow, default target value, and correct dollar formatting.
- **Page Integration Tests**: Assert that the home page renders the progress bar, dashboard cards, and project details together.
- **Cron Tests**: API Routes simulate incoming global `Request` arrays to validate the `401 Unauthorized` block out mechanics securely.

## 5. Current State

### 5.1 Project Status
The foundational architecture is complete. The UI renders successfully with a revenue progress bar, dashboard stat cards, and project detail views. The data abstraction layer is fully operational via both Local Mode and the live Notion API. Test coverage is extensive (27 tests, 9 suites). CI/CD is configured via GitHub Actions with deploys to Vercel gated on passing tests.

### 5.2 Resolved: Notion SDK Bug
The previous runtime error (`TypeError: notion.databases.query is not a function`) was caused by an incorrect SDK version reference (`^5.9.0` in package.json, which does not exist). This was resolved by:
1. Pinning `@notionhq/client` to `^2.2.15` (the correct published version).
2. Fixing the `getProjects` filter to use `select` instead of `status` (matching the Notion DB property type).
3. Fixing relation filters to use `projects` (plural) instead of `project`.
4. Fixing metric name access to use the `name` title property instead of `metric name`.
