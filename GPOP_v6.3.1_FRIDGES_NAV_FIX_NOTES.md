# GPOP v6.3.1 Fridges Navigation Fix

This patch amends the uploaded current build without rebuilding from scratch.

## Fixed

- Fridges module was present in the module registry, settings, page router and EasyLog service layer, but it was not visible in the left navigation because role access in `src/data/users.js` did not include the `fridges` permission.
- Added explicit `fridges` access for each demo role:
  - Practice Manager: Manage
  - GP Partner: View
  - Reception / Care Navigator: No access
  - Practice Nurse: View
  - Dispenser: Complete checks
  - ARRS Pharmacist: View
- Removed the duplicated nested `src/src` folder from the returned build to avoid stale file confusion.

## Included from v6.3

- `src/pages/FridgePage.jsx`
- `src/services/easyCloudAdapterService.js`
- `supabase/functions/easycloud-sync/index.ts`
- `supabase/migrations/20260609_gpop_v63_easylog_integration.sql`

## Validation

- `npm install` passed.
- `npm run build` passed.
- No `.env`, `.env.local`, `node_modules`, `dist` or `.git` included in the returned zip.
