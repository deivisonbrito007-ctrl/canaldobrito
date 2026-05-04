## Objetivo

Integrar a **API-Football** (chave `API_FOOTBALL_KEY` já configurada no Lovable Cloud) para popular automaticamente os jogos de futebol em `daily_games`, **complementando** o parser manual de WhatsApp — que continua sendo a fonte para os outros 13 esportes.

## Como vai funcionar

```text
                          ┌──────────────────────────┐
   API-Football  ───────► │ edge: fetch-games        │ ──► daily_games
   (futebol BR)           │  (1x/dia, 06:00 BRT)     │     (sport_type='football',
                          └──────────────────────────┘      source='api-football')

                          ┌──────────────────────────┐
   API-Football  ───────► │ edge: update-live-games  │ ──► UPDATE is_live,
   (live status)          │  (a cada 5 min)          │     status_short,
                          └──────────────────────────┘     elapsed_minutes

   WhatsApp paste ──────► ProgramacaoTexto (parser) ──► daily_games
                                                        (13 esportes restantes)
```

Dedup é feito pela chave existente `gameKey` (home+away+horário+data) — então se o admin colar manualmente um jogo que a API já trouxe, será ignorado.

## Mudanças no banco

1. Coluna nova em `daily_games`:
   - `source text not null default 'manual'` — valores: `'manual'` (parser WhatsApp) ou `'api-football'`.
   - `external_id text` — id do fixture na API-Football, para updates idempotentes.
   - Índice único parcial: `(external_id) where external_id is not null`.
2. Habilitar extensões `pg_cron` e `pg_net`.
3. Cron jobs (criados via insert SQL com a anon key, não como migration):
   - `fetch-games-daily` — todo dia às 09:00 UTC (06:00 BRT).
   - `update-live-games` — a cada 5 minutos.

## Edge Functions novas

### `supabase/functions/fetch-games/index.ts`
- Lê `API_FOOTBALL_KEY` do env.
- Busca fixtures do dia em ligas brasileiras configuráveis (Brasileirão Série A/B, Copa do Brasil, Libertadores, Sul-Americana — IDs no topo do arquivo, fáceis de editar).
- Mapeia para o schema `daily_games`: `home_team`, `away_team`, `game_time` (convertido para America/Sao_Paulo), `competition`, `channels` (vazio — admin completa), `sport_type='football'`, `source='api-football'`, `external_id=fixture.id`.
- UPSERT por `external_id` para evitar duplicatas em re-execuções.
- Aceita `?date=YYYY-MM-DD` para rodar manualmente; default = hoje em BRT.
- `verify_jwt = false` (chamada por cron) + valida um header `x-cron-secret` opcional.

### `supabase/functions/update-live-games/index.ts`
- Busca apenas fixtures `live=all` da API-Football.
- Para cada um com `external_id` correspondente em `daily_games`, atualiza `is_live`, `status_short` (`1H`/`HT`/`2H`/`FT`…), `elapsed_minutes`.
- Sem inserts — só updates.

### Reuso do tipo existente
Nada muda em `useDailyGames`/`gameUtils` — os jogos novos aparecem naturalmente nas seções (`LiveEventsSection`, `DailyGamesSection`, hero, etc) porque `sport_type='football'` já é tratado.

## Painel admin

Nova aba **"Sync API"** em `/admin` (`src/pages/admin/AdminApiSync.tsx`):
- Botão "Buscar jogos de hoje" e "Buscar de uma data" → chama `fetch-games` via `supabase.functions.invoke`.
- Botão "Atualizar status ao vivo agora" → chama `update-live-games`.
- Mostra resultado (quantos inseridos, atualizados, ignorados).
- Lista as últimas execuções (lendo `daily_games` filtrado por `source='api-football'`).
- Toggle por liga (quais IDs sincronizar) — salvo em `settings` com chave `api_football_leagues`.

## Como o GitHub entra nisso

Não é preciso "comando" `npx supabase`: a Lovable faz commit+deploy automático. Após aprovar o plano:
1. Edge functions deployam sozinhas no save.
2. Migration de coluna+extensões roda via tool de migration (com sua aprovação).
3. Cron jobs são inseridos via SQL (também com aprovação).
4. O commit aparece no GitHub conectado em segundos. Para confirmar, abra `/admin/diagnostico-github` ou veja o repositório.

## Detalhes técnicos

- **Time zone**: API-Football aceita `timezone=America/Sao_Paulo` no query string — uso isso, sem conversões manuais.
- **Rate limit**: plano gratuito = 100 req/dia. Fetch diário (1 req) + live a cada 5 min entre 12h–02h BRT (≈170 req) **estoura o limite grátis**. Mitigação: live só roda se `(SELECT count(*) FROM daily_games WHERE date = today AND sport_type='football') > 0` E dentro da janela 12h–02h BRT, e só atualiza fixtures cujo horário já passou. Se ainda estourar, ajustamos para 10 min.
- **Validação de input**: ambas as functions validam `?date` com Zod (`YYYY-MM-DD`).
- **CORS**: padrão Lovable.
- **Sem segredos novos**: `API_FOOTBALL_KEY` já existe.

## Fora de escopo

- PandaScore e BallDontLie (outros secrets já configurados): não tocamos agora — quando quiser cobrir e-sports/NBA via API, abrimos plano separado.
- Substituir o parser de WhatsApp: continua sendo a fonte para os 13 esportes não-futebol.
