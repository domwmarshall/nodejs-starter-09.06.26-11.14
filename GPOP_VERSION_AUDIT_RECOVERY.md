# GPOP Version Audit and Recovery

Uploaded source checked against the saved sprint zips.

## Detected state
- The uploaded zip was closest to **GPOP v6.0 Functional Product Core**.
- Key files such as `src/pages/CareNavigationPage.jsx` and `src/style.css` matched the early v6.0 functional core rather than the later care-nav/workforce/Supabase builds.
- The uploaded zip did **not** include the v6.2 Supabase capacity backbone service or migration.
- The uploaded zip also contained a duplicated nested `src/src` tree, which has been removed in this recovered build.

## Recovered to latest working point
This zip has been upgraded to the latest saved working build:
- v6.2 Supabase Capacity Backbone
- Supabase migration: `supabase/migrations/20260609_gpop_v62_capacity_backbone.sql`
- Capacity backbone service: `src/services/capacityBackboneService.js`
- Access page Supabase/backbone panel
- Staff split sessions
- Bank/locum work pattern selector
- Bank/locum cost/wage fields
- Care-nav capacity-aware routing foundation
- Pathway expansion and Pharmacy First context fields

## Validation
- `npm install` passed
- `npm run build` passed
- No `.env`, `.env.local`, `node_modules`, `dist`, or `.git` included

## Next step
Run the Supabase migration in the SQL editor, restart the app, sign in through Access, then seed/check the DB backbone.
