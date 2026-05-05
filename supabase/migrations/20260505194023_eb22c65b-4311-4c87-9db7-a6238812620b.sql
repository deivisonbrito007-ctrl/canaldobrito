CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event text NOT NULL,
  user_id text,
  session_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  tab text,
  surface text,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_event_created ON public.analytics_events (event, created_at DESC);
CREATE INDEX idx_analytics_events_campaign ON public.analytics_events (utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX idx_analytics_events_user ON public.analytics_events (user_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics_events"
  ON public.analytics_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can read analytics_events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));