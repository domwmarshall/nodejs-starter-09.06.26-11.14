# GPOP v5.1 — Hybrid Clinical Command Centre + Colour Cockpit

This release moves the dashboard away from a dense administrative page and towards a marketable command-centre experience.

## Design direction

- Hybrid of Clinical Command Centre and Colour-coded Module Cockpit.
- Blue, grey and white base palette.
- Colour accents by operational area rather than large shouty blocks.
- Smaller content density so the dashboard fits better on laptop screens.
- Reduced warning-message clutter on the dashboard.
- More visual data storytelling through line charts, donut charts and module tiles.

## New dashboard features

- Vaccine fridge 24-hour temperature line chart.
- Dispensary fridge 24-hour temperature line chart.
- Safe temperature band visualisation for 2–8°C.
- Current, min/max and range status cards.
- Finance income mix pie chart.
- Governance exception pie chart.
- Module health pie chart.
- Readiness donut.
- Compact top command strip.
- Compact priority action queue.
- Colour-coded module cockpit.

## New graphics/charts pack

- `src/theme/gpopTheme.js`
- `src/theme/moduleThemes.js`
- `src/data/fridgeTemps.js`
- `src/components/charts/TemperatureLineChart.jsx`
- `src/components/charts/ModulePieChart.jsx`
- `src/components/charts/ProgressDonut.jsx`
- `src/components/charts/MetricSparkline.jsx`
- `src/components/graphics/GpopLogoMark.jsx`
- `src/components/graphics/ModuleIconBadge.jsx`
- `src/components/graphics/StatusOrb.jsx`

## Chart dependency

This release adds Recharts for React charts.

```bash
npm install recharts
```

## Next visual work

- Add a true calendar/rota board redesign.
- Add drag/drop-ready cards with dnd-kit.
- Reduce warning clutter on other modules.
- Move production safety banners into Settings/Admin rather than repeating across the app.
