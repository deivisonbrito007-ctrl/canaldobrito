
CREATE OR REPLACE FUNCTION public.check_alias_collision(
  _alias text,
  _exclude_mapping_id uuid DEFAULT NULL
)
RETURNS TABLE (
  collision_type text,
  mapping_id uuid,
  mapping_name text,
  conflicting_value text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _norm text;
BEGIN
  _norm := lower(regexp_replace(unaccent(coalesce(_alias, '')), '[^a-z0-9]+', '', 'g'));
  IF _norm = '' THEN
    RETURN;
  END IF;

  -- Colisão com nome principal de outro mapping
  RETURN QUERY
  SELECT 'name'::text, m.id, m.name, m.name
  FROM public.channel_logo_mappings m
  WHERE m.name_normalized = _norm
    AND (_exclude_mapping_id IS NULL OR m.id <> _exclude_mapping_id)
  LIMIT 1;

  -- Colisão com alias existente em outro mapping
  RETURN QUERY
  SELECT 'alias'::text, a.mapping_id, m.name, a.alias
  FROM public.channel_aliases a
  JOIN public.channel_logo_mappings m ON m.id = a.mapping_id
  WHERE a.alias_normalized = _norm
    AND (_exclude_mapping_id IS NULL OR a.mapping_id <> _exclude_mapping_id)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_alias_collision(text, uuid) TO anon, authenticated;
