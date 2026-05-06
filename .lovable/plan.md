## Objetivo
Limpar resíduos visuais e de código do TheSportsDB. Hoje, mesmo sem a API ativa, dois pontos ainda renderizam placar/status como se viessem dela:

1. **Card público da Programação** (`GameCard.tsx`): se `live_status === "finished"` e houver `home_score`/`away_score` no banco (de quando a API ainda rodava), mostra o placar antigo no lugar do horário.
2. **Admin DailyGamesManager** (linhas 293-300): mostra um bloco rosa `home_score × away_score · status_short` em qualquer jogo que tenha esses campos preenchidos.

Como a API foi desligada, esses dados ficaram congelados e podem aparecer errados — exatamente o que você está vendo.

## O que será feito

**1. `src/components/public/schedule/GameCard.tsx`**
- Remover ramo `(live || game.live_status === "finished") && game.home_score != null && ...` que renderiza `<ScorePill>`.
- Simplificar para sempre mostrar `<TimePill>` (horário do jogo).
- Remover `game.live_status === "finished"` do span de label embaixo do horário; voltar a só "vs".
- Manter `live` (badge AO VIVO) baseado em hora calculada — isso é dinâmico, não vem da API.

**2. `src/components/admin/DailyGamesManager.tsx`**
- Remover o bloco `{game.home_score != null && ...}` (linhas 293-300) que mostra o placar fantasma.

**3. `src/hooks/useDailyGames.ts`**
- **Manter** os campos `external_id`, `home_score`, `away_score`, `live_status`, `live_updated_at` na interface TS (são opcionais, não atrapalham). Tirar agora obrigaria refatorar tipos do Supabase. Custo > benefício.

**4. Migration de limpeza** (`supabase/migrations/...`)
- `UPDATE public.daily_games SET home_score = NULL, away_score = NULL, live_status = NULL, live_updated_at = NULL, external_id = NULL WHERE home_score IS NOT NULL OR away_score IS NOT NULL OR live_status IS NOT NULL OR external_id IS NOT NULL;`
- Resetar `status_short` para `'NS'` onde estiver diferente: `UPDATE public.daily_games SET status_short = 'NS' WHERE status_short <> 'NS';`
- Isso apaga o "lixo" deixado pela API sem mexer em jogos novos manuais.

**5. Secret `THESPORTSDB_KEY`**
- Remover via `secrets--delete_secret`. Não é mais usado por nenhuma function.

## O que NÃO será mexido (segurança)
- Colunas do banco continuam existindo (nullable). Permite reativar placar manual no futuro sem migração de schema.
- Secret `API_FOOTBALL_KEY` fica (você mencionou que pode usar no futuro).
- Nenhuma alteração em LiveNowSection, NextGameHero, hooks de realtime.

## Arquivos afetados
- edit: `src/components/public/schedule/GameCard.tsx`
- edit: `src/components/admin/DailyGamesManager.tsx`
- new migration: limpa colunas `home_score`/`away_score`/`live_status`/`live_updated_at`/`external_id` e reseta `status_short`
- delete secret: `THESPORTSDB_KEY`

## Sugestões para depois (não fazer agora)
1. **Placar manual rápido no admin**: input inline de `home_score`/`away_score` + botão "AO VIVO 45'" que preenche `status_short` e `live_status='live'`. Reaproveita a UI já pronta do GameCard (basta reverter parte do passo 1 quando tiver). Tempo: ~1h.
2. **Importador de placar via print**: usar a function existente `read-schedule-image` apontando pra um print do SofaScore — IA extrai placar e atualiza o jogo. Zero custo de API extra.
3. Quando quiser reativar API: **API-Football** com mapa de league IDs fixo é muito mais previsível que a fuzzy-match da TSDB.

Posso aplicar quando aprovar.