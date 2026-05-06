DO $$
BEGIN
  PERFORM cron.unschedule('tsdb-live-update-every-min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;