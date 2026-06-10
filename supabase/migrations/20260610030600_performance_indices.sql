-- Add index on watch_progress(updated_at DESC) for Continue Watching queries
CREATE INDEX IF NOT EXISTS watch_progress_updated_at_idx
  ON public.watch_progress (updated_at DESC);

-- Add composite index on daily_games for active listing queries:
-- WHERE date = ? AND active = true/archived = false
CREATE INDEX IF NOT EXISTS daily_games_listing_idx
  ON public.daily_games (date, active, archived);