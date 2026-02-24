# Feature Plan: Premium "Horizon UI" Redesign

## Objective
Elevate the dashboard's aesthetic from a basic style to a premium, soft, modern interface inspired by high-end dashboard templates (like Horizon UI). We will also ensure the YouTube icon pulls the authentic logo accurately.

## Proposed Changes

### 1. Global Theming & Layout (Soft & Premium)
The inspiration screenshot uses an extremely soft, off-white background with distinct, elevated white cards that have large border radii and very dispersed, soft drop-shadows.

#### `src/app/layout.tsx` & `src/app/globals.css`
- **Background**: Update the global background from `bg-slate-50` to a custom extremely soft, slightly cool off-white (e.g., `bg-[#F4F7FE]`). Dark mode will use a deep rich blue-gray.
- **Max-Width**: Instead of a strict `max-w-5xl`, we'll widen the container slightly (`max-w-7xl` or remove the strict horizontal padding) to give the metrics room to breathe like the screenshot.

### 2. Dashboard Cards (Glassy & Soft)
The metrics cards in the screenshot do not use harsh borders; they rely entirely on white backgrounds, heavy rounded corners, soft text colors for labels, and dark Navy bold text for values.

#### `src/components/dashboard-card.tsx`
- **Shape & Shadow**: 
  - Remove all structural `border` classes.
  - Apply generous rounding: `rounded-2xl` or `rounded-3xl`.
  - Add a custom, diffused soft shadow mimicking the screenshot.
  - Set the background strictly to solid white (`bg-white`) in light mode and off-black (`bg-[#111C44]`) in dark mode.
- **Typography**: 
  - The title (e.g., "Earnings") should be a soft, muted grey (`text-[#A3AED0]`).
  - The value should be large, bold, and dark navy (`text-[#2B3674]`).

### 3. Progress Bar (Sleek & Rounded)
The screenshot uses smooth, high-contrast, fully rounded progress curves.

#### `src/components/progress-bar.tsx`
- Ensure the background track is a soft grey.
- Ensure the label text above it adopts the new muted-grey + navy-value typography system.

### 4. Interactive Project Cards (The Table Equivalent)
In the screenshot, data is presented in clean, borderless list/table rows.

#### `src/app/page.tsx`
- **Card Styling**: Remove strict borders from the `<details>` elements. Instead, use pure white backgrounds, large rounding, and soft drop-shadows identical to the metric cards.
- **Typography Update**: Change the headers (e.g., "Active Projects") to match the dark navy premium color (`text-[#2B3674]`).

### 5. YouTube Icon Fix & Circular Containers
The user noticed the YouTube icon is currently mapping to a generic box.

#### `src/app/page.tsx` (`getProjectIcon` function)
- The Notion relation or property for the specific project might be named something else (e.g. "Channel") instead of containing the word "youtube".
- We will strengthen the matching logic by checking for keywords or exact platform matches.
- Finally, the circular icon containers inside the project cards will be updated to the soft glassy circular rings seen in the screenshot.

## Next Steps (To-Do List)
Once approved:
- [x] **Global Styling**: Update global layouts (`src/app/layout.tsx` & `globals.css`) for the new Soft-UI canvas and wider container spacing.
- [x] **Metric Cards**: Refactor the `DashboardCard` component entirely to remove hard borders, add soft drop-shadows, and apply Horizon UI typography (navy text, grey labels).
- [x] **Interactive Project Rows**: Overhaul `page.tsx` to apply this same glassy shadow and borderless design to the `<details>` project cards.
- [x] **YouTube Icon Fix**: Debug and fix the string matching logic in `getProjectIcon` (e.g., checking for 'content' or 'channel') to ensure the authentic `FaYoutube` icon properly renders for YouTube channels.
- [x] **Verification**: Run the test suite to ensure styling updates didn't break DOM styling assertions.
