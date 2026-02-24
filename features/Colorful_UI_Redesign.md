# Feature Plan: Colorful Dashboard Redesign & Project Icons

## Objective
The goal is to transition the Open Dashboard from a strictly monochrome (black and white / neutral) aesthetic to a more vibrant and colorful design, while maintaining its clean, modern, Stripe-like feel. Additionally, we will introduce specific identifying icons to each project card to improve visual scanning.

## Proposed Layout Changes

### 1. Progress Bar (`src/components/progress-bar.tsx`)
- **Vibrant Gradients**: Replace the solid neutral progress bar with an animated gradient representing energy and progress (`bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500`).
- Give the `$1,000,000` text or the current value a subtle colorful accent.

### 2. Dashboard Cards (`src/components/dashboard-card.tsx`)
- **Normal Cards**: Update hover states to have a subtle colorful glow or border (e.g., `hover:border-indigo-500/30 dark:hover:border-indigo-400/30`).
- **Featured Card**: Instead of a plain inverted neutral block, use a rich, premium gradient background: `bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-transparent shadow-lg shadow-indigo-500/20`.

### 3. Dashboard Home Page & Project Icons (`src/app/page.tsx`)
- **Typography & Accents**: Update the "Active Projects" `h2` heading to feature gradient text: `bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`.
- **Hover Effects**: Update the hover transitions on the project links to include a subtle colored border on hover, replacing the neutral hover border. The arrow `→` on hover can change to a vibrant color (e.g., `group-hover:text-indigo-500`).
- **Project Icons**: Import icons from `lucide-react` (e.g., `Youtube` for YouTube channels, `Code` or `Laptop` for software, `Video` or `Smartphone` for short-form platforms like TikTok).
- Add the corresponding icon to the left side of the project listing, to provide immediate visual identification.

### 4. Global Layout & Theming (`src/app/layout.tsx`)
- **Base Colors**: Smooth out the background to utilize `bg-slate-50 dark:bg-slate-950` instead of `neutral`, which gives a very subtle cool tint to support the new vibrant blues/purples.

## Validation & TDD Plan

### To-Do List
- [ ] Update `src/components/progress-bar.tsx` with vibrant blue/purple gradients.
- [ ] Update `src/components/dashboard-card.tsx` with contextual hover colors and featured card gradients.
- [ ] Update `src/app/page.tsx` with colorful typography and arrow accents.
- [ ] Implement `lucide-react` icons mapping in `src/app/page.tsx` based on the project type (e.g., YouTube, Software, TikTok/Video).
- [ ] Update `src/app/layout.tsx` background classes from `neutral` to `slate`.
- [ ] Run full Jest test suite (`pnpm test` or `npm run test`) to ensure rendering logic and calculations are unaffected.
- [ ] Manually verify UI changes, hover states, and iconography across Light and Dark themes.
