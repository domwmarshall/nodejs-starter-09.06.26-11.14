-- Staff import metadata support
-- Adds explicit source/import fields for workforce data migrated from CSV or HR exports.

alter table if exists staff_profiles
  add column if not exists import_source text,
  add column if not exists source_record_date date,
  add column if not exists role_needs_confirmation boolean not null default false,
  add column if not exists team_needs_confirmation boolean not null default false;

alter table if exists staff_working_patterns
  add column if not exists source_label text,
  add column if not exists source_paid_hours_text text;

comment on column staff_profiles.import_source is 'Source file/system used when importing or seeding staff data.';
comment on column staff_profiles.source_record_date is 'Date associated with the source staff/work-pattern export.';
comment on column staff_profiles.role_needs_confirmation is 'True where role was not present in the import and must be confirmed by an administrator.';
comment on column staff_profiles.team_needs_confirmation is 'True where team/cover group was not present in the import and must be confirmed by an administrator.';
comment on column staff_working_patterns.source_label is 'Source file/system label for the imported working pattern row.';
comment on column staff_working_patterns.source_paid_hours_text is 'Original paid-hours text from source export, retained for audit/reconciliation.';
