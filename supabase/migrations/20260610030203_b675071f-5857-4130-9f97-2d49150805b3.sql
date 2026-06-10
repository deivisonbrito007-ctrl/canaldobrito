-- 1) Remove public SELECT exposing push subscription credentials
DROP POLICY IF EXISTS "Anyone can read push_subscriptions" ON public.push_subscriptions;

-- Admins can still view subscriptions from the admin panel; edge functions use service_role (bypasses RLS).
CREATE POLICY "Admins can read push_subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Add missing UPDATE policy on storage.objects for the banners bucket (defense in depth)
CREATE POLICY "Admins can update banner files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'::app_role));