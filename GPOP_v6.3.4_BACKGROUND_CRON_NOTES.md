# GPOP v6.3.4 Background EasyLog Cron

## Added

- Edge Function action: `cron-refresh`
- Edge Function action: `cron-refresh-all`
- Fridges page button: `Test background cycle`
- Fridges page background sync guidance panel
- Documentation for Supabase Cron setup

## Operational meaning

Page-open auto-refresh remains available for active users. The new cron action is server-side and can be scheduled in Supabase so EasyLog devices, current readings and alarms keep syncing even when nobody has GPOP open.

## Deployment

1. Redeploy `supabase/functions/easycloud-sync/index.ts`.
2. Create a Supabase Cron Job against the Edge Function.
3. Use POST body: `{ "action": "cron-refresh-all" }`.
4. Recommended pilot cadence: every 5 minutes.
5. Confirm runs in GPOP → Fridges → Sync log.

## Security

No EasyLog secret is exposed in the frontend. EasyLog credentials remain Supabase Edge Function secrets only.
