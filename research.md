# Open Dashboard: Deep Project Research & Anatomy

This document provides a comprehensive report on the architecture, technical decisions, and current state of the "Open Dashboard" project. It is intended to serve as a deep-dive reference for understanding how the application functions under the hood.

## 1. Project Overview & Objective
The Open Dashboard is a public-facing web application built to track a transparent "Building In Public" journey. It visualizes top-level financial and audience metrics (Total Revenue, Subscribers, Views) alongside deep-dive statistics for individual projects across software products (SaaS, npm packages) and social platforms (YouTube, Twitter/X, TikTok, Twitch, Instagram, GitHub). A central network visualizer connects all projects to an aggregated stats hub.

## 2. Core Technology Stack
- **Framework**: Built on **Next.js 16.1.6 (App Router)** leveraging React 19.
- **Styling**: **Tailwind CSS v4** combined with `clsx` and `tailwind-merge` for utility-class management.
- **Theming**: Implements light and dark mode toggling using `next-themes`.
- **Animation**: Uses `framer-motion` for animated counters and transitions.
- **Icons**: Uses `lucide-react` for UI iconography and `react-icons` for platform-specific brand icons (Simple Icons, Feather Icons, Bootstrap Icons).
- **Testing**: Follows strict **Test-Driven Development (TDD)** using **Jest 30** and **React Testing Library**.
- **CI/CD**: **GitHub Actions** runs tests on every push and PR to `main`. Production deploys to **Vercel** are gated on all tests passing.

## 3. Architectural Design

### 3.1 Data Abstraction Layer (The Factory Pattern)
The application avoids tightly coupling the React components to any specific database. Instead, it relies on a robust abstraction layer:
- **`DataClient` Interface (`src/lib/data-client.ts`)**: Defines the strict contract (`getProjects`, `getAggregatedDashboardStats`, `getProjectDetails`, `getMultipleProjectDetails`) that any data provider must fulfill.
- **Client Factory (`src/lib/client-factory.ts`)**: A singleton factory that checks the `USE_LOCAL_DATA` environment variable.
  - If `true`, it provisions the `LocalMockClient`.
  - If `false` or undefined, it provisions the `NotionClient`.
- **`LocalMockClient`**: Returns instant, static dummy data (YouTube channel, SaaS Boilerplate, open-utils npm package, Dev Consulting) designed for layout development and offline resilience.

### 3.2 Notion Backend Integration
When deployed or running in production mode, the application uses **Notion** as a headless CMS and database:
- **SDK**: `@notionhq/client` v2.2.15. The `databases.query()` method is used for all database reads.
- **Schema**: Data is distributed across four relational Notion databases: `Projects`, `Costs`, `Revenue`, and `Metrics`. Property names are lowercase (e.g., `name`, `status`, `amount`, `projects`, `value`).
- **Initialization**: A programmatic lifecycle script (`scripts/init-db.ts`) handles the initial creation of these databases via the Notion SDK.
- **The `NotionClient` (`src/lib/notion-client.ts`)**: Implements the `DataClient` interface by orchestrating complex `Promise.all` queries to the Notion databases, aggregating properties explicitly to avoid TypeScript `any` types.
- **Data Normalization**: The NotionClient normalizes data at the boundary — `type`, `platform`, and `status` are lowercased, and the `package` type is converted to `software`.
- **Link Generation**: Platform URLs are auto-constructed from `platformAccountId` for YouTube, Twitter/X, TikTok, Twitch, Instagram, GitHub, and npm.
- **Filter Types**: The `status` property on the Projects DB is a `select` type (filter with `select: { equals: ... }`, not `status`). Relation properties are named `projects` (plural).

### 3.3 Application Routing (App Router)
- **Home Page (`src/app/page.tsx`)**: The main dashboard renders a "Building In Public" hero header, a network visualizer with animated SVG connections between a central stats hub and individual project nodes, and two masonry-layout sections: **Software** projects and **Social** projects. Uses a bulk `getMultipleProjectDetails(ids)` API to fetch all project details efficiently.
- **Projects Page (`src/app/projects/page.tsx`)**: A dedicated listing of projects.
- **Blog (`src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`)**: Blog index and dynamic blog post pages.

### 3.4 Network Visualizer
The home page features an interactive network visualization:
- **`NetworkLines` (`src/components/network-lines.tsx`)**: Renders animated SVG lines connecting a central hub to each project node, distributed left/right on desktop and top/bottom on mobile.
- **`CentralStatsHub` (`src/components/central-stats-hub.tsx`)**: The center of the network, displaying Total Revenue, Subscribers, Views, and a Products count with animated counters.
- **`NodeIcon` (`src/components/node-icon.tsx`)**: Individual project nodes with hover tooltips and optional link wrappers.
- **`AnimatedCounter` (`src/components/animated-counter.tsx`)**: Framer Motion-powered counter that animates from 0 to the target value.

