CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('tsdb-live-update-every-min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'tsdb-live-update-every-min',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url:='https://rryvwkqupkhpdlevopkk.supabase.co/functions/v1/tsdb-live-update',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyeXZ3a3F1cGtocGRsZXZvcGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTYwMTYsImV4cCI6MjA4OTM3MjAxNn0.2mKBZgS9YdmVXqDk7A_dVvpg8lL30JRxW51zcvKcdT4"}'::jsonb,
    body:='{}'::jsonb
  );
  $cron$
);