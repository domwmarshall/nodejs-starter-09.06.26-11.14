-- GPOP v6.2.1 Sync Tools Patch
-- Purpose: make Access → Seed / upsert reliable from a clean Supabase project.
-- Run after the v6.2 capacity backbone migration.

create unique index if not exists ux_rooms_practice_id_name
on public.rooms (practice_id, name);

create unique index if not exists ux_staff_profiles_practice_id_display_name
on public.staff_profiles (practice_id, display_name);

create unique index if not exists ux_staff_skills_practice_staff_skill
on public.staff_skills (practice_id, staff_profile_id, skill_key);

create unique index if not exists ux_care_nav_assignment_rule_scope
on public.care_nav_assignment_rules (practice_id, pathway_key, age_band, sex_context);

alter table if exists rooms
  add column if not exists updated_at timestamptz not null default now();

alter table if exists staff_profiles
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz not null default now();

-- Development helper note:
-- reset/reseed is performed through authenticated RLS policies in the app;
-- no service-role key should be placed in the frontend.
