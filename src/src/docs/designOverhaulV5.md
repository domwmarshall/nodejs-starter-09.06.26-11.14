# GPOP v5.0 Design Overhaul

## Direction

GPOP v5.0 moves the prototype towards a calmer, more premium SaaS interface:

- blue, grey and white colour system
- smaller, denser content to work better on laptops
- less visual noise and fewer shouty gradients
- crisp panels with subtle borders and shadows
- cleaner sidebar with grouped navigation
- compact sticky top bar
- softer badges, tables and alerts
- less NHS-dashboard energy and more commercial practice-management product feel

## What changed

- Reworked the global CSS design system in `src/style.css`
- Rebuilt the sidebar brand/nav/search area
- Reworked the top bar, user switcher and module jump controls
- Reworked buttons, panels, page headers, form fields and alert banners
- Reworked metric cards for a tighter laptop-friendly layout
- Pinned Vite/plugin versions to avoid WebContainer wasm fallback issues

## What did not change

- Supabase connection logic
- Activity log service
- localStorage fallback
- feature calculations
- module routing
- role permissions
- existing data model

## Next design steps

- Build a true calendar room/workforce board component
- Add proper drag-and-drop using a supported library
- Create a compact command palette/search interaction
- Add a formal dark mode later, not now
