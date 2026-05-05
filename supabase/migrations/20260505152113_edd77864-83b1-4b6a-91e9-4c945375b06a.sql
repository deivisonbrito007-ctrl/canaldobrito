DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_key_unique') THEN
    ALTER TABLE public.settings ADD CONSTRAINT settings_key_unique UNIQUE (key);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_api_sync_paused(_paused boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _affected int := 0;
  _job record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

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

  RETURN jsonb_build_object('paused', _paused, 'jobs_updated', _affected);
END;
$$;

REVOKE ALL ON FUNCTION public.set_api_sync_paused(boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.set_api_sync_paused(boolean) TO authenticated;