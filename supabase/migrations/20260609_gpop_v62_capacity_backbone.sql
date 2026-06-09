-- GPOP v6.2 Supabase Capacity Backbone
-- Purpose: make staff, rooms, patterns, split sessions, bank/locum sessions,
-- leave/unavailability and care-navigation assignment rules practice-scoped and RLS-ready.
-- Apply in Supabase SQL editor after v6.0/v6.1 migrations. Review policies before production.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Core identity / tenant columns
-- -----------------------------------------------------------------------------
alter table if exists practices
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists status text not null default 'active',
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table if exists profiles
  add column if not exists role_label text,
  add column if not exists last_seen_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists practice_memberships
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists permissions jsonb not null default '{}'::jsonb;

-- Activity table used by the existing frontend activityLogService.
create table if not exists gpop_activity_log (
  id uuid primary key default gen_random_uuid(),
  practice_id text not null default 'demo-practice',
  event_type text not null,
  module text not null,
  title text not null,
  detail text,
  actor_name text,
  actor_role text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Workforce and capacity tables
-- -----------------------------------------------------------------------------
alter table if exists staff_profiles
  add column if not exists profile_payload jsonb not null default '{}'::jsonb,
  add column if not exists skill_tags text[] not null default '{}',
  add column if not exists visible_in_capacity boolean not null default true;

alter table if exists rooms
  add column if not exists equipment_tags text[] not null default '{}',
  add column if not exists room_payload jsonb not null default '{}'::jsonb,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id);

create table if not exists staff_skills (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid not null references staff_profiles(id) on delete cascade,
  skill_key text not null,
  skill_label text not null,
  skill_group text not null default 'Clinical capability',
  can_book_directly boolean not null default false,
  requires_clinician_signoff boolean not null default false,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(practice_id, staff_profile_id, skill_key)
);

