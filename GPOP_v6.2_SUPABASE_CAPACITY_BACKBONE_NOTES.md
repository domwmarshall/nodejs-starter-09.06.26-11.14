# GPOP v6.2 Supabase Capacity Backbone

This build moves GPOP from a local-only prototype toward a Supabase-backed operational capacity model.

## Added

- Supabase migration: `supabase/migrations/20260609_gpop_v62_capacity_backbone.sql`
- Practice-scoped RLS-ready tables for:
  - `practices`
  - `profiles`
  - `practice_memberships`
  - `rooms`
  - `staff_profiles`
  - `staff_skills`
  - `working_pattern_sessions`
  - `bank_locum_sessions`
  - `leave_requests`
  - `care_nav_assignment_rules`
  - `systmone_capacity_imports`
  - `gpop_activity_log`
- Supabase service layer: `src/services/capacityBackboneService.js`
- Access page v6.2 panel to:
  - check the DB backbone
  - seed Supabase from current GPOP local/demo workforce data
- App startup can load seeded Supabase workforce profiles back into the local UI shape.

## Important setup order

1. Ensure `.env.local` contains only:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Sign up/sign in from the Access page.
3. Apply the new SQL migration in Supabase SQL Editor.
4. Return to GPOP Access page.
5. Click **Check DB backbone**.
6. Click **Seed from current GPOP data**.
7. Refresh and test Staff / Rota / Care Navigation.

## Safety / governance

- No service-role secrets belong in the frontend.
- Do not add patient-identifiable data.
- Care Navigation remains governed receptionist support only.
- Care-nav assignment rules are still Draft until local clinician sign-off.
- SystmOne capacity import is only a placeholder table/adaptor point at this stage.
