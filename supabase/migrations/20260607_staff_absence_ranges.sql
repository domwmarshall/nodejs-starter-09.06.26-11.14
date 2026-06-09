-- GPOP v7 staff absence ranges and calculated deductions
-- Draft migration for Supabase. Apply only after reviewing existing table names/RLS.

alter table if exists leave_requests
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists deducted_hours numeric(8,2),
  add column if not exists deducted_shifts numeric(8,2),
  add column if not exists deduction_breakdown jsonb default '[]'::jsonb,
  add column if not exists source text,
  add column if not exists source_imported_at date,
  add column if not exists source_requested_date date,
  add column if not exists source_unit text,
  add column if not exists source_allowance_used numeric(8,2),
  add column if not exists requires_deduction_recalculation boolean default false;

alter table if exists staff_working_patterns
  add column if not exists unpaid_break_minutes integer default 0,
  add column if not exists calculated_paid_hours numeric(8,2);

create table if not exists staff_absence_import_batches (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid,
  source_filename text not null,
  imported_at timestamptz not null default now(),
  imported_by uuid,
  rows_imported integer not null default 0,
  rows_requiring_recalculation integer not null default 0,
  notes text
);