create table if not exists working_pattern_sessions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid not null references staff_profiles(id) on delete cascade,
  cycle_type text not null default 'Weekly',
  cycle_week integer not null default 1 check (cycle_week between 1 and 4),
  anchor_date date not null default date '2026-04-06',
  day_of_week integer not null check (day_of_week between 1 and 7),
  day_name text not null,
  session_order integer not null default 1,
  starts_at time,
  ends_at time,
  unpaid_break_minutes integer not null default 0,
  paid_hours numeric(6,2) not null default 0,
  room_id uuid references rooms(id),
  room_name text,
  activity text,
  visible_in_capacity boolean not null default true,
  effective_from date not null default current_date,
  effective_to date,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bank_locum_sessions (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid not null references staff_profiles(id) on delete cascade,
  session_date date not null,
  starts_at time not null,
  ends_at time not null,
  unpaid_break_minutes integer not null default 0,
  paid_hours numeric(6,2) not null default 0,
  room_id uuid references rooms(id),
  room_name text,
  activity text not null default 'Bank / locum session',
  status text not null default 'Planned',
  pay_type text not null default 'Hourly',
  hourly_rate numeric(10,2) not null default 0,
  day_rate numeric(10,2) not null default 0,
  session_cost numeric(10,2) not null default 0,
  funding_source text not null default 'Practice',
  note text,
  visible_in_capacity boolean not null default true,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid references staff_profiles(id) on delete set null,
  staff_name text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'Pending',
  deducted_hours numeric(8,2) not null default 0,
  deduction_breakdown jsonb not null default '[]'::jsonb,
  source text not null default 'GPOP',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists care_nav_assignment_rules (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  pathway_key text not null,
  pathway_label text not null,
  age_band text not null default 'Any',
  sex_context text not null default 'Any',
  default_action text not null,
  primary_skill_key text,
  fallback_skill_key text,
  default_role text,
  urgency text not null default 'Routine',
  prep_action text,
  slot_text text,
  signoff_status text not null default 'Draft',
  clinical_owner text,
  assigned_practitioner_id uuid references staff_profiles(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(practice_id, pathway_key, age_band, sex_context)
);

create table if not exists systmone_capacity_imports (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  source_filename text,
  import_status text not null default 'planned',
  imported_at timestamptz,
  imported_by uuid references auth.users(id),
  row_count integer not null default 0,
  mapping_notes text,
  sample_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Helpful indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_memberships_user_status on practice_memberships(user_id, status);
create index if not exists idx_staff_profiles_practice on staff_profiles(practice_id, display_name);
create index if not exists idx_staff_skills_staff on staff_skills(practice_id, staff_profile_id, skill_key);
create index if not exists idx_working_sessions_capacity on working_pattern_sessions(practice_id, day_of_week, cycle_week, visible_in_capacity);
create index if not exists idx_bank_sessions_date on bank_locum_sessions(practice_id, session_date, status);
create index if not exists idx_leave_range on leave_requests(practice_id, staff_name, start_date, end_date, status);
create index if not exists idx_care_nav_rules on care_nav_assignment_rules(practice_id, pathway_key, signoff_status);
create index if not exists idx_activity_log_practice_created on gpop_activity_log(practice_id, created_at desc);

-- -----------------------------------------------------------------------------
-- RLS helper and policies
-- -----------------------------------------------------------------------------
create or replace function public.gpop_user_is_member(target_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from practice_memberships pm
    where pm.practice_id = target_practice_id
      and pm.user_id = auth.uid()
      and lower(pm.status) in ('active', 'approved', 'signed in / membership pending', 'practice membership pending admin approval')
  );
$$;

create or replace function public.gpop_user_is_manager(target_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from practice_memberships pm
    where pm.practice_id = target_practice_id
      and pm.user_id = auth.uid()
      and lower(pm.status) in ('active', 'approved')
      and pm.role in ('Practice Manager', 'GP Partner', 'PCN Manager')
  );
$$;

alter table practices enable row level security;
alter table profiles enable row level security;
alter table practice_memberships enable row level security;
alter table rooms enable row level security;
alter table staff_profiles enable row level security;
alter table staff_skills enable row level security;
alter table working_pattern_sessions enable row level security;
alter table bank_locum_sessions enable row level security;
alter table leave_requests enable row level security;
alter table care_nav_assignment_rules enable row level security;
alter table systmone_capacity_imports enable row level security;
alter table gpop_activity_log enable row level security;

-- Profiles: users manage their own public app profile.
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Practices: a signed-in user can create a practice in dev, then read/update if member/manager.
drop policy if exists practices_insert_authenticated on practices;
create policy practices_insert_authenticated on practices for insert to authenticated with check (created_by = auth.uid() or created_by is null);
drop policy if exists practices_select_member on practices;
create policy practices_select_member on practices for select to authenticated using (public.gpop_user_is_member(id) or created_by = auth.uid());
drop policy if exists practices_update_manager on practices;
create policy practices_update_manager on practices for update to authenticated using (public.gpop_user_is_manager(id) or created_by = auth.uid()) with check (public.gpop_user_is_manager(id) or created_by = auth.uid());

-- Memberships: users can create/read their own dev membership; managers can read/update memberships at their practice.
drop policy if exists memberships_select_relevant on practice_memberships;
create policy memberships_select_relevant on practice_memberships for select to authenticated using (user_id = auth.uid() or public.gpop_user_is_manager(practice_id));
drop policy if exists memberships_insert_own_dev on practice_memberships;
create policy memberships_insert_own_dev on practice_memberships for insert to authenticated with check (user_id = auth.uid());
drop policy if exists memberships_update_manager on practice_memberships;
create policy memberships_update_manager on practice_memberships for update to authenticated using (public.gpop_user_is_manager(practice_id) or user_id = auth.uid()) with check (public.gpop_user_is_manager(practice_id) or user_id = auth.uid());

-- Generic practice-scoped policies for capacity tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'rooms',
    'staff_profiles',
    'staff_skills',
    'working_pattern_sessions',
    'bank_locum_sessions',
    'leave_requests',
    'care_nav_assignment_rules',
    'systmone_capacity_imports'
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

-- Activity log uses text practice_id in the legacy frontend. Allow authenticated inserts and own-practice reads where possible.
drop policy if exists activity_log_insert_authenticated on gpop_activity_log;
create policy activity_log_insert_authenticated on gpop_activity_log for insert to authenticated with check (true);
drop policy if exists activity_log_select_authenticated on gpop_activity_log;
create policy activity_log_select_authenticated on gpop_activity_log for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- Seed defaults used by GPOP until the UI imports/edits them.
-- -----------------------------------------------------------------------------
comment on table working_pattern_sessions is 'Recurring weekly/fortnightly/four-week split sessions used by the live care-navigation capacity engine.';
comment on table bank_locum_sessions is 'One-off ad hoc sessions for locum GPs, bank HCAs, extra dispensary or reception cover, including cost/wage data.';
comment on table care_nav_assignment_rules is 'Governed local routing rules mapping pathways and context to skills/roles/clinicians. Must be clinically signed off before live use.';
comment on table systmone_capacity_imports is 'Future SystmOne appointment/session import landing table. Do not store patient-identifiable data in early pilots.';

create unique index if not exists ux_rooms_practice_name on rooms(practice_id, lower(name));
create unique index if not exists ux_staff_profiles_practice_display_name on staff_profiles(practice_id, lower(display_name));
