# Plano: Corrigir canais de transmissão (TheSportsDB Premium)

## Problema
Logs confirmam o sintoma: no feed diário (`eventstv.php?d=DATA`) só aparecem 1-3 canais BR por dia entre 35-49 eventos. A API Premium tem os dados — só não estão sendo buscados nem aceitos corretamente.

Três causas combinadas:
1. **Endpoint errado**: usamos só o feed diário, que é incompleto. O endpoint por evento (`lookuptv.php?id=ID`) tem muito mais cobertura BR.
2. **Filtro estreito demais**: descartamos canais marcados como "World" (NBA League Pass, MLB.tv, F1 TV, UFC Fight Pass, DAZN, Disney+, Max) que são válidos para o Brasil.
3. **Overrides genéricos**: `competition_pattern` aplica o mesmo canal para todos os jogos da competição (ex: SBT cai em 3 jogos da Libertadores ao mesmo tempo).

## Solução

### 1. Sync com lookup por evento (`sync-thesportsdb`)
Para cada evento que passa no `league_allowlist`:
- Buscar canais via `lookuptv.php?id={idEvent}` (1 chamada por jogo, com cache em memória durante a execução).
- Mesclar com o feed diário (união, dedup).
- Normalizar nomes: `HBO Max BR`→`Max`, `Disney Plus`→`Disney+`, `ESPN Brasil`→`ESPN`, etc.

### 2. Whitelist global de canais (nova tabela `channel_whitelist`)
Substitui o filtro hardcoded "só BR". Aceita:
- Canais com `strCountry = Brazil`
- Canais explicitamente listados (ex: NBA League Pass, MLB.tv, F1 TV Pro, UFC Fight Pass, DAZN, Disney+, Max, Paramount+, Apple TV+, Prime Video) mesmo quando vêm como "World".
- Editável pelo admin.

### 3. Overrides por partida (`broadcast_overrides`)
Adicionar colunas:
- `home_team_pattern text`
- `away_team_pattern text`
- `event_date date` (opcional, para um jogo específico)

Lógica de aplicação (em ordem de prioridade): partida específica > times > competição. Um override de partida específica **substitui** os canais; overrides de competição apenas **complementam**.

### 4. Diagnóstico no Admin
Em `AdminCanais` / `AdminSyncStats`, mostrar para cada jogo:
- Origem dos canais: `feed | lookup | override-match | override-competition`
- Botão "Re-sincronizar este jogo" (chama `lookuptv.php` sob demanda).

## Arquivos

**Migração SQL** (nova):
- `CREATE TABLE channel_whitelist (id, channel_name, country, active, notes)` + RLS admin/public-read.
- Seed com ~15 canais globais válidos no BR.
- `ALTER TABLE broadcast_overrides ADD COLUMN home_team_pattern, away_team_pattern, event_date`.

**Edge function** `supabase/functions/sync-thesportsdb/index.ts`:
- Substituir filtro fixo por consulta a `channel_whitelist`.
- Após filtrar eventos pelo allowlist, fazer `lookuptv.php` por evento (Promise.all em lotes de 10).
- Aplicar normalização de nomes (mapa hardcoded pequeno).
- Aplicar overrides na ordem partida > times > competição.
- Retornar metadata de origem por jogo (gravar em `daily_games.channels_source` — nova coluna jsonb opcional).

**Frontend admin**:
- `src/pages/admin/AdminCanaisWhitelist.tsx` (CRUD da nova tabela).
- Atualizar `AdminCanais.tsx` para suportar os novos campos de override por partida.
- `AdminSyncStats.tsx`: coluna de origem dos canais.
- Rota nova em `src/App.tsx` + item no `AdminLayout.tsx`.

## Custo de API
~50 jogos/dia × 3 dias = 150 chamadas extras de `lookuptv.php` por execução do cron (1×/dia). Bem dentro dos limites do plano Premium.

## Resultado esperado
- Maioria dos jogos passa a ter canal correto vindo do lookup por evento.
- Canais globais (NBA League Pass, F1 TV, etc.) deixam de ser descartados.
- Overrides manuais ficam precisos por partida — fim do "SBT em 3 jogos ao mesmo tempo".
- Admin consegue auditar de onde veio cada canal.