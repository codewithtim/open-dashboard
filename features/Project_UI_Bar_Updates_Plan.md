# Feature Plan: Inline Project UI Bar Updates

## Objective
Remove the toggleable `<details>` dropdown menu from the Active Projects list on the dashboard. Instead, move all financial data (Costs) and social metrics (Subscribers, Views, Videos) into the main header bar so that all project data is horizontally inline and always visible at a glance.

## Architecture & UI Changes

1. **Modular UI Components (`src/components/project-rows/`)**:
   - Instead of a single, crowded `<details>` or `<div>` loop, we will implement a Component Factory pattern.
   - We will create dedicated, specialized components for each media platform to allow custom stat positioning:
     - `<YouTubeProjectRow />`: Focuses on Subscribers, Views, and Videos alongside Revenue/Profit.
     - `<SoftwareProjectRow />`: Focuses on MRR, Active Users, alongside standard financial metrics.
     - `<DefaultProjectRow />`: A fallback component for projects without a specific `platform`.

2. **Component Factory Integration (`src/app/page.tsx`)**:
   - We will remove the large inline `<details>` markup from `page.tsx`.
   - Instead, we will map over `detailedProjects` and use a `getProjectComponent(project)` helper.
   - The helper will read `project.platform` and return the correct specialized component.
   
3. **Information Architecture**:
   - Because each platform has its own dedicated component, the metrics don't need to be hidden in an accordion. They can be laid out perfectly inline, styled natively for the data they represent, removing the need to map over the dynamic Notion `metrics` array generically.

4. **Styling Retention**:
   - All newly created components will share the core "Horizon UI" aesthetics (glassy white/dark backgrounds, `rounded-[20px]`, soft drop-shadows, and Navy/Grey typography).

3. **Styling Retention**:
   - The premium "Horizon UI" aesthetics (the glassy white/dark backgrounds, the `rounded-[20px]`, the soft drop-show hover effects, and the Navy/Grey typography) will be entirely preserved.

## Implementation Steps (To-Do List)

- [ ] **1. Create Component Structure**: 
  - Create a new directory: `src/components/project-rows/`.
  - Stub out the core component files: `index.ts` (for the factory), `youtube-row.tsx`, `software-row.tsx`, and `default-row.tsx`.

- [ ] **2. Build the Default Component (`<DefaultProjectRow>`)**:
  - Extract the current top-level styling (the `bg-white`, large border radius, glassy hover shadow) from the old `details` block.
  - Implement a clean, inline flex row displaying the `Project Name`, `Type`, and standard `Revenue`/`Profit`/`Total Costs`.
  - Map out any remaining unknown `metrics` gracefully on the right side if they exist.

- [ ] **3. Build the YouTube Component (`<YouTubeProjectRow>`)**:
  - Inherit the same styling and layout as the Default row.
  - Hardcode specific slots and UI treatments for `Subscribers`, `Views`, and `Videos` alongside the financial data.
  - Ensure the YouTube icon logic is seamlessly integrated.

- [ ] **4. Build the Software/SaaS Component (`<SoftwareProjectRow>`)**:
  - Implement similar inline layout, but reserve slots tailored for software platforms (e.g., `MRR`, `Active Users` if applicable).

- [ ] **5. Implement Component Factory (`index.ts`)**:
  - Create a helper `renderProjectRow(project: ProjectDetails)` that switches on `project.platform` and returns the correct specialized component instance.

- [ ] **6. Refactor Page Layout (`src/app/page.tsx`)**:
  - Remove all the `<details>` and messy HTML inside the `detailedProjects.map`.
  - Replace it simply with `{detailedProjects.map(p => renderProjectRow(p))}`.

- [ ] **7. Responsive Testing & Test Suite**:
  - Adjust Tailwind flex wrapping and gaps (`flex-wrap`, `gap-4`, `md:gap-8`) to ensure these new robust rows look clean on both mobile and desktop.
  - Run the Jest suite (`npm run test`) to fix any snapshot or DOM matching issues caused by removing the `details` tag.
