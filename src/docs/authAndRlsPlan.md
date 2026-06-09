# GPOP Auth, Tenant and RLS Plan

GPOP must move from fake role switching to Supabase Auth, tenant-scoped practices and Row Level Security.

## Core tables

- `practices`
- `profiles`
- `practice_memberships`
- `practice_invites`
- `roles`
- `permissions`
- `feature_flags`
- `dashboard_preferences`
- `gpop_activity_log`

## Tenant-scoped requirements

Every operational table should include:
- `practice_id`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

Users should see only records for practices where they have an approved membership. PCN/ICB roles may later require aggregated/read-only access, but this should not be overbuilt until real requirements are agreed.

## Sign-up flow

1. User signs up through Supabase Auth.
2. User creates a profile.
3. User creates a practice or joins using an invite code.
4. Membership is pending until admin approval.
5. Approved membership grants role/permission access.
6. Activity log records actor user ID, role and practice ID.
