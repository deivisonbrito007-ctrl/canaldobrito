
-- Add is_secret column
ALTER TABLE public.settings ADD COLUMN is_secret boolean NOT NULL DEFAULT false;

-- Drop old permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;

-- New SELECT policy: authenticated admins can read all, others can only read non-secret
CREATE POLICY "Anyone can read non-secret settings"
ON public.settings FOR SELECT TO public
USING (
  is_secret = false
  OR has_role(auth.uid(), 'admin'::app_role)
);
