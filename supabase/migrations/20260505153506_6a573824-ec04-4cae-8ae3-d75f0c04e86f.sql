CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  actor_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs (action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit_logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.log_daily_games_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (action, entity, actor_id, payload)
  VALUES (
    CASE WHEN OLD.source = 'manual' THEN 'delete_manual' ELSE 'delete_api' END,
    'daily_games',
    auth.uid(),
    jsonb_build_object(
      'id', OLD.id,
      'date', OLD.date,
      'home_team', OLD.home_team,
      'away_team', OLD.away_team,
      'game_time', OLD.game_time,
      'sport_type', OLD.sport_type,
      'source', OLD.source,
      'external_id', OLD.external_id,
      'channels', OLD.channels
    )
  );
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS daily_games_delete_audit ON public.daily_games;
CREATE TRIGGER daily_games_delete_audit
  AFTER DELETE ON public.daily_games
  FOR EACH ROW EXECUTE FUNCTION public.log_daily_games_delete();

CREATE OR REPLACE FUNCTION public.set_api_sync_paused(_paused boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _affected int := 0;
  _job record;
  _previous text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT value INTO _previous FROM public.settings WHERE key = 'api_sync_paused';

  INSERT INTO public.settings (key, value, is_secret)
  VALUES ('api_sync_paused', CASE WHEN _paused THEN 'true' ELSE 'false' END, false)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

  FOR _job IN
    SELECT jobid, jobname FROM cron.job
    WHERE jobname IN (
      'sync-daily-games-morning',
      'update-live-games-5min',
      'sync-thesportsdb-daily',
      'update-live-thesportsdb'
    )
  LOOP
    PERFORM cron.alter_job(job_id := _job.jobid, active := NOT _paused);
    _affected := _affected + 1;
  END LOOP;

  INSERT INTO public.audit_logs (action, entity, actor_id, payload)
  VALUES (
    CASE WHEN _paused THEN 'api_sync_paused' ELSE 'api_sync_resumed' END,
    'settings',
    auth.uid(),
    jsonb_build_object(
      'previous', _previous,
      'new', CASE WHEN _paused THEN 'true' ELSE 'false' END,
      'jobs_updated', _affected,
      'manual_only_filter_active', _paused
    )
  );

  RETURN jsonb_build_object('paused', _paused, 'jobs_updated', _affected);
END;
$$;