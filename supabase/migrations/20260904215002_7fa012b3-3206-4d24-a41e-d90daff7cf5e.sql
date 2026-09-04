ALTER TABLE public.channel_logo_mappings
  ADD COLUMN IF NOT EXISTS channel_type text NOT NULL DEFAULT 'outro',
  ADD COLUMN IF NOT EXISTS primary_color text;

ALTER TABLE public.channel_logo_mappings
  DROP CONSTRAINT IF EXISTS channel_logo_mappings_channel_type_check;
ALTER TABLE public.channel_logo_mappings
  ADD CONSTRAINT channel_logo_mappings_channel_type_check
  CHECK (channel_type IN ('tv_aberta','tv_fechada','streaming','youtube','ppv','outro'));

ALTER TABLE public.channel_logo_mappings
  DROP CONSTRAINT IF EXISTS channel_logo_mappings_primary_color_check;
ALTER TABLE public.channel_logo_mappings
  ADD CONSTRAINT channel_logo_mappings_primary_color_check
  CHECK (primary_color IS NULL OR primary_color ~* '^#[0-9a-f]{6}$');

-- Mescla um canal duplicado em outro: move apelidos, regrava jogos e remove o duplicado
CREATE OR REPLACE FUNCTION public.merge_channel_mappings(_source_id uuid, _target_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _src record;
  _tgt record;
  _updated integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _source_id = _target_id THEN
    RAISE EXCEPTION 'source and target must differ';
  END IF;
  SELECT * INTO _src FROM public.channel_logo_mappings WHERE id = _source_id;
  SELECT * INTO _tgt FROM public.channel_logo_mappings WHERE id = _target_id;
  IF _src IS NULL OR _tgt IS NULL THEN
    RAISE EXCEPTION 'mapping not found';
  END IF;

  -- Move apelidos (ignora colisões)
  UPDATE public.channel_aliases a
  SET mapping_id = _target_id
  WHERE a.mapping_id = _source_id
    AND NOT EXISTS (
      SELECT 1 FROM public.channel_aliases b
      WHERE b.mapping_id = _target_id AND b.alias_normalized = a.alias_normalized
    );
  DELETE FROM public.channel_aliases WHERE mapping_id = _source_id;

  -- Nome antigo vira apelido do destino
  INSERT INTO public.channel_aliases (mapping_id, alias, alias_normalized)
  SELECT _target_id, _src.name, _src.name_normalized
  WHERE NOT EXISTS (
    SELECT 1 FROM public.channel_aliases WHERE mapping_id = _target_id AND alias_normalized = _src.name_normalized
  ) AND _src.name_normalized <> _tgt.name_normalized;

  -- Regrava canais nos jogos
  UPDATE public.daily_games g
  SET channels = (
    SELECT array_agg(DISTINCT CASE WHEN lower(regexp_replace(unaccent(c), '[^a-z0-9]+', '', 'gi')) = _src.name_normalized THEN _tgt.name ELSE c END)
    FROM unnest(g.channels) AS c
  )
  WHERE EXISTS (
    SELECT 1 FROM unnest(g.channels) AS c
    WHERE lower(regexp_replace(unaccent(c), '[^a-z0-9]+', '', 'gi')) = _src.name_normalized
  );
  GET DIAGNOSTICS _updated = ROW_COUNT;

  DELETE FROM public.channel_logo_mappings WHERE id = _source_id;

  INSERT INTO public.audit_logs (action, entity, actor_id, payload)
  VALUES ('merge', 'channel_logo_mappings', auth.uid(),
    jsonb_build_object('source', _src.name, 'target', _tgt.name, 'games_updated', _updated));

  RETURN _updated;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.merge_channel_mappings(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_channel_mappings(uuid, uuid) TO authenticated, service_role;