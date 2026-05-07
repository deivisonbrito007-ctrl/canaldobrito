CREATE OR REPLACE FUNCTION public.reorder_channel_mappings(_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.channel_logo_mappings cm
  SET sort_order = sub.idx,
      updated_at = now()
  FROM (SELECT unnest(_ids) AS id, generate_subscripts(_ids, 1) - 1 AS idx) sub
  WHERE cm.id = sub.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reorder_channel_mappings(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_channel_mappings(uuid[]) TO authenticated;