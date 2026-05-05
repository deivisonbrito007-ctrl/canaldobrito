-- Restringir INSERT em analytics_events com whitelist + limites
DROP POLICY IF EXISTS "Anyone can insert analytics_events" ON public.analytics_events;

CREATE POLICY "Public can insert validated analytics_events"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (
  event IN (
    'landing_with_utm',
    'tab_view',
    'link_share',
    'content_card_click'
  )
  AND char_length(event) <= 64
  AND (surface      IS NULL OR char_length(surface)      <= 64)
  AND (tab          IS NULL OR char_length(tab)          <= 32)
  AND (utm_source   IS NULL OR char_length(utm_source)   <= 64)
  AND (utm_medium   IS NULL OR char_length(utm_medium)   <= 64)
  AND (utm_campaign IS NULL OR char_length(utm_campaign) <= 128)
  AND (utm_content  IS NULL OR char_length(utm_content)  <= 128)
  AND (utm_term     IS NULL OR char_length(utm_term)     <= 128)
  AND (user_id      IS NULL OR char_length(user_id)      <= 64)
  AND (session_id   IS NULL OR char_length(session_id)   <= 64)
  AND pg_column_size(props) <= 4096
);

-- Reforçar SELECT apenas para admins (recriar por clareza)
DROP POLICY IF EXISTS "Admins can read analytics_events" ON public.analytics_events;

CREATE POLICY "Only admins can read analytics_events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));