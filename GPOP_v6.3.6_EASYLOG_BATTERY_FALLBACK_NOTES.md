# GPOP v6.3.6 EasyLog battery fallback

- Adds battery/health refresh during current-reading sync.
- Calls Devices.svc/Device as a fallback when AllDevicesSummary has no batteryLevel.
- Preserves current-reading sync and background cron.
- Removes duplicated metadata declaration in the Edge Function.
- No new SQL migration required if v6.3 migration has already been run.
