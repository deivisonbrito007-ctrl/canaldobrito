-- Create watch_progress table for Continue Watching feature
CREATE TABLE IF NOT EXISTS public.watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('movie', 'series', 'tv')),
  title text NOT NULL,
  poster_url text,
  backdrop_url text,
  rating numeric(3,1),
  year integer,
  genre text,
  overview text,
  progress_seconds integer DEFAULT 0,
  duration_seconds integer DEFAULT 3600,
  is_finished boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, content_id)
);

ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own watch progress
CREATE POLICY "Users can read own watch_progress"
ON public.watch_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own watch progress
CREATE POLICY "Users can insert own watch_progress"
ON public.watch_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own watch progress
CREATE POLICY "Users can update own watch_progress"
ON public.watch_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own watch progress
CREATE POLICY "Users can delete own watch_progress"
ON public.watch_progress
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);