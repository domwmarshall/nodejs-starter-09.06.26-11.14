# GPOP v6.3 EasyLog Integration Foundation

This release adds the first safe EasyLog Cloud / EasyCloud integration layer.

## Implemented

- New Fridges module in the main navigation.
- EasyLog diagnostics, sync devices, sync current readings and sync alarms buttons.
- Supabase Edge Function scaffold at `supabase/functions/easycloud-sync/index.ts`.
- Supabase migration at `supabase/migrations/20260609_gpop_v63_easylog_integration.sql`.
- Fridge device register schema expansion for EasyLog GUID, MAC, location GUID, device type, RSSI, battery, connection loss, alarm state and current temperature.
- Sync log display via `integration_sync_log`.
- Manual fallback remains available and no patient-identifiable data is added.

## Required Supabase secrets

Do not put these in `.env.local` or any `VITE_` variable.

```bash
EASYCLOUD_API_TOKEN
EASYCLOUD_USER_GUID
```

Optional:

```bash
EASYCLOUD_BASE_URL=https://apiwww.easylogcloud.com
```

## Deployment steps

1. Run `supabase/migrations/20260609_gpop_v63_easylog_integration.sql` in Supabase SQL Editor.
2. Add EasyLog secrets in Supabase Edge Function secrets.
3. Deploy the Edge Function:

```bash
supabase functions deploy easycloud-sync
```

4. In GPOP, open Fridges → Run EasyLog diagnostics.
5. If diagnostics pass, run Sync devices, Sync current readings and Sync alarms.

## Safety

The React frontend only calls Supabase. It does not contain EasyLog credentials, user GUIDs, passwords, database passwords or service-role keys.
