# easycloud-sync

GPOP EasyLog Cloud integration Edge Function.

## Required secrets

- `EASYCLOUD_API_TOKEN`
- `EASYCLOUD_USER_GUID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `EASYCLOUD_BASE_URL=https://apiwww.easylogcloud.com`
- `EASYCLOUD_ACCOUNT_GUID`

## Actions

Manual / frontend actions:

- `diagnostics`
- `sync-devices`
- `sync-current-readings`
- `sync-alarms`

Background cron actions:

- `cron-refresh` — refresh one practice. Requires `practiceId` in request body.
- `cron-refresh-all` — refresh all practices. Suitable for Supabase Cron Jobs.

## Cron body

```json
{"action":"cron-refresh-all"}
```

Recommended pilot cadence: every 5 minutes.
