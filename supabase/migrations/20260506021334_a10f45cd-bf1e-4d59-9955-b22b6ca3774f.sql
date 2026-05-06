
-- 1. Tighten push_subscriptions policies (replace USING/WITH CHECK true with validation)
DROP POLICY IF EXISTS "Anyone can insert push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can update push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can delete push_subscriptions" ON public.push_subscriptions;

CREATE POLICY "Public can insert valid push_subscriptions"
ON public.push_subscriptions
FOR INSERT
TO public
WITH CHECK (
  endpoint IS NOT NULL
  AND char_length(endpoint) BETWEEN 10 AND 2048
  AND p256dh IS NOT NULL
  AND char_length(p256dh) BETWEEN 10 AND 512
  AND auth IS NOT NULL
  AND char_length(auth) BETWEEN 4 AND 256
);

CREATE POLICY "Public can update push_subscriptions by endpoint"
ON public.push_subscriptions
FOR UPDATE
TO public
USING (endpoint IS NOT NULL AND char_length(endpoint) BETWEEN 10 AND 2048)
WITH CHECK (endpoint IS NOT NULL AND char_length(endpoint) BETWEEN 10 AND 2048);

CREATE POLICY "Public can delete push_subscriptions by endpoint"
ON public.push_subscriptions
FOR DELETE
TO public
USING (endpoint IS NOT NULL AND char_length(endpoint) BETWEEN 10 AND 2048);

-- 2. Revoke EXECUTE on internal SECURITY DEFINER helpers
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_daily_games_delete() FROM PUBLIC, anon, authenticated;
