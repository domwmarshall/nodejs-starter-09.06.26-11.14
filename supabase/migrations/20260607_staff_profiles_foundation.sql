-- GPOP staff profile foundation
-- Review before applying. Designed for tenant-scoped Supabase storage of staff records.

create table if not exists staff_profiles (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  display_name text not null,
  role text not null,
  team text,
  employment_status text not null default 'Active',
  contract_type text not null default 'Permanent',
  start_date date,
  line_manager text,
  primary_room text,
  secondary_room text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff_contacts (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid not null references staff_profiles(id) on delete cascade,
  work_email text,
  personal_email text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(staff_profile_id)
);

create table if not exists staff_contracts (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid not null references staff_profiles(id) on delete cascade,
  pay_type text not null default 'Hourly',
  hourly_rate numeric not null default 0,
  annual_salary numeric not null default 0,
  day_rate numeric not null default 0,
  holiday_weeks numeric not null default 5.6,
  works_bank_holidays boolean not null default false,
  nhs_pension_member boolean not null default true,
  pension_scheme text default 'NHS Pension',
  pension_status text default 'Enrolled',
  funding_source text not null default 'Practice',
  funding_percent numeric not null default 100,
  arrs_claimable_percent numeric not null default 0,
  funding_notes text,
  effective_from date not null default current_date,
  effective_to date,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff_working_patterns (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid not null references staff_profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 1 and 7),
  day_name text not null,
  hours numeric not null default 0,
  shift_label text,
  starts_at time,
  ends_at time,
  effective_from date not null default current_date,
  effective_to date,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff_compliance_records (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid not null references staff_profiles(id) on delete cascade,
  dbs_status text default 'Not recorded',
  dbs_renewal_date date,
  professional_registration text,
  registration_expiry date,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(staff_profile_id)
);

create table if not exists staff_profile_audit_log (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  staff_profile_id uuid references staff_profiles(id) on delete set null,
  event_type text not null,
  event_title text not null,
  before_value jsonb,
  after_value jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table staff_profiles enable row level security;
alter table staff_contacts enable row level security;
alter table staff_contracts enable row level security;
alter table staff_working_patterns enable row level security;
alter table staff_compliance_records enable row level security;
alter table staff_profile_audit_log enable row level security;

-- Recommended RLS direction:
-- 1. Users can read staff records for practices where they have an active practice_memberships row.
-- 2. Users with Practice Manager / GP Partner admin permissions can insert/update/delete staff records.
-- 3. Operational staff can read their own profile and selected rota-visible fields only.
-- 4. Every write to staff_profiles/staff_contracts/staff_working_patterns should also insert staff_profile_audit_log.
