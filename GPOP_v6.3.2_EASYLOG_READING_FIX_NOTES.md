# GPOP v6.3.2 EasyLog Reading Fix

## Fixes

- Prevents missing/null EasyLog readings from displaying as `0.0°C`.
- Missing current readings now display as `No reading` / `Awaiting reading`, not `Out of range`.
- `Sync current readings` now calls `Devices.svc/CurrentReadings` for each mapped EasyLog device using `sensorGUID`.
- Saved current readings are written into `fridge_readings` and the latest value is written back to `fridge_devices.current_temperature`.
- Edge Function sync message now reports how many devices were checked, how many current readings were saved, and how many devices returned no temperature reading.
- Existing EasyLog device sync, alarm sync and manual fallback remain preserved.

## Supabase action required

Replace/redeploy the existing `easycloud-sync` Edge Function with the updated file:

`supabase/functions/easycloud-sync/index.ts`

Then in GPOP run:

1. Fridges → Sync devices
2. Fridges → Sync current readings
3. Fridges → Refresh snapshot

No new SQL migration is required if v6.3 migration has already been run.
