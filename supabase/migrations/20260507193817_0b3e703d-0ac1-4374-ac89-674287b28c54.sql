-- Backfill: split canais combinados com '/', ',' ou '|' em entradas individuais
UPDATE public.daily_games
SET channels = (
  SELECT ARRAY(
    SELECT trim(part)
    FROM unnest(channels) AS c,
         LATERAL regexp_split_to_table(c, '\s*[,/|]\s*') AS part
    WHERE trim(part) <> ''
  )
)
WHERE EXISTS (
  SELECT 1 FROM unnest(channels) c WHERE c ~ '[,/|]'
);