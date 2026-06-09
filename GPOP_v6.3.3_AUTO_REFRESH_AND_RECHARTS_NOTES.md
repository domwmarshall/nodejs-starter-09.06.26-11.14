# GPOP v6.3.3 Auto Refresh and Recharts Temperature Plots

This build extends the v6.3.2 EasyLog reading fix.

## Added

- Fridges page auto-refresh controls.
- Auto-refresh interval buttons: 1, 5 or 15 minutes.
- Auto-refresh runs while the Fridges page is open.
- Each refresh syncs current EasyLog readings and checks alarms via the Supabase Edge Function.
- Last auto-refresh time and result message are shown on the Fridges page.
- Recharts temperature history line chart using synced `fridge_readings` from Supabase.
- 2-8°C safe-range reference band on the chart.
- Snapshot reading limit increased from 120 to 500 readings so the chart has a useful history window.

## Notes

This is a browser-page auto-refresh. For true 24/7 background sync when no one has GPOP open, add a Supabase scheduled function / cron-style job that invokes `easycloud-sync` on a fixed interval. The current build keeps EasyLog credentials server-side in Supabase Edge Function secrets.
