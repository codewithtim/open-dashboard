# Open Dashboard Redesign Plan

## Goal Description
Redesign the Open Dashboard landing page to have a premium, dynamic, personal-brand aesthetic ("Tim Knight"). The core inspiration comes from Bytebase and other modern "network/hub" landing pages. It will feature a central "Stats" box (Total Revenue, Total Subscribers, Total Views) connected via animated lines and pulses to various peripheral nodes representing Social Accounts and Software Products.

## Theme & Aesthetic
- **Personal Brand**: Centered around "Tim Knight". Clean typography, striking dark/light mode contrasts.
- **Dynamic Elements**: Smooth SVG animations. A central node with bezier curve lines reaching out to peripheral icons (socials, SaaS products). Little dots/pulses will travel along these lines indicating "live data flow".
- **Color Palette**: Sophisticated Tailwind colors (slate/zinc for neutrals) with a vibrant accent color (e.g., an amber or emerald for revenue/stats) echoing a glassmorphic or sleek modern vibe.

## Proposed Changes

### Top-Level Shell & Header
#### [MODIFY] src/app/page.tsx
- Remove the old generic layout.
- Introduce the new personal-brand hero section ("Tim Knight: 0 to $1M Challenge").
- Integrate the central stats hub and network map component.

### Central Stats Hub
#### [NEW] src/components/central-stats-hub.tsx
- A glassmorphism/card component placed centrally.
- Will aggregate the top-level Notion data (Revenue, Subscribers, Views).
- Will use the existing `DataClient` to pull these metrics securely.

### Network Visualizer & Animations
#### [NEW] src/components/network-lines.tsx
- An SVG-based component that draws the connecting paths between the Central Stats Hub and the outer icon nodes.
- Will utilize `<animateMotion>` or CSS keyframes to send glowing "dots" along the SVG paths to simulate data flowing in/out.

### Peripheral Nodes (Socials & Products)
#### [NEW] src/components/node-icon.tsx
- A reusable component for rendering the endpoints (e.g., YouTube icon, X icon, SaaS logo).
- Will feature slight hover scale micro-animations.

### Existing Component Refactoring
#### [MODIFY] src/components/progress-bar.tsx
- Integrate seamlessly into the new header or just above the central hub, ensuring it fits the new premium aesthetic.

## Implementation Steps (Todo)
- [ ] **SVG & Layout Playground**: Create the static layout first (central box, peripheral boxes).
- [ ] **Path Drawing**: Wire the SVG lines between the components.
- [ ] **Animations**: Add the travelling dots and pulse effects to the SVG strokes.

## User Review Required
> [!IMPORTANT]
> Please review this structure! Once approved, we can start implementing these new components.
