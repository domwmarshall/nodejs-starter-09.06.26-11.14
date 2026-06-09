-- GPOP staff pattern cycles
-- Adds support for weekly, fortnightly and four-week/monthly work patterns.
-- Review before applying in production.

alter table staff_profiles
  add column if not exists work_pattern_cycle_type text not null default 'Weekly',
  add column if not exists work_pattern_cycle_weeks integer not null default 1 check (work_pattern_cycle_weeks in (1, 2, 4)),
  add column if not exists work_pattern_anchor_date date not null default date '2026-04-06',
  add column if not exists work_pattern_notes text;

alter table staff_working_patterns
  add column if not exists cycle_week integer not null default 1 check (cycle_week between 1 and 4),
  add column if not exists pattern_cycle_type text not null default 'Weekly',
  add column if not exists pattern_anchor_date date not null default date '2026-04-06';

create index if not exists idx_staff_working_patterns_cycle
  on staff_working_patterns (practice_id, staff_profile_id, cycle_week, day_of_week, effective_from, effective_to);

-- Production direction:
-- 1. Weekly staff have cycle_week = 1 for each working day.
-- 2. Fortnightly staff use cycle_week = 1 and 2, anchored to work_pattern_anchor_date.
-- 3. Four-week/monthly rota staff use cycle_week = 1..4, anchored to work_pattern_anchor_date.
-- 4. Leave, rota and room allocation logic should resolve a calendar date to the appropriate cycle_week before calculating cover.
