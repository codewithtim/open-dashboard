# Feature Plan: Project UI Updates

## Objective
The current layout displays "Active Projects" in a standard grid layout on the Home Dashboard `src/app/page.tsx`. Currently, these cards only show the Project Name and Type, requiring a click-through to `/projects/[id]` to see financial or engagement metrics.

The goal is to update these project cards to be **full-width** lists and surface key performance indicators (Revenue, Costs, Profit, or specific Custom Metrics) directly on the dashboard surface.

## Proposed Layout Changes

### 1. `src/app/page.tsx` & Data API Updates
- **Structure:** Change the CSS grid container for projects from `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` to a full-width vertical stack `<div className="space-y-4">`.
- **Data Requirement:** The root page currently calls `getProjects()`, returning lightweight `Project` objects (ID, Name, Type, Status). To render deep financial metrics efficiently, we need to batch fetch this data.
  - *API Update:* Add `getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]>` to the `DataClient` interface (`src/lib/data-client.ts`).
  - *Refactor:* The `NotionClient` and `LocalMockClient` must both implement this bulk fetch.
  - *Page Refactor:* `DashboardPage` will first call `getProjects()` to get active IDs, and then pass those IDs directly into `client.getMultipleProjectDetails(ids)`.

### 2. The New Card Anatomy
The new vertical card will be designed using Flexbox to span 100% of the parent container:

```tsx
<Link href={`/projects/${p.id}`} className="block p-6 border rounded-xl flex items-center justify-between group">
  {/* Left Side: Identification */}
  <div>
    <h3 className="font-semibold text-lg">{p.name}</h3>
    <span className="text-sm text-neutral-500">{p.type}</span>
  </div>

  {/* Middle/Right Side: Key Metrics Container (Hidden on mobile, visible on desktop) */}
  <div className="hidden md:flex items-center gap-8 text-sm">
    <div className="flex flex-col">
      <span className="text-neutral-500 text-xs uppercase tracking-wider">Revenue</span>
      <span className="font-medium">${p.totalRevenue.toLocaleString()}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-neutral-500 text-xs uppercase tracking-wider">Profit</span>
      <span className="font-medium text-emerald-600">${p.netProfit.toLocaleString()}</span>
    </div>
    
    {/* Optional: Render up to 2 custom metrics inline */}
    {p.metrics.slice(0, 2).map(m => (
      <div key={m.name} className="flex flex-col">
        <span className="text-neutral-500 text-xs uppercase tracking-wider">{m.name}</span>
        <span className="font-medium">{m.value.toLocaleString()}</span>
      </div>
    ))}
  </div>
  
  {/* Extreme Right: Arrow Icon */}
  <span className="text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-1 transition">→</span>
</Link>
```

## Validation & TDD Plan

### To-Do List
- [x] Add `getMultipleProjectDetails(ids: string[])` to the `DataClient` interface in `src/lib/data-client.ts`.
- [x] Implement `getMultipleProjectDetails` in `LocalMockClient` and `NotionClient`.
- [x] Write/Update unit tests for the new `getMultipleProjectDetails` functionality in both clients.
- [x] Update `src/app/__tests__/page.test.tsx` to mock `getMultipleProjectDetails`.
- [x] Add testing assertions enforcing that the new `Revenue`, `Profit`, and `Custom Metrics` calculations render successfully on the Home Page.
- [x] Refactor `src/app/page.tsx` data fetching logic to use `getMultipleProjectDetails(ids)` instead of iterating.
- [x] Replace the 2-column grid structure with a vertical `space-y-4` container.
- [x] Redesign the internal Project card structure (`<Link>`) to include the `hidden md:flex` horizontal metric layout.
- [x] Perform manual viewport testing (Desktop/Mobile) to verify responsive truncation and spacing constraints.
