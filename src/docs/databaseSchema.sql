-- GPOP v4.0 production foundation schema
-- Run this first in Supabase SQL Editor for the initial database-backed activity log.

create table if not exists public.gpop_activity_log (
  id uuid primary key default gen_random_uuid(),
  practice_id text not null default 'demo-practice',
  event_type text not null,
  module text not null,
  title text not null,
  detail text,
  actor_name text,
  actor_role text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.gpop_activity_log enable row level security;

drop policy if exists "Allow prototype activity log insert" on public.gpop_activity_log;
drop policy if exists "Allow prototype activity log read" on public.gpop_activity_log;

create policy "Allow prototype activity log insert"
on public.gpop_activity_log
for insert
to anon
with check (practice_id = 'demo-practice');

create policy "Allow prototype activity log read"
on public.gpop_activity_log
for select
to anon
using (practice_id = 'demo-practice');

create index if not exists gpop_activity_log_created_at_idx
on public.gpop_activity_log (created_at desc);

create index if not exists gpop_activity_log_module_idx
on public.gpop_activity_log (module);

-- Future production tables to add after authentication and tenant isolation:
-- public.practices
-- public.profiles
-- public.roles
-- public.permissions
-- public.workforce_profiles
-- public.working_patterns
-- public.leave_requests
-- public.rooms
-- public.room_blocks
-- public.policies
-- public.policy_questions
-- public.policy_acknowledgements
-- public.training_courses
-- public.training_records
-- public.audit_templates
-- public.audit_submissions
-- public.supplier_invoice_lines
-- public.dispensing_reimbursement_lines
-- public.care_navigation_pathways
-- public.care_navigation_notes
