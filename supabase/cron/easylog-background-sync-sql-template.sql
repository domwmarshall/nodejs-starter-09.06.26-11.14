-- GPOP v6.3.4 EasyLog background sync SQL template.
-- Prefer the Supabase Dashboard Cron Jobs UI where possible.
-- This file is deliberately NOT in supabase/migrations because it contains project-specific placeholders.

-- This SQL route uses pg_cron + pg_net to call the easycloud-sync Edge Function.
-- Replace YOUR_PROJECT_REF and YOUR_SUPABASE_FUNCTION_AUTH_TOKEN before running.
-- Prefer storing the auth token in Supabase Vault rather than hard-coding it.

-- create extension if not exists pg_cron with schema extensions;
-- create extension if not exists pg_net with schema extensions;

-- select cron.schedule(
--   'gpop-easylog-background-refresh-every-5-minutes',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/easycloud-sync',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_SUPABASE_FUNCTION_AUTH_TOKEN'
--     ),
--     body := jsonb_build_object('action', 'cron-refresh-all')
--   );
--   $$
-- );

-- To remove later:
-- select cron.unschedule('gpop-easylog-background-refresh-every-5-minutes');
