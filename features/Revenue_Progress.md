# Feature Plan: Revenue Progress Bar

## Objective
The Open Dashboard tracks a transparent "0 to $1M Challenge". To visualize this core objective immediately upon page load, we want to add a prominent **Progress Bar** to the top of the Home Page (`src/app/page.tsx`). 

This progress bar will calculate its completion percentage dynamically based on the `totalRevenue` metric aggregated from all projects, mapping it against the `$1,000,000` goal.

## Proposed Layout Changes

### 1. `src/components/progress-bar.tsx`
Create a new standalone, reusable React component for the progress bar.
- **Props:** `currentValue` (number), `targetValue` (number, default: 1,000,000).
- **Design:** A sleek, animated, full-width track (Tailwind background) with a filled percentage bar inside. It should look premium, matching the underlying Stripe aesthetic. It should include the current dollar amount and the target dollar amount on opposite ends.

### 2. `src/app/page.tsx` Updates
- Import and mount `<ProgressBar />` above the existing "Total Revenue / Total Costs / Net Profit" `DashboardCard` grid.
- Pass the `stats.totalRevenue` from `getDataClient().getAggregatedDashboardStats()` into the progress bar.

## Validation & TDD Plan

### To-Do List
- [X] Create `src/components/__tests__/progress-bar.test.tsx` asserting that calculations hold (e.g., $500k = 50% width) and edge cases (prevent >100% bleeding).
- [X] Implement `src/components/progress-bar.tsx` prioritizing Tailwind CSS v4 styling for the bar's internal `<div className="w-[X%]">` width.
- [X] Update `src/app/__tests__/page.test.tsx` to assert that the `<ProgressBar />` renders the mocked `totalRevenue` from the global stats.
- [X] Mount `<ProgressBar currentValue={stats.totalRevenue} targetValue={1000000} />` inside `src/app/page.tsx`.
