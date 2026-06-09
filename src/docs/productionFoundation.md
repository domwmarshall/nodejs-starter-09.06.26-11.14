# GPOP v4.0 Production Foundation

GPOP v4.0 is the first production-foundation release. It does not migrate all app data into Supabase yet. Instead, it establishes the adapter layer and proves live database connectivity through activity logging.

## Added in v4.0

- Supabase client service
- Database connection status checker
- Activity log service with localStorage fallback
- Settings database panel
- Activity log viewer
- Write test log action
- Database schema SQL
- Supabase setup documentation
- Initial audit/activity logging from core actions

## Why activity logging first?

Activity logging is the safest first live table because it is append-only, low-risk and useful across the whole product. It proves the database works without risking the current localStorage feature data.

## Next database migration order

1. Practice settings
2. Users, roles and permissions
3. Workforce profiles and leave requests
4. Compliance policies and acknowledgements
5. Training records
6. Audit templates and submissions
7. Finance and dispensary invoice data
8. Care navigation pathways and saved notes

## Production gates still required

- Real authentication
- Tenant/practice isolation
- Authenticated RLS policies
- Database backups
- Audit retention policy
- Secure file upload handling
- Server-side validation
- Clinical safety governance for care navigation
- Test suite and CI build checks
