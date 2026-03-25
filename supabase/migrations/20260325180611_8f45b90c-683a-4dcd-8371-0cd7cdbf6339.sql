
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  game_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert push_subscriptions"
  ON public.push_subscriptions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update push_subscriptions"
  ON public.push_subscriptions FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can read push_subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can delete push_subscriptions"
  ON public.push_subscriptions FOR DELETE
  TO public
  USING (true);
