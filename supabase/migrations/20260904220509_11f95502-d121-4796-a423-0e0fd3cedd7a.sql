-- Função genérica de auditoria para inserções e edições relevantes
CREATE OR REPLACE FUNCTION public.log_content_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _action text;
  _payload jsonb;
  _entity text := TG_TABLE_NAME;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _payload := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Ignora updates sem mudança real
    IF to_jsonb(OLD) = to_jsonb(NEW) THEN
      RETURN NEW;
    END IF;
    IF OLD.active IS DISTINCT FROM NEW.active THEN
      _action := CASE WHEN NEW.active THEN 'activate' ELSE 'deactivate' END;
    ELSE
      _action := 'update';
    END IF;
    -- Guarda só o que mudou (antes/depois), mais o id
    SELECT jsonb_build_object(
      'id', NEW.id,
      'changed', COALESCE(jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value)) FILTER (WHERE n.key IS NOT NULL), '{}'::jsonb)
    )
    INTO _payload
    FROM jsonb_each(to_jsonb(NEW)) n
    LEFT JOIN jsonb_each(to_jsonb(OLD)) o ON o.key = n.key
    WHERE o.value IS DISTINCT FROM n.value
      AND n.key NOT IN ('updated_at', 'live_updated_at', 'elapsed_minutes');
    IF _payload IS NULL OR (_payload->'changed') = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  ELSE
    _action := 'delete';
    _payload := to_jsonb(OLD);
  END IF;

  -- Nunca grava valores de settings secretas
  IF _entity = 'settings' THEN
    IF (TG_OP = 'DELETE' AND OLD.is_secret) OR (TG_OP <> 'DELETE' AND NEW.is_secret) THEN
      _payload := jsonb_build_object('key', COALESCE(NEW.key, OLD.key), 'secret', true);
    END IF;
  END IF;

  INSERT INTO public.audit_logs (action, entity, actor_id, payload)
  VALUES (_action, _entity, auth.uid(), COALESCE(_payload, '{}'::jsonb));

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_content_change() FROM PUBLIC;

-- daily_games: já tem trigger de delete; adiciona insert/update
DROP TRIGGER IF EXISTS daily_games_change_audit ON public.daily_games;
CREATE TRIGGER daily_games_change_audit
AFTER INSERT OR UPDATE ON public.daily_games
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- Conteúdo editorial
DROP TRIGGER IF EXISTS banners_change_audit ON public.banners;
CREATE TRIGGER banners_change_audit
AFTER INSERT OR UPDATE OR DELETE ON public.banners
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

DROP TRIGGER IF EXISTS daily_banner_change_audit ON public.daily_banner;
CREATE TRIGGER daily_banner_change_audit
AFTER INSERT OR UPDATE OR DELETE ON public.daily_banner
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

DROP TRIGGER IF EXISTS featured_movies_change_audit ON public.featured_movies;
CREATE TRIGGER featured_movies_change_audit
AFTER INSERT OR UPDATE OR DELETE ON public.featured_movies
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

DROP TRIGGER IF EXISTS featured_series_change_audit ON public.featured_series;
CREATE TRIGGER featured_series_change_audit
AFTER INSERT OR UPDATE OR DELETE ON public.featured_series
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

DROP TRIGGER IF EXISTS news_releases_change_audit ON public.news_releases;
CREATE TRIGGER news_releases_change_audit
AFTER INSERT OR UPDATE OR DELETE ON public.news_releases
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

DROP TRIGGER IF EXISTS channel_logo_mappings_change_audit ON public.channel_logo_mappings;
CREATE TRIGGER channel_logo_mappings_change_audit
AFTER INSERT OR UPDATE OR DELETE ON public.channel_logo_mappings
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

DROP TRIGGER IF EXISTS settings_change_audit ON public.settings;
CREATE TRIGGER settings_change_audit
AFTER INSERT OR UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- Índices para os filtros da tela de auditoria
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_action_idx ON public.audit_logs (entity, action);

-- Endurece funções SECURITY DEFINER criadas anteriormente (linter)
REVOKE ALL ON FUNCTION public.merge_channel_mappings(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reorder_channel_mappings(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_channel_mappings(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_channel_mappings(uuid[]) TO authenticated;