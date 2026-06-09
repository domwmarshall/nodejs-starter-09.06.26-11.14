# GPOP marketable MVP plan

## Current milestone: v3.0 platform feature milestone

GPOP is now moving from a visual prototype into a marketable operations platform prototype. The current milestone includes functional feature engines across workforce, finance, compliance, training, audits, care navigation and generated operational alerts.

## v3.0 feature engines

### Workforce / HR
- Working-pattern driven holiday calculations.
- Leave cover risk warnings.
- Contract amendment timeline.
- Pay and budget allocation fields.
- Room allocation and conflict detection.

### Finance / dispensary
- Supplier invoice line entry.
- GPP/reimbursement matching.
- Margin and loss calculation.
- Dispensary action queue.
- Dashboard and Inbox finance alerts.

### Compliance
- Policy/SOP creation.
- Review dates and owners.
- Role-targeted acknowledgement matrix.
- Questionnaire builder.
- Dashboard and Inbox compliance alerts.

### Training
- Persistent course library.
- Role-based course requirements.
- Missing-assignment detection.
- Manual assignment workflow.
- Completion/reopen workflow.
- Dashboard and Inbox training alerts.

### Audits
- Persistent audit templates.
- Audit checklist questions.
- Audit completion workflow.
- Action-required submissions.
- Action closure workflow.
- Dashboard and Inbox audit alerts.

### Care Navigation
- Persistent care navigation pathways.
- Draft pathway builder.
- Red-flag prompt builder.
- Clinic/action option builder.
- Red-flag routine booking lock.
- Short booking text generator.
- Longer SystmOne-style note generator.
- Mock note history.

## Production gaps before market launch

The app is still not production-ready until the following are added:

1. Authentication and real users.
2. Database-backed storage.
3. Audit logging for every important action.
4. Organisation/team tenancy model.
5. Permission enforcement server-side.
6. Secure file upload handling.
7. Backups and restore process.
8. Test coverage.
9. Deployment environment.
10. Clinical safety case for care navigation before any live triage use.

## Suggested v3.1 direction

The next milestone should be less about adding more pages and more about production hardening:

- Supabase or hosted Postgres schema.
- Auth and user table.
- Role permissions stored in DB.
- Data migration from localStorage to service abstraction.
- Audit log service.
- Organisation/practice settings table.
- Exportable management reports.
