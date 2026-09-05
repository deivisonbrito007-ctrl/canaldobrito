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
  _old jsonb;
  _new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _payload := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    IF _old = _new THEN
      RETURN NEW;
    END IF;
    IF (_new ? 'active') AND (_old->'active') IS DISTINCT FROM (_new->'active') THEN
      _action := CASE WHEN (_new->>'active')::boolean THEN 'activate' ELSE 'deactivate' END;
    ELSE
      _action := 'update';
    END IF;
    SELECT jsonb_build_object(
      'id', _new->'id',
      'changed', COALESCE(jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value)) FILTER (WHERE n.key IS NOT NULL), '{}'::jsonb)
    )
    INTO _payload
    FROM jsonb_each(_new) n
    LEFT JOIN jsonb_each(_old) o ON o.key = n.key
    WHERE o.value IS DISTINCT FROM n.value
      AND n.key NOT IN ('updated_at', 'live_updated_at', 'elapsed_minutes', 'last_api_sync_at');
    IF _payload IS NULL OR (_payload->'changed') = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  ELSE
    _action := 'delete';
    _payload := to_jsonb(OLD);
  END IF;

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