# GPOP Data Model Blueprint v1

## Purpose

This document defines the future database structure for GPOP: General Practice Operations Portal.

The current app is a React/Vite browser prototype using mock data and localStorage. This blueprint describes the tables/entities needed when the app moves to a real database, user authentication and multi-user production use.

No patient-identifiable data should be used until authentication, role permissions, audit logging, hosting, DPIA and information governance are complete.

---

# 1. Core principles

## 1.1 Data safety

GPOP should separate:

- Practice operational data
- Staff/HR data
- Finance data
- Compliance data
- Clinical governance data
- Patient-identifiable data

Patient-identifiable data should be avoided unless there is a clear approved purpose, secure hosting, access control and audit logging.

## 1.2 Auditability

Important actions should create an audit log entry, including:

- Who made the change
- What changed
- When it changed
- Which module it affected
- Old value
- New value
- Related record ID

## 1.3 Role-based access

Every user should have a role. Roles should control:

- Which modules they can see
- Which records they can view
- Which actions they can perform
- Whether they can approve, edit, delete or configure

## 1.4 Version control

Controlled content should be versioned, including:

- Policies
- SOPs
- Training requirements
- Audit templates
- Care navigation pathways
- Red-flag prompts
- Clinical routing rules

---

# 2. Database tables

## 2.1 users

Stores app login users.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| email | text | Unique login email |
| display_name | text | User-facing name |
| staff_profile_id | uuid | Links to staff_profiles where applicable |
| role_id | uuid | Links to roles |
| status | text | active, disabled, invited |
| last_login_at | datetime | Last login timestamp |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 2.2 roles

Defines user roles.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Practice Manager, GP Partner, Reception etc |
| description | text | Role purpose |
| is_admin | boolean | Admin-level role |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

Example roles:

- Practice Manager
- GP Partner
- Salaried GP
- Registrar
- Practice Nurse
- HCA
- Dispenser
- Pharmacist
- Reception / Care Navigator
- Admin

---

## 2.3 role_permissions

Controls what each role can do.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| role_id | uuid | Links to roles |
| module_key | text | dashboard, staff, finance etc |
| can_view | boolean | Can see module |
| can_create | boolean | Can create records |
| can_edit | boolean | Can edit records |
| can_delete | boolean | Can delete records |
| can_approve | boolean | Can approve records |
| can_configure | boolean | Can change module settings |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 2.4 staff_profiles

Stores staff details.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| full_name | text | Staff name |
| role_title | text | Job title |
| team | text | Clinical, admin, dispensary etc |
| contracted_hours | decimal | Weekly contracted hours |
| working_pattern | json | Structured working pattern |
| holiday_entitlement_hours | decimal | Annual leave entitlement |
| start_date | date | Employment start date |
| status | text | active, leaver, suspended |
| line_manager_id | uuid | Links to staff_profiles |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 2.5 leave_requests

Stores annual leave and absence requests.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| staff_profile_id | uuid | Links to staff_profiles |
| request_type | text | annual leave, medical appointment, unpaid leave etc |
| start_date | date | First day |
| end_date | date | Last day |
| hours_requested | decimal | Total hours |
| reason | text | Optional reason |
| status | text | pending, approved, rejected, cancelled |
| requested_by_user_id | uuid | User who submitted |
| approved_by_user_id | uuid | User who approved/rejected |
| decision_note | text | Optional decision note |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 2.6 modules

Stores system modules.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| module_key | text | dashboard, staff, finance etc |
| name | text | Display name |
| description | text | Module purpose |
| enabled | boolean | Whether module is switched on |
| data_risk | text | low, medium, high |
| governance_status | text | prototype, approved, review required |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 2.7 app_settings

Stores practice-wide settings.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| practice_name | text | Practice display name |
| system_name | text | Short system name |
| system_full_name | text | Long system name |
| holiday_year_start | text | Example: 01 April |
| holiday_year_end | text | Example: 31 March |
| data_mode | text | Dummy data only, production etc |
| admin_contact | text | Main admin contact |
| prototype_warning | text | Global warning text |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

# 3. Inbox and alerts

## 3.1 inbox_items

Stores generated or manual alerts.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | text | Alert title |
| module_key | text | Related module |
| item_type | text | policy review, training, audit etc |
| priority | text | low, medium, high |
| status | text | open, snoozed, done |
| assigned_to_user_id | uuid | Optional assigned user |
| assigned_to_staff_id | uuid | Optional assigned staff |
| due_date | date | Due date |
| description | text | Alert detail |
| action_label | text | Suggested action |
| related_record_type | text | policy, training_record etc |
| related_record_id | uuid | Linked record |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 3.2 reminders

Stores planned reminder rules.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| module_key | text | Related module |
| reminder_type | text | policy review, training expiry etc |
| days_before_due | integer | Reminder offset |
| enabled | boolean | Whether rule is active |
| escalation_role_id | uuid | Optional escalation role |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

# 4. Compliance

## 4.1 policies

Stores controlled documents.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Policy/SOP name |
| category | text | Governance category |
| owner_staff_id | uuid | Policy owner |
| version | text | Current version |
| status | text | draft, approved, due soon, overdue, retired |
| risk | text | low, medium, high |
| summary | text | Short summary |
| document_url | text | Link to stored document |
| last_reviewed_date | date | Last review |
| next_review_date | date | Next review |
| approval_required | boolean | Whether formal approval needed |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 4.2 policy_versions

Stores version history.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| policy_id | uuid | Links to policies |
| version | text | Version number |
| document_url | text | Stored file/link |
| change_summary | text | What changed |
| approved_by_user_id | uuid | Approver |
| approved_at | datetime | Approval timestamp |
| created_at | datetime | Created timestamp |

---

## 4.3 policy_acknowledgements

Stores staff acknowledgements.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| policy_id | uuid | Links to policies |
| policy_version_id | uuid | Version acknowledged |
| staff_profile_id | uuid | Staff member |
| status | text | pending, acknowledged, failed questionnaire |
| questionnaire_score | integer | Optional score |
| acknowledged_at | datetime | Timestamp |
| created_at | datetime | Created timestamp |

---

## 4.4 policy_questions

Stores policy knowledge-check questions.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| policy_id | uuid | Links to policies |
| question_text | text | Question |
| answer_type | text | yes/no, multiple choice, free text |
| correct_answer | text | Optional expected answer |
| required | boolean | Must answer |
| active | boolean | In use |
| created_at | datetime | Created timestamp |

---

# 5. Training

## 5.1 training_courses

Stores mandatory training courses.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Course name |
| category | text | Safeguarding, IG etc |
| renewal_months | integer | Renewal period |
| owner_staff_id | uuid | Course owner |
| risk | text | low, medium, high |
| status | text | active, retired |
| description | text | Course purpose |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 5.2 training_course_roles

Maps courses to roles.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| training_course_id | uuid | Links to training_courses |
| role_id | uuid | Links to roles |
| required | boolean | Required for role |
| created_at | datetime | Created timestamp |

---

## 5.3 training_records

Stores completion evidence.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| training_course_id | uuid | Links to training_courses |
| staff_profile_id | uuid | Staff member |
| status | text | complete, due soon, overdue |
| completed_date | date | Completion date |
| expiry_date | date | Expiry date |
| evidence_url | text | Certificate/evidence |
| notes | text | Optional |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

# 6. Audits

## 6.1 audit_templates

Stores audit/check templates.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Template name |
| category | text | Premises, medicines, safety etc |
| frequency | text | Daily, weekly, monthly, annual |
| assigned_team | text | Nursing, dispensary, admin etc |
| owner_staff_id | uuid | Owner |
| risk | text | low, medium, high |
| status | text | active, retired |
| next_due_date | date | Next due date |
| description | text | Purpose |
| required_evidence | text | Evidence requirement |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 6.2 audit_template_questions

Stores checklist questions.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| audit_template_id | uuid | Links to audit_templates |
| question_text | text | Question |
| response_type | text | yes/no, text, number, temperature etc |
| required | boolean | Whether required |
| sort_order | integer | Display order |
| active | boolean | In use |
| created_at | datetime | Created timestamp |

---

## 6.3 audit_submissions

Stores completed audits.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| audit_template_id | uuid | Template used |
| completed_by_user_id | uuid | User completing |
| completed_by_staff_id | uuid | Staff profile |
| completed_at | datetime | Completion timestamp |
| result | text | completed, action required, failed |
| issues_found | boolean | Any issues |
| action_required | text | Action summary |
| created_at | datetime | Created timestamp |

---

## 6.4 audit_submission_answers

Stores individual audit answers.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| audit_submission_id | uuid | Links to audit_submissions |
| audit_template_question_id | uuid | Question |
| answer_value | text | Answer |
| created_at | datetime | Created timestamp |

---

# 7. Finance

## 7.1 expected_payments

Stores expected income.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| source | text | Global Sum, GPP, CQRS etc |
| category | text | Core NHS, dispensary, claims etc |
| expected_date | date | Expected date |
| expected_amount | decimal | Expected payment |
| received_amount | decimal | Received amount |
| status | text | expected, received, part received, overdue |
| note | text | Notes |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 7.2 finance_tasks

Stores finance action queue.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | text | Task title |
| area | text | Claims, payroll, dispensary etc |
| owner_staff_id | uuid | Owner |
| due_date | date | Due date |
| priority | text | low, medium, high |
| status | text | open, snoozed, done |
| note | text | Details |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 7.3 supplier_invoices

Stores supplier invoice metadata.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| supplier_name | text | Supplier |
| invoice_number | text | Invoice ref |
| invoice_month | text | Period |
| invoice_date | date | Invoice date |
| total_amount | decimal | Total |
| file_url | text | Uploaded invoice |
| status | text | awaiting upload, uploaded, parsed, reconciled |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 7.4 supplier_invoice_lines

Stores invoice line items.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| supplier_invoice_id | uuid | Links to supplier_invoices |
| drug_name | text | Drug/item name |
| pack_size | text | Pack details |
| quantity | decimal | Quantity purchased |
| unit_cost | decimal | Cost per unit |
| total_cost | decimal | Line total |
| created_at | datetime | Created timestamp |

---

## 7.5 dispensary_profit_lines

Stores profitability calculations.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| period | text | Month/period |
| item_name | text | Drug/item |
| supplier_cost | decimal | Purchase cost |
| reimbursement | decimal | Payment/reimbursement |
| margin | decimal | Profit/loss |
| status | text | positive, review, action required |
| note | text | Action note |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 7.6 budget_allocations

Stores budget splits.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| area | text | Staff group/cost area |
| budget | text | Practice, ARRS, dispensary etc |
| monthly_cost | decimal | Monthly cost |
| reclaimable_amount | decimal | Reclaimable |
| status | text | core cost, reclaimable, review |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

# 8. Care Navigation

## 8.1 care_navigation_pathways

Stores care navigation pathways.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Pathway name |
| version | text | Current version |
| status | text | draft, approved, locked, retired |
| risk | text | low, medium, high |
| source | text | NICE, NHS.uk, ICB/local guidance |
| owner_staff_id | uuid | Clinical owner |
| review_status | text | Review state |
| last_reviewed_date | date | Last review |
| next_review_date | date | Next review |
| description | text | Pathway purpose |
| created_at | datetime | Created timestamp |
| updated_at | datetime | Updated timestamp |

---

## 8.2 care_navigation_pathway_versions

Stores pathway version history.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| pathway_id | uuid | Links to pathways |
| version | text | Version |
| change_summary | text | What changed |
| approved_by_user_id | uuid | Approver |
| approved_at | datetime | Approval timestamp |
| active | boolean | Current active version |
| created_at | datetime | Created timestamp |

---

## 8.3 care_navigation_questions

Stores pathway questions.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| pathway_version_id | uuid | Links to pathway version |
| question_text | text | Reception-facing question |
| question_type | text | duration, yes/no, text, red flag etc |
| red_flag | boolean | Whether red flag |
| required | boolean | Must ask |
| sort_order | integer | Display order |
| created_at | datetime | Created timestamp |

---

## 8.4 care_navigation_actions

Stores pathway actions.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| pathway_version_id | uuid | Links to pathway version |
| action_label | text | Same-day GP, nurse, pharmacy etc |
| action_type | text | appointment, sample, image link, emergency etc |
| requires_clinical_approval | boolean | Whether sign-off needed |
| sort_order | integer | Display order |
| created_at | datetime | Created timestamp |

---

## 8.5 care_navigation_notes

Stores completed care navigation notes.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| pathway_id | uuid | Pathway used |
| pathway_version_id | uuid | Version used |
| created_by_user_id | uuid | User who created |
| contact_type | text | Telephone / reception |
| presenting_request | text | Patient request summary |
| duration | text | Duration |
| known_issue | text | Yes/no/not known |
| selected_action | text | Chosen routing/action |
| supporting_action | text | Image link, sample pot etc |
| red_flag_summary | text | Summary |
| additional_notes | text | Notes |
| generated_note | text | SystmOne-ready text |
| created_at | datetime | Timestamp |

Important: do not store patient-identifiable information in this table until IG approval, DPIA, access control, secure hosting and audit logging are complete.

---

# 9. System audit logs

## 9.1 audit_logs

Stores system-level audit trail.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | User who acted |
| module_key | text | Affected module |
| action | text | create, update, delete, approve, login etc |
| record_type | text | Table/entity |
| record_id | uuid | Affected record |
| old_value | json | Previous value |
| new_value | json | New value |
| ip_address | text | Optional |
| user_agent | text | Optional |
| created_at | datetime | Timestamp |

---

# 10. Suggested implementation order

## Phase 1: Local prototype

Already underway.

- React/Vite app
- Mock data
- localStorage persistence
- Module pages
- Prototype warnings

## Phase 2: Local database development

Recommended next technical step.

Possible options:

- SQLite
- Supabase local development
- Prisma with SQLite
- Drizzle ORM with SQLite

Suggested first database-backed modules:

1. Staff profiles
2. Leave requests
3. Modules/settings
4. Inbox items
5. Audit logs

## Phase 3: Authentication

Add user accounts and login.

Minimum required features:

- User login
- User role
- Protected routes
- Admin-only settings
- Disabled users cannot log in

## Phase 4: Production database

Move to hosted PostgreSQL.

Possible platforms:

- Supabase
- Neon
- Azure PostgreSQL
- Render PostgreSQL
- Railway PostgreSQL

## Phase 5: Production hardening

Required before real use:

- Role-based access control
- Audit logs
- Backups
- Error logging
- Monitoring
- Secure hosting
- DPIA
- Information governance review
- Clinical safety review for care navigation
- Data retention policy
- Disaster recovery plan

---

# 11. Immediate next build recommendation

The next practical development step should be:

1. Create database schema from this blueprint.
2. Start with non-clinical, low-risk tables.
3. Convert localStorage modules gradually.
4. Keep care navigation as prototype-only until governance is complete.

Recommended first real database tables:

- users
- roles
- role_permissions
- staff_profiles
- leave_requests
- modules
- app_settings
- audit_logs

These create the foundation for safe multi-user operation.