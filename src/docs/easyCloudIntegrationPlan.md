# GPOP EasyLog Cloud / Fridge Monitor Integration Plan

Status: **architecture scaffold only**. Do not scrape EasyLog Cloud and do not put EasyCloud credentials in frontend code.

## Source position checked June 2026

Lascar/EasyLog Cloud public pages describe EasyLog Cloud as a remote monitoring platform with device management, notifications, analysis/reporting, detailed audit records and an EasyLog Cloud API. The public Lascar page says to contact them for more information about the API. EasyLog Cloud support material describes sessions and logged data management, and the app listings describe live/historical readings and alarms.

Primary URLs:
- https://lascarelectronics.com/software/easylog-software/easylog-cloud/
- https://www.easylogcloud.com/
- https://www.easylogcloud.com/help.aspx

## Access steps for product owner

Contact Lascar/EasyLog Cloud and request:
- API documentation
- API access process
- authentication method
- whether API keys, OAuth, account tokens or device tokens are used
- endpoints for devices
- endpoints for locations
- endpoints for latest readings
- endpoints for historical readings
- endpoints for alarms
- endpoints for audit records
- rate limits
- webhook support
- data retention limits
- commercial/API terms
- whether use inside a third-party GP operations dashboard is permitted
- whether pharmacy/medicine/vaccine compliance reporting is allowed under their terms

## Technical architecture

Frontend files:
- `src/services/fridgeMonitorService.js`
- `src/services/easyCloudAdapterService.js`
- `src/data/fridgeDevices.js`

Backend/Supabase Edge Functions planned:
- `supabase/functions/easycloud-sync`
- `supabase/functions/easycloud-device-refresh`
- `supabase/functions/easycloud-alarm-webhook`

Credentials:
- no EasyCloud key or token in `VITE_` variables
- use Supabase Edge Function secrets only
- store integration status and device mappings in tenant-scoped tables

## Database tables planned

- `fridge_devices`
- `fridge_readings`
- `fridge_alerts`
- `fridge_daily_checks`
- `fridge_temperature_excursions`
- `fridge_device_mappings`
- `external_integrations`
- `integration_sync_log`

## Fridge dashboard target features

- vaccine fridge card
- dispensary fridge card
- 24-hour graph
- 7-day trend toggle
- current/min/max temperature
- safe band from 2°C to 8°C
- excursion count
- door/power/alarm status if API supports it
- last synced time
- manual refresh
- record daily check button
- acknowledge excursion workflow
- action guidance when outside safe range
- audit log of acknowledgements
- exportable fridge log

## Fallback while awaiting API access

- manual reading entry
- CSV import placeholder
- mocked EasyCloud sync status
- device mapping UI
- API credentials placeholder page
- awaiting API access banner