### 3.5 Platform-Specific Project Rows
Projects are rendered with platform-aware card components via `renderProjectRow()` in `src/components/project-rows/index.tsx`. The function switches on `project.platform ?? project.type`:
- **YouTube** → `YouTubeProjectRow` (subscribers, monthly views, avg watch time)
- **npm** → `NpmProjectRow` (downloads, weekly downloads)
- **Software** → `SoftwareProjectRow` (MRR, active users, churn rate)
- **Twitter/X** → `TwitterProjectRow`
- **TikTok** → `TikTokProjectRow`
- **Twitch** → `TwitchProjectRow`
- **Instagram** → `InstagramProjectRow`
- **GitHub** → `GithubProjectRow` (stars, forks)
- **Default** → `DefaultProjectRow` (generic card)

Each row displays the project name/type, a three-column financial grid (Revenue | Profit | Costs with animated counters), and platform-specific metrics. Custom project logos are supported (Workflow Pilot, TalkyTexty) via a `PROJECT_ICONS` map using `next/image`.

### 3.6 Metrics Providers (Cron Pipeline)
Automated metric ingestion from external APIs:
- **`src/lib/providers/`**: A provider system with a factory function `getMetricsProvider(platform)` and a standardized `SocialMetrics` interface.
- **YouTube Provider** (`youtube-provider.ts`): Fetches subscriber count and view count from the YouTube Data API.
- **GitHub Provider** (`github-provider.ts`): Fetches stars and forks from the GitHub API.
- **npm Provider** (`npm-provider.ts`): Fetches total and weekly download counts from the npm registry API.

### 3.7 Data Automation (Vercel Cron)
To keep metrics up to date without manual data entry:
- **Cron Definition (`vercel.json`)**: Configured to ping the application daily at midnight UTC (`0 0 * * *`).
- **Secure API Route (`src/app/api/cron/route.ts`)**: Protected by a `CRON_SECRET` Bearer token. Upon authorization, it:
  1. Fetches all active projects from the data client.
  2. For each project with a platform and platformAccountId, retrieves metrics via the appropriate provider.
  3. Upserts metrics into the Notion Metrics database (updates existing records or creates new ones).
  4. Calls `revalidatePath('/')` to refresh the Next.js cache.
  5. Handles per-project errors gracefully without failing the entire run.

### 3.8 CI/CD Pipeline
- **GitHub Actions (`.github/workflows/ci.yml`)**: Runs on pushes to `main` and pull requests. The `test` job installs dependencies via pnpm and runs the full Jest suite. The `deploy` job depends on `test` passing and only runs on `main` pushes — it uses the Vercel CLI to pull environment config, build, and deploy to production.
- **Vercel Hosting**: Auto-detection of Next.js with pnpm. Environment variables are configured in the Vercel dashboard (not committed to the repo). Automatic GitHub deploys are disabled in favor of the CI-gated workflow.

## 4. Test-Driven Development (TDD) Implementations
The repository maintains **49 passing tests across 20 suites**, constructed prior to implementation:

- **Component Tests**: `DashboardCard`, `Header`, `ProgressBar` components are tested for rendering and interaction.
- **Project Row Tests**: Each platform-specific row (YouTube, Twitter, TikTok, Twitch, Instagram, GitHub, npm, Software, Default) has its own test suite validating metrics display and financial rendering.
- **Data Client Tests**: The `NotionClient`, `LocalMockClient`, and `ClientFactory` have independent suites guaranteeing aggregation math (e.g., `Net Profit = Total Revenue - Total Costs`).
- **Page Integration Tests**: Assert the home page renders the network visualizer, stats hub, and project sections.
- **Cron Tests**: Validate Bearer token auth (401 for missing/invalid tokens), upsert logic, and per-project error handling.
- **Provider Tests**: YouTube, GitHub, and npm providers are tested for API response parsing and error handling.

## 5. Current State

### 5.1 Project Status
The foundational architecture is complete. The UI renders a network visualizer with animated connections, a central stats hub, and platform-specific project cards in a masonry layout split into Software and Social sections. The data abstraction layer is fully operational via both Local Mode and the live Notion API. Automated metric ingestion runs daily via Vercel cron for YouTube, GitHub, and npm platforms. Test coverage is extensive (49 tests, 20 suites). CI/CD is configured via GitHub Actions with deploys to Vercel gated on passing tests.

### 5.2 Feature Branches
- **`feature/tools`**: A tools/services page (listing tools used across projects, per-tool detail pages, and tool badge components on project cards). Parked on a separate branch pending real data population.

### 5.3 Resolved: Notion SDK Bug
The previous runtime error (`TypeError: notion.databases.query is not a function`) was caused by an incorrect SDK version reference (`^5.9.0` in package.json, which does not exist). This was resolved by:
1. Pinning `@notionhq/client` to `^2.2.15` (the correct published version).
2. Fixing the `getProjects` filter to use `select` instead of `status` (matching the Notion DB property type).
3. Fixing relation filters to use `projects` (plural) instead of `project`.
4. Fixing metric name access to use the `name` title property instead of `metric name`.
