## Endurecer RLS da tabela `analytics_events`

### Situação atual

```
SELECT  → authenticated + has_role(admin)   ✅ já restrito a admins
INSERT  → public, WITH CHECK (true)         ⚠️ qualquer um insere qualquer coisa
UPDATE  → bloqueado                         ✅
DELETE  → bloqueado                         ✅
```

A leitura no painel já é só admin (ok). O ponto fraco é o INSERT totalmente aberto: qualquer pessoa com a anon key consegue gravar eventos arbitrários (qualquer `event`, `surface`, `user_id`, payloads gigantes, etc.), o que polui as métricas e pode inflar custo/storage.

Não dá para exigir login no INSERT (visitantes anônimos precisam emitir `landing_with_utm` / `tab_view`), então a estratégia é **manter o INSERT público, porém com validação rígida via `WITH CHECK`** + limites de tamanho.

### Migração SQL

```sql
-- 1) Substituir a policy de INSERT por uma versão validada
DROP POLICY "Anyone can insert analytics_events" ON public.analytics_events;

CREATE POLICY "Public can insert validated analytics_events"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (
  -- Whitelist de eventos que o frontend realmente emite
  event IN (
    'landing_with_utm',
    'tab_view',
    'link_share',
    'link_share_copy',
    'link_share_open'
  )
  -- Limites de tamanho para evitar abuso/poluição
  AND char_length(event)              <= 64
  AND (surface       IS NULL OR char_length(surface)       <= 64)
  AND (tab           IS NULL OR char_length(tab)           <= 32)
  AND (utm_source    IS NULL OR char_length(utm_source)    <= 64)
  AND (utm_medium    IS NULL OR char_length(utm_medium)    <= 64)
  AND (utm_campaign  IS NULL OR char_length(utm_campaign)  <= 128)
  AND (utm_content   IS NULL OR char_length(utm_content)   <= 128)
  AND (utm_term      IS NULL OR char_length(utm_term)      <= 128)
  AND (user_id       IS NULL OR char_length(user_id)       <= 64)
  AND (session_id    IS NULL OR char_length(session_id)    <= 64)
  -- Limita tamanho do JSON props (≈ 4 KB)
  AND pg_column_size(props) <= 4096
);

-- 2) Reforçar a policy de SELECT para deixar explícito (já está ok, recriada por clareza)
DROP POLICY "Admins can read analytics_events" ON public.analytics_events;

CREATE POLICY "Only admins can read analytics_events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
```

UPDATE/DELETE permanecem sem policy → continuam bloqueados para todos os roles não-service (admin do painel pode usar a UI; service role bypassa RLS para manutenção).

### Pontos verificados no frontend

- `src/lib/analytics.ts` emite os eventos `landing_with_utm`, `tab_view` e `link_share` (via `trackShare`) — todos cobertos pela whitelist.
- O painel `AdminAnalytics` lê `analytics_events` autenticado como admin → cai na nova policy de SELECT sem mudança.

### Sem mudanças de código no app

A migração é puramente SQL. Nenhum arquivo TS/TSX precisa ser editado.

### Observação de segurança

- Insert público é uma escolha consciente para rastreio anônimo. A whitelist + limites mitigam abuso, mas não impedem totalmente um atacante de scriptar eventos válidos. Se você quiser ir além no futuro, posso (a) mover o INSERT para uma edge function pública com rate-limit por IP, ou (b) usar Turnstile/reCAPTCHA antes de gravar. Diga se quer planejar isso.
