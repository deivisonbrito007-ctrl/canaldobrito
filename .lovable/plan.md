## Objetivo
Remover por completo a integração com TheSportsDB (matching automático + atualização de placares ao vivo), voltando ao fluxo 100% manual que estava funcionando antes — sem quebrar nada do app.

## O que será removido

**1. Edge Functions**
- Deletar `supabase/functions/tsdb-match-game/`
- Deletar `supabase/functions/tsdb-live-update/`
- Chamar `supabase--delete_edge_functions` para `["tsdb-match-game", "tsdb-live-update"]` para tirar do servidor.

**2. Cron job no banco (migration nova)**
- Rodar `SELECT cron.unschedule('tsdb-live-update-every-min');` para parar o disparo automático a cada minuto.

**3. Frontend — `src/components/admin/DailyGamesManager.tsx`**
- Remover `handleMatchTSDB`, `handleUnlinkTSDB`, `handleMatchAllPending`.
- Remover botão "Vincular dia (TSDB)" do header.
- Remover badge "TSDB", botões de vincular/desvincular e ícone `Link2` da linha de cada jogo.

**4. Frontend — `src/hooks/useDailyGames.ts`**
- Remover o bloco de auto-vínculo em background dentro de `useInsertDailyGames` (chamadas a `tsdb-match-game` e `tsdb-live-update`).

## O que NÃO será mexido (segurança)

- **Colunas da tabela `daily_games`** (`external_id`, `home_score`, `away_score`, `live_status`, `live_updated_at`) ficam onde estão. Já estão tipadas em `useDailyGames.ts` e podem ser referenciadas em outros componentes (Hero, GameCard etc.). Removê-las exigiria refatoração ampla e poderia quebrar telas — manter como nullable e simplesmente parar de popular é mais seguro.
- **Secret `THESPORTSDB_KEY`** fica no Vault (inofensivo, ninguém vai mais ler).
- Nenhuma alteração em `useRealtimeDailyGames`, `LiveNowSection`, `DailyGamesSection`, `ScheduleTab` — eles continuam funcionando lendo o que o admin inserir manualmente.
- Memória do projeto (`mem://features/thesportsdb-integration`) será atualizada para refletir que a integração foi descontinuada.

## Arquivos afetados
- delete: `supabase/functions/tsdb-match-game/index.ts`
- delete: `supabase/functions/tsdb-live-update/index.ts`
- new migration: unschedule do cron
- edit: `src/components/admin/DailyGamesManager.tsx`
- edit: `src/hooks/useDailyGames.ts`
- edit: `mem://features/thesportsdb-integration` + `mem://index.md`

## Sugestões para o futuro (não fazer agora)
1. **Placar manual rápido**: campo inline no admin (`home_score` / `away_score` + botão "AO VIVO 45'") usando as colunas que ficaram. Você atualiza em 5s sem depender de API.
2. **Importador de print**: usar a function existente `read-schedule-image` (Lovable AI Vision) para ler placar de print do SofaScore/Globo — zero custo extra, zero dependência de API instável.
3. Se um dia quiser reativar uma API, **API-Football** (você já tem `API_FOOTBALL_KEY` configurada) tem matching por ID de liga muito mais previsível que a TSDB.
