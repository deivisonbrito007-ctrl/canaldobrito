-- lovable-cron-fallback-reviewed: scheduled publish_at activation needs minute precision (now an in-DB statement, no HTTP); push reminders must fire ~15 min before kickoff and only call out when a game is in the window.
CREATE OR REPLACE FUNCTION public.activate_scheduled_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.banners SET active = true, publish_at = null
  WHERE active = false AND publish_at IS NOT NULL AND publish_at <= now();

  UPDATE public.banners SET active = false
  WHERE active = true AND expires_at IS NOT NULL AND expires_at <= now();

  UPDATE public.daily_games SET active = true, publish_at = null
  WHERE active = false AND archived = false AND publish_at IS NOT NULL AND publish_at <= now();
END;
$$;

REVOKE ALL ON FUNCTION public.activate_scheduled_content() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_job_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM cron.job_run_details WHERE end_time < now() - interval '1 day';
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '90 days';
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_job_logs() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('activate-scheduled-content');
SELECT cron.schedule('activate-scheduled-content', '* * * * *', $$SELECT public.activate_scheduled_content();$$);

SELECT cron.unschedule('send-push-notifications-every-minute');
SELECT cron.schedule(
  'send-push-notifications-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rryvwkqupkhpdlevopkk.supabase.co/functions/v1/send-push-notifications',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyeXZ3a3F1cGtocGRsZXZvcGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTYwMTYsImV4cCI6MjA4OTM3MjAxNn0.2mKBZgS9YdmVXqDk7A_dVvpg8lL30JRxW51zcvKcdT4"}'::jsonb,
    body := '{}'::jsonb
  )
  WHERE EXISTS (
    SELECT 1 FROM public.daily_games g
    WHERE g.active AND NOT g.archived
      AND g.date = (now() AT TIME ZONE 'America/Sao_Paulo')::date
      AND g.game_time >= ((now() AT TIME ZONE 'America/Sao_Paulo') + interval '13 minutes')::time
      AND g.game_time <  ((now() AT TIME ZONE 'America/Sao_Paulo') + interval '18 minutes')::time
  )
  AND EXISTS (SELECT 1 FROM public.push_subscriptions WHERE cardinality(game_ids) > 0);
  $$
);

SELECT cron.schedule('cleanup-job-logs-daily', '30 6 * * *', $$SELECT public.cleanup_job_logs();$$);