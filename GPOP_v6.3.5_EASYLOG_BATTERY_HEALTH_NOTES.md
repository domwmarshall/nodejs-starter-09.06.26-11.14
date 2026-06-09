# GPOP v6.3.5 — EasyLog Battery Health

## Purpose
Adds proper EasyLog battery-health handling to the fridge module.

## Changes
- Battery level is now read from EasyLog device metadata during device sync.
- Handles casing/field variation such as `batteryLevel`, `BatteryLevel`, `battery_level`.
- Stores the raw EasyLog summary in `fridge_devices.metadata.rawDeviceSummary` for debugging and future mapping.
- Adds `metadata.batteryLabel`, `metadata.permanentlyPowered`, `metadata.currentConnectionMethod` and `metadata.deviceDetailsEndpoint`.
- Frontend displays human-readable battery status:
  - 0 = Critical
  - 1–5 = battery level out of 5
  - 11 = Charging
  - 12 = Full
  - 13 = Battery error
  - 20 = mains powered but disconnected
  - 21 = mains powered and OK
- Page-open auto-refresh now runs the background cycle, so it refreshes device health/battery plus readings and alarms.

## SQL
No new SQL migration required. Existing `battery_level` and `metadata` fields from v6.3 are used.

## Edge Function
Redeploy `supabase/functions/easycloud-sync/index.ts` after replacing files.
