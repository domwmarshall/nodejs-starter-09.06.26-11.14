-- Staff working pattern breaks and calculated paid hours support
-- v5 adds explicit start/finish/break fields so paid hours can be calculated deterministically.

alter table if exists staff_working_patterns
  add column if not exists start_time time,
  add column if not exists finish_time time,
  add column if not exists unpaid_break_minutes integer not null default 0,
  add column if not exists calculated_paid_hours numeric(5,2);

comment on column staff_working_patterns.start_time is 'Shift start time for this day/cycle week.';
comment on column staff_working_patterns.finish_time is 'Shift finish time for this day/cycle week.';
comment on column staff_working_patterns.unpaid_break_minutes is 'Unpaid break duration deducted from the start/finish duration.';
comment on column staff_working_patterns.calculated_paid_hours is 'Paid hours calculated from finish-start minus unpaid break. Retained for audit/reporting.';
