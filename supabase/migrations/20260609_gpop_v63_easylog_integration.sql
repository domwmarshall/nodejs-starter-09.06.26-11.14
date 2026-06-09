-- GPOP v6.3 EasyLog / EasyCloud Integration Foundation
-- Run after v6.2 and v6.2.1 migrations.
-- API secrets are intentionally NOT stored in public tables.

-- Strengthen fridge device register for EasyLog mapping.
alter table fridge_devices add column if not exists external_mac_address text;
alter table fridge_devices add column if not exists external_location_guid text;
alter table fridge_devices add column if not exists device_type text;
alter table fridge_devices add column if not exists current_temperature numeric;
alter table fridge_devices add column if not exists current_reading_at timestamptz;
alter table fridge_devices add column if not exists last_communication_at timestamptz;
alter table fridge_devices add column if not exists last_synced_at timestamptz;
alter table fridge_devices add column if not exists rssi integer;
alter table fridge_devices add column if not exists battery_level integer;
alter table fridge_devices add column if not exists connection_lost boolean not null default false;
alter table fridge_devices add column if not exists in_alarm integer not null default 0;
alter table fridge_devices add column if not exists sync_status text not null default 'manual';
alter table fridge_devices add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table fridge_readings add column if not exists raw_payload jsonb not null default '{}'::jsonb;
alter table fridge_readings add column if not exists received_at timestamptz;

alter table fridge_alerts add column if not exists external_event_id text;
alter table fridge_alerts add column if not exists raw_payload jsonb not null default '{}'::jsonb;

create table if not exists easylog_integration_settings (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  enabled boolean not null default false,
  mode text not null default 'edge-function',
  base_url text not null default 'https://apiwww.easylogcloud.com',
  user_guid_hint text,
  last_diagnostics_at timestamptz,
  last_successful_sync_at timestamptz,
  status text not null default 'not configured',
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists easylog_device_mappings (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  fridge_device_id uuid references fridge_devices(id) on delete cascade,
  easylog_device_guid text not null,
  mac_address text,
  easylog_location_guid text,
  device_name text,
  device_type text,
  active boolean not null default true,
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fridge_daily_checks (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  device_id uuid not null references fridge_devices(id) on delete cascade,
  check_date date not null default current_date,
  min_temperature numeric,
  max_temperature numeric,
  current_temperature numeric,
  power_status text,
  checked_by uuid references auth.users(id),
  checked_by_name text,
  check_status text not null default 'recorded',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists fridge_temperature_excursions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  device_id uuid references fridge_devices(id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  min_temperature numeric,
  max_temperature numeric,
  trigger_source text not null default 'easylog',
  status text not null default 'open',
  action_taken text,
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_fridge_devices_practice_external_device_id
  on fridge_devices(practice_id, external_device_id);
create unique index if not exists ux_fridge_devices_practice_name
  on fridge_devices(practice_id, name);
create unique index if not exists ux_fridge_readings_practice_device_time_source
  on fridge_readings(practice_id, device_id, reading_at, source);
create unique index if not exists ux_fridge_alerts_practice_external_event
  on fridge_alerts(practice_id, external_event_id);
create unique index if not exists ux_easylog_settings_practice
  on easylog_integration_settings(practice_id);
create unique index if not exists ux_easylog_mapping_practice_guid
  on easylog_device_mappings(practice_id, easylog_device_guid);
create unique index if not exists ux_fridge_daily_check_practice_device_date
  on fridge_daily_checks(practice_id, device_id, check_date);

create index if not exists idx_fridge_devices_practice_active on fridge_devices(practice_id, active, name);
create index if not exists idx_fridge_readings_device_time on fridge_readings(practice_id, device_id, reading_at desc);
create index if not exists idx_fridge_alerts_status on fridge_alerts(practice_id, status, created_at desc);
create index if not exists idx_integration_sync_log_easylog on integration_sync_log(practice_id, integration_key, started_at desc);

alter table fridge_devices enable row level security;
alter table fridge_readings enable row level security;
alter table fridge_alerts enable row level security;
alter table integration_sync_log enable row level security;
alter table easylog_integration_settings enable row level security;
alter table easylog_device_mappings enable row level security;
alter table fridge_daily_checks enable row level security;
alter table fridge_temperature_excursions enable row level security;

-- Add practice-scoped policies. These reuse the v6.2 membership helpers.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'fridge_devices',
    'fridge_readings',
    'fridge_alerts',
    'integration_sync_log',
    'easylog_integration_settings',
    'easylog_device_mappings',
    'fridge_daily_checks',
    'fridge_temperature_excursions'
  ] loop
    execute format('drop policy if exists %I_select_member on %I', table_name, table_name);
    execute format('create policy %I_select_member on %I for select to authenticated using (public.gpop_user_is_member(practice_id))', table_name, table_name);
    execute format('drop policy if exists %I_insert_member on %I', table_name, table_name);
    execute format('create policy %I_insert_member on %I for insert to authenticated with check (public.gpop_user_is_member(practice_id))', table_name, table_name);
    execute format('drop policy if exists %I_update_manager on %I', table_name, table_name);
    execute format('create policy %I_update_manager on %I for update to authenticated using (public.gpop_user_is_manager(practice_id)) with check (public.gpop_user_is_manager(practice_id))', table_name, table_name);
    execute format('drop policy if exists %I_delete_manager on %I', table_name, table_name);
    execute format('create policy %I_delete_manager on %I for delete to authenticated using (public.gpop_user_is_manager(practice_id))', table_name, table_name);
  end loop;
end $$;

comment on table easylog_integration_settings is 'Practice-level EasyLog integration settings. Do not store API tokens here; use Supabase Edge Function secrets.';
comment on table easylog_device_mappings is 'Maps EasyLog Cloud device GUIDs/MAC addresses to GPOP fridge devices.';
comment on table fridge_daily_checks is 'Manual daily cold-chain checks and evidence log, retained as fallback even when EasyLog sync is enabled.';
comment on table fridge_temperature_excursions is 'Temperature excursions requiring acknowledgement and action documentation.';
