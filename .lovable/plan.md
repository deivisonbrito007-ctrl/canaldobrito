## Objetivo

Você continua cadastrando todos os jogos manualmente (banner/parser). A TheSportsDB serve **somente** para enriquecer cada jogo com **placar ao vivo** e **tempo de jogo** (minutos). Sem importar jogos automaticamente.

## Como vai funcionar

1. Você cadastra o jogo normalmente (times, horário, canal).
2. Um job em background tenta achar o evento correspondente na TheSportsDB (por times + data) e salva o `external_id` (`tsdb:<eventId>`) no jogo.
3. A cada ~60s, uma function de "live update" busca placar e minuto dos jogos que estão no ar e atualiza o card.
4. Sugestão de match com 1 clique no admin caso o auto-match falhe (ambíguo / nomes diferentes).

## Mudanças

### Banco
- Adicionar em `daily_games`:
  - `external_id text` (reintroduzir, ex.: `tsdb:1234567`)
  - `home_score int`, `away_score int`
  - `live_status text` (`scheduled` | `live` | `finished`)
  - `live_updated_at timestamptz`
- Índice único parcial em `external_id` (quando não nulo).

### Edge functions
- `tsdb-match-game` — recebe `gameId`, busca eventos do dia (`eventsday.php?d=YYYY-MM-DD&s=Soccer` etc por esporte), faz fuzzy match dos times e grava `external_id` + sugestões.
- `tsdb-live-update` — roda via cron a cada 60s; para todo `daily_games` com `external_id`, `is_live=true` ou janela de ±15min do `game_time`, chama `lookupevent.php?id=<n>` e atualiza placar/minuto/status.
- Reutiliza `THESPORTSDB_KEY` (já existe).

### Admin (DailyGamesManager)
- Badge "Vinculado TSDB ✓" / "Sem vínculo".
- Botão "Buscar placar" (dispara `tsdb-match-game`); se múltiplos candidatos, abre modal para escolher.
- Botão "Desvincular" para limpar `external_id`.

### UI pública
- Card do jogo ao vivo passa a mostrar `home_score x away_score` e o minuto (`45'`, `HT`, `FT`) quando vier da TSDB.
- Mantém o layout/cores atuais; sem placar, mostra só horário (comportamento atual).

## Detalhes técnicos

- Mapeamento esporte → liga TSDB feito por `sport_type` (Soccer, Basketball, MMA, etc.).
- Fuzzy match: normalizar (lowercase, sem acento), comparar `home_team`/`away_team` com `strHomeTeam`/`strAwayTeam`; aceitar match com score ≥ 0.85, senão retornar candidatos.
- Cron: usar `pg_cron` chamando `tsdb-live-update` a cada minuto (limitado à janela de jogos do dia para economizar quota).
- Time zone: comparar datas em `America/Sao_Paulo` antes de pedir `eventsday`.
- Sem CHECK constraints com `now()` — usar trigger se precisar validar.

## Sugestões extras

- **Auto-match no insert**: trigger/edge que tenta vincular logo após o cadastro, sem você clicar.
- **Fallback "ao vivo manual"**: se TSDB não retornar dados em 5 min após o início, manter o card como "AO VIVO" sem placar (não some).
- **Cache TSDB**: cachear `eventsday` por 10 min em `settings` ou KV pra não estourar quota quando vários jogos estiverem rolando.
- **Indicador de "atrasado"**: se `live_updated_at` > 3 min, mostrar pontinho amarelo discreto no card admin.

Posso aplicar?