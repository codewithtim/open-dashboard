# Dynamic Project Network Hub - Plan

## Goal Description
Refactor the Network Visualizer to dynamically generate node icons based on the actual Active Projects loaded from the data client. Furthermore, guarantee that these nodes align perfectly with the SVG network lines across all screen sizes and resolutions.

## Proposed Changes

### Top-Level Shell & Layout
#### [MODIFY] src/app/page.tsx
- Remove the hardcoded `<NodeIcon>` wrappers from `page.tsx`.
- Pass the `detailedProjects` array directly to `<NetworkLines />`.

### Network Visualizer Component
#### [MODIFY] src/components/network-lines.tsx
- Add a new helper function `getProjectAppearance(project)` that returns a specific `react-icons` icon and color tint depending on `project.platform` or `project.type` (e.g., YouTube = `FiYoutube` & Red, Software = `FiBox` & Indigo, Twitter = `FiTwitter` & Blue).
- **Alignment Fix:** Change the `<svg>` to use `viewBox="0 0 100 100"` and `preserveAspectRatio="none"`. This makes SVG coordinates map 1:1 with CSS percentages.
- **Dynamic Calculation:**
  - Split the `projects` array in half.
  - Left half gets `x = 15`. Right half gets `x = 85`.
  - Distribute `y` values evenly between `y = 20` and `y = 80`.
- **Dynamic Render:** Loop over the projects array to generate both the `<path>` and `<animateMotion>` inside the SVG *and* the absolutely positioned `<NodeIcon>` overlay `div`s (using `style={{ left: \`${x}%\`, top: \`${y}%\` }}` and `-translate-x/y` for perfect center alignment).

## Verification Plan
### Automated Tests
- Ensure `npm run test` still passes. The layout components mock these, but we need to make sure we don't break simple render tests.
### Manual Verification
- Resize the browser viewport. The nodes must remain perfectly "glued" to the ends of the SVG lines, and the number of nodes should exactly match the mocked `projects`.

## User Review Required
> [!IMPORTANT]
> The dynamic generation logic will guarantee the lines and nodes never detach. Does this approach look good to you? Once approved I will execute it!
