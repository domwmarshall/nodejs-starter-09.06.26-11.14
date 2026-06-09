# GPOP v6.2.1 DB Sync Polish Notes

## Purpose
This patch makes the Supabase capacity backbone easier to operate after the v6.2 migration.

## Added
- Access page diagnostics button.
- Access page safe operational reset button.
- Seed/upsert button wording clarified.
- Detailed table counts and table errors shown instead of silent failures.
- Staff, Rota and Care Navigation now show a data-source banner.
- Care Navigation shows visible same-day workforce capacity loaded from the current workforce pattern.
- Added migration patch for required unique indexes used by frontend upserts.

## Migration order
Run these in Supabase SQL editor after v6.2:

```sql
supabase/migrations/20260609_gpop_v621_sync_tools.sql
```

## Safety
- No service-role key in frontend.
- No patient-identifiable data added.
- Reset tool keeps practices, profiles and memberships, but clears seeded operational capacity data for the active practice.
