SELECT cron.alter_job(jobid, active := false)
FROM cron.job
WHERE jobname IN (
  'sync-daily-games-morning',
  'update-live-games-5min',
  'sync-thesportsdb-daily',
  'update-live-thesportsdb'
);