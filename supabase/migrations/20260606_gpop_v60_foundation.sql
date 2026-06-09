-- GPOP v6.0 foundation schema draft
-- Apply only after reviewing RLS, tenancy and deployment requirements.

create table if not exists practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ods_code text,
  tenant_type text default 'practice',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists practice_memberships (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(practice_id, user_id)
);

create table if not exists practice_invites (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  invite_code text not null unique,
  role text,
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists feature_flags (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  flag_key text not null,
  enabled boolean not null default false,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique(practice_id, flag_key)
);

create table if not exists role_dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  role text not null,
  card_key text not null,
  visible boolean not null default true,
  display_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  title text not null,
  document_type text not null,
  linked_module text,
  status text not null default 'pending_review',
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued',
  result jsonb not null default '{}'::jsonb,
  human_review_required boolean not null default true,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists clinical_sources (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid references practices(id) on delete cascade,
  source_organisation text not null,
  source_title text not null,
  source_url text,
  source_type text,
  retrieved_at timestamptz,
  licence_status text default 'unconfirmed',
  created_at timestamptz not null default now()
);

create table if not exists clinical_pathways (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  name text not null,
  category text,
  approval_status text not null default 'prototype',
  clinical_owner text,
  current_version text,
  review_date date,
  live_use_allowed boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clinical_pathway_versions (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references clinical_pathways(id) on delete cascade,
  version text not null,
  source_id uuid references clinical_sources(id),
  content jsonb not null default '{}'::jsonb,
  approval_status text not null default 'draft',
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists clinical_hazard_log (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  hazard_ref text not null,
  title text not null,
  severity text not null,
  mitigation text,
  status text not null default 'open',
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fridge_devices (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  name text not null,
  location text,
  external_device_id text,
  target_min numeric not null default 2,
  target_max numeric not null default 8,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fridge_readings (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  device_id uuid not null references fridge_devices(id) on delete cascade,
  reading_at timestamptz not null,
  temperature numeric not null,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists fridge_alerts (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  device_id uuid references fridge_devices(id) on delete cascade,
  severity text not null,
  status text not null default 'open',
  title text not null,
  detail text,
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  name text not null,
  room_type text,
  capacity integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid,
  room_id uuid references rooms(id),
  role text not null,
  shift_date date not null,
  starts_at time not null,
  ends_at time not null,
  status text not null default 'planned',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rota_alerts (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  shift_date date,
  severity text not null,
  title text not null,
  detail text,
  status text not null default 'open',
  source_record_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists integration_sync_log (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  integration_key text not null,
  status text not null,
  detail text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table practices enable row level security;
alter table profiles enable row level security;
alter table practice_memberships enable row level security;
alter table documents enable row level security;
alter table clinical_pathways enable row level security;
alter table fridge_devices enable row level security;
alter table fridge_readings enable row level security;
alter table shifts enable row level security;
alter table rota_alerts enable row level security;

-- RLS policies intentionally not fully authored here: review with production auth model before applying.
