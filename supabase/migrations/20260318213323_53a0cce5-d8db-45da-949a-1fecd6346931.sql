ALTER TABLE public.daily_games ADD COLUMN status_short text NOT NULL DEFAULT 'NS';
ALTER TABLE public.daily_games ADD COLUMN elapsed_minutes integer;