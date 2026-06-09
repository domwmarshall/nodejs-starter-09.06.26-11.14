# GPOP v6.3.4 EasyLog background cron setup

This sets up server-side EasyLog refresh so fridge readings continue syncing even when nobody has GPOP open.

## Preferred dashboard route

1. Deploy the updated Edge Function:
   - Supabase → Edge Functions → easycloud-sync
   - Replace the function code with `supabase/functions/easycloud-sync/index.ts`
   - Deploy

2. Create the scheduled job:
   - Supabase → Database → Cron Jobs / Jobs
   - Create job
   - Choose Supabase Edge Function / HTTP request
   - Function: `easycloud-sync`
   - Schedule: every 5 minutes, for example `*/5 * * * *`
   - Method: POST
   - Body:

```json
{"action":"cron-refresh-all"}
```

3. Save the job.

4. In GPOP:
   - Fridges → Test background cycle
   - Then check the Sync log after the first scheduled run.

## What the cron action does

The `cron-refresh-all` action:

- Finds all GPOP practices in Supabase.
- Syncs EasyLog devices.
- Syncs current readings.
- Syncs EasyLog alarm state.
- Writes results to `integration_sync_log`.
- Updates `fridge_devices` and `fridge_readings`.

## Safe cadence

For Fleggburgh Surgery's initial pilot, use 5 minutes. Once the module is stable, 10 or 15 minutes may be enough depending on EasyLog transmission periods and practice preference.

## Secrets remain server-side

Do not put EasyLog credentials in the browser app. The function still expects:

- `EASYCLOUD_API_TOKEN`
- `EASYCLOUD_USER_GUID`
- `EASYCLOUD_BASE_URL`

These belong in Supabase Edge Function secrets only.
