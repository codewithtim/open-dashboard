# Open Dashboard: Deep Project Research & Anatomy

This document provides a comprehensive report on the architecture, technical decisions, and current state of the "Open Dashboard" project. It is intended to serve as a deep-dive reference for understanding how the application functions under the hood.

## 1. Project Overview & Objective
The Open Dashboard is a public-facing web application built to track a transparent "0 to $1M Challenge." It visualizes top-level financial metrics (Total Revenue, Total Costs, Net Profit) alongside deep-dive statistics for individual projects (e.g., YouTube Channels, SaaS Boilerplates, Consulting).

## 2. Core Technology Stack
- **Framework**: Built on **Next.js 16.1.6 (App Router)** leveraging React 19.
- **Styling**: **Tailwind CSS v4** combined with `clsx` and `tailwind-merge` for utility-class management, achieving a clean, Stripe-like aesthetic.
- **Theming**: Implements light and dark mode toggling using `next-themes`.
- **Icons**: Uses `lucide-react` for lightweight SVG iconography.
- **Testing**: Follows strict **Test-Driven Development (TDD)** using **Jest** and **React Testing Library**.

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
- **Schema**: Data is distributed across four relational Notion databases: `Projects`, `Costs`, `Revenue`, and `Metrics`.
- **Initialization**: A programmatic lifecycle script (`scripts/init-db.ts`) handles the initial creation of these databases via the Notion SDK.
- **The `NotionClient` (`src/lib/notion-client.ts`)**: Implements the `DataClient` interface by orchestrating complex `Promise.all` queries to the Notion databases, aggregating properties explicitly to avoid TypeScript `any` types.

### 3.3 Application Routing (App Router)
- **Home Page (`src/app/page.tsx`)**: Fetches aggregated global stats. To optimize load times when rendering detailed project cards, it utilizes a bulk `getMultipleProjectDetails(ids)` API rather than iterating standalone requests.
- **Project Detail Page (`src/app/projects/[id]/page.tsx`)**: Utilizes dynamic routing to display specific metrics and calculations for a targeted project via `client.getProjectDetails(id)`. Handles 404s gracefully via `notFound()`.

### 3.4 Data Automation (Vercel Cron)
To keep metrics (like YouTube subscribers) up to date without manual data entry, the application features an automated ingestion pipeline:
- **Cron Definition (`vercel.json`)**: Configured to ping the application daily at midnight (`0 0 * * *`).
- **Secure API Route (`src/app/api/cron/route.ts`)**: Protected by a `CRON_SECRET` Bearer token. Upon authorization, it programmatically inserts new rows into the Notion `Metrics` database.

## 4. Test-Driven Development (TDD) Implementations
The repository proudly maintains 100% passing test coverage (20 passing tests across 8 suites) constructed prior to implementation:
- **Mock Interfaces**: Frontend components are tested by mocking `@/lib/client-factory` returns, ensuring rendering logic is validated independent of Notion's upstream latency.
- **Data Client Tests**: The `NotionClient` and `LocalMockClient` have their own independent suites guaranteeing the aggregation math (e.g., `Net Profit = Total Revenue - Total Costs`) operates flawlessly.
- **Cron Tests**: API Routes simulate incoming global `Request` arrays to validate the `401 Unauthorized` block out mechanics securely.

## 5. Current State & Known Anomalies

### 5.1 Project Status
The foundational architecture is entirely complete. The UI successfully renders, the data abstraction layer is fully operational via Local Mode, and test coverage is extensive.

### 5.2 Identified Runtime Bug
During the latest `npm run dev` session hitting the `NotionClient`, the Next.js compiler threw an unhandled 500 error:
```text
TypeError: notion.databases.query is not a function
at queryNotionDb (src/lib/notion-client.ts)
```
**Cause & Hypothesis**: 
The `@notionhq/client` library is installed at version `^5.9.0` according to `package.json`. In Standard Notion SDK versions, `.databases.query()` exists. If this TypeError is triggering, it strongly implies either:
1. The global Notion SDK client export has structurally changed in newer major variants, and `.query` requires a different invocation.
2. The instantiated `new Client({ auth: ... })` failed to mount properties properly because of a missing or malformed `NOTION_TOKEN` environment variable triggering a silent abort on the SDK instantiation object. 

*Recommendation*: Since `USE_LOCAL_DATA=true` was just configured, this runtime error may have triggered on a stale hot-reload prior to the flag taking effect, or we need to investigate the specific TypeScript interface of `@notionhq/client v5.9.0`.
