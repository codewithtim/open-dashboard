# Feature Plan: Inline Project Data & Authentic Brand Icons

## Objective
Streamline the user experience by removing the dedicated project detail pages (`/projects/[id]`) and surfacing all relevant project data directly within the project cards on the main dashboard. Additionally, update the iconography so that each social platform uses its authentic, exact brand logo rather than a generic substitute.

## Proposed Layout & Architecture Changes

### 1. Authentic Brand Icons
- **Current State:** The dashboard uses `lucide-react`, which provides a basic YouTube icon but relies on generic icons (like a camera or monitor) for platforms like TikTok or custom SaaS.
- **Proposed Update:** Integrate a library like `react-icons` (which includes `Simple Icons` or `FontAwesome Brands`) to provide exact, official brand logos.
- **Mapping Strategy:**
  - **YouTube:** Official YouTube logo (`SiYoutube` / `FaYoutube`) in brand red.
  - **TikTok:** Official TikTok logo (`SiTiktok` / `FaTiktok`) using its authentic colors.
  - **X / Twitter:** Official X logo (`SiX` / `FaXTwitter`).
  - **SaaS / Software:** A sleek software/code icon.

### 2. Inline Project Details (Removing Separate Pages)
- **Current State:** Clicking a project card wrapper navigates the user to a separate `/projects/[id]` dynamic route.
- **Proposed Update:** Transform the dashboard project cards into interactive layouts (e.g., expandable accordions or detailed flex layouts) that display all necessary data on `page.tsx`.
- **Implementation in `src/app/page.tsx`:**
  - Remove the `<Link>` wrapper handling navigation.
  - Convert the static card into a Client Component (using `"use client"`) or a native HTML `<details>` and `<summary>` element.
  - **Always Visible (Summary):** Project Name, Authentic Brand Icon, Total Revenue, Net Profit.
  - **Expanded View (Details):** Full list of `metrics` (e.g., Subscribers, Views, MRR) and the `totalCosts` breakdown, nicely formatted within the flow of the dashboard.

### 3. Notion Query Optimization (Bulk Data Fetch)
- **Current State:** `getMultipleProjectDetails(ids)` calls `getProjectDetails(id)` in an iterative loop. If there are 10 projects, this results in 40 separate API requests to Notion simultaneously, which is slow and risks rate limiting.
- **Proposed Update:** Refactor `getMultipleProjectDetails` in `NotionClient` to fetch all relevant records from the Costs, Revenue, and Metrics databases across all active projects in a few combined requests. We will map the responses to their corresponding projects in-memory.

### 4. Clean-Up & Refactoring
- **Delete Routing:** Completely remove the `src/app/projects/[id]` directory since dynamic project routes are no longer needed.
- **Test Updates:**
  - Delete `src/app/__tests__/project-page.test.tsx`.
  - Update `src/app/__tests__/page.test.tsx` to assert that detailed metrics expand and render inline when the card is interacted with.
  - Update `src/lib/__tests__/notion-client.test.ts` to reflect the optimized bulk fetching.

## Next Steps (To-Do List)
- [x] **Approval:** Get consensus on this architectural change.
- [x] **Dependencies:** Install `react-icons` for exact brand SVGs.
- [x] **Data Layer Optimization:** Refactor `getMultipleProjectDetails` in `src/lib/notion-client.ts` to perform bulk fetching (O(1) queries) and map relational data in-memory.
- [x] **UI Implementation:** Refactor `src/app/page.tsx` to replace `lucide-react` with brand icons, and transform the `<Link>` project wrappers into interactive inline expandable HTML (`<details>`/`<summary>`).
- [x] **Clean-up:** Delete the `src/app/projects/[id]` folder.
- [x] **Testing:** Fix existing data and layout tests to pass under the new structure.
