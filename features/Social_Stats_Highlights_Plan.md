# Feature Plan: Global Social Stats Highlights

## Objective
Provide an aggregated view of primary social/custom metrics (e.g., Subscribers, Views, Active Users) across all active projects, displaying them prominently at the top of the dashboard alongside the global financial stats.

## Architecture & Data Changes

1. **Domain Model Expansion (`src/lib/data-client.ts`)**:
   - Update the `DashboardStats` interface to include an aggregated map or specific keys for global metrics:
     ```typescript
     export interface DashboardStats {
         totalRevenue: number;
         totalCosts: number;
         netProfit: number;
         totalSubscribers: number;
         totalViews: number;
         totalActiveUsers: number;
     }
     ```

2. **Data Fetching (`src/lib/notion-client.ts`)**:
   - Update `getAggregatedDashboardStats()` to fetch and aggregate from the Metrics database.
   - We will need to either fetch all metrics related to *Active* projects, or simply fetch all metrics and filter them against the active projects list. A robust approach is:
     1. Resolve all Active Projects (we might need to reuse the `getProjects()` query).
     2. Query the Metrics database.
     3. Iterate through the metrics. If a metric belongs to an active project, add its `value` to the corresponding global tally based on its `name` (e.g., matching "subscriber", "view", "user").

3. **UI Implementation (`src/app/page.tsx`)**:
   - Add a new section below the global financials (or intertwine them) using the `DashboardCard` component.
   - Example UI layout:
     - **Global Financials**: Total Revenue, Total Costs, Net Profit
     - **Global Reach**: Total Subscribers, Total Views, Active Users
   - Pass the new stats from `client.getAggregatedDashboardStats()` into these cards.

## Implementation Steps (Test-Driven Development)

- [ ] **1. Domain & Tests**: Expand `DashboardStats` in `data-client.ts`. Write failing tests in `notion-client.test.ts` to assert `getAggregatedDashboardStats` properly calculates `totalSubscribers`, `totalViews`, etc.
- [ ] **2. Notion Client**: Implement the aggregation logic inside `NotionClient.getAggregatedDashboardStats()`, ensuring it only sums metrics linked to active projects.
- [ ] **3. UI Layout**: Update `src/app/page.tsx` to render three new `<DashboardCard />` components for the social stats.
- [ ] **4. Test Suite**: Verify the UI structure via Jest snapshot/DOM tests.
