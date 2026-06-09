# GPOP v4.0 Supabase Setup

## 1. Required environment variables

Add these to `.env` in StackBlitz or your local Vite environment:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

Do not put the service-role key in a Vite/React frontend.

## 2. Install client

The project expects:

```bash
npm install @supabase/supabase-js
```

## 3. Create the first table

Open Supabase SQL Editor and run `src/docs/databaseSchema.sql`.

The first live-backed table is:

```txt
gpop_activity_log
```

## 4. What is live in v4.0

- Settings database status check
- Activity log viewer
- Write test log button
- Leave request logging
- Leave approval/rejection logging
- Contract amendment logging
- Workforce reset logging
- Module toggle logging

## 5. Fallback behaviour

If Supabase is not configured, unavailable, or the RLS/table setup is wrong, the app continues using localStorage and stores activity in:

```txt
gpop-activity-log
```

## 6. Production warning

The current prototype policy allows anonymous read/insert for `demo-practice` only. Replace this with authenticated row-level policies before any real deployment.
