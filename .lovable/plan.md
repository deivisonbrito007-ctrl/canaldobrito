# Desativar jogos da API (manter só inserções manuais)

## Situação
Hoje a tabela `daily_games` tem 3 origens (`source`):
- `manual`: 956 jogos — 955 com canais ✅
- `thesportsdb`: 187 jogos — só 17 com canais ❌
- `api-football`: 1 jogo — sem canal ❌

Há 3 cron jobs ativos no Postgres puxando das APIs:
- `sync-daily-games-morning` (08:00) — API-Football
- `update-live-games-5min` (a cada 5 min)
- `sync-thesportsdb-daily` (09:00) — TheSportsDB
- `update-live-thesportsdb` (a cada 5 min)

## Solução (desativação reversível)

### 1. Filtrar UI pública: só `source='manual'`
Em `src/hooks/useDailyGames.ts`, adicionar flag `MANUAL_ONLY = true` que aplica `.eq("source", "manual")` em `useDailyGames` e `useAllDailyGames`. Isso esconde imediatamente todos os jogos sem canal vindos da API, sem precisar deletar nada. Para reativar no futuro, basta trocar `MANUAL_ONLY` para `false`.

Vantagem: rápido, reversível, não perde histórico.

### 2. Pausar cron jobs das APIs
Via insert tool (não migration — contém credenciais por instância):
```sql
UPDATE cron.job SET active = false
WHERE jobname IN (
  'sync-daily-games-morning',
  'update-live-games-5min',
  'sync-thesportsdb-daily',
  'update-live-thesportsdb'
);
```
Para reativar: `UPDATE cron.job SET active = true WHERE jobname IN (...)`.

### 3. Limpar lixo já gravado (opcional, recomendado)
Apagar os 188 jogos sem origem manual para o admin não ver mais ruído na aba de gerenciamento:
```sql
DELETE FROM daily_games WHERE source <> 'manual';
```

### 4. Aviso no painel admin (sugestão UX)
Em `src/pages/admin/AdminApiSync.tsx` mostrar um banner amarelo informando que a sincronização automática está pausada e como reativar. Evita que outro admin clique em "Buscar" achando que está quebrado.

## Sugestões adicionais
- **Filtro por canal no parser manual**: já que os canais agora vêm 100% do parser de WhatsApp, vale validar no `ProgramacaoTexto` se cada jogo tem ao menos 1 canal antes de inserir, alertando o admin.
- **Quando reativar a API**: enriquecer `sync-thesportsdb` para *só inserir o jogo se vier com canal BR válido* (descartar resto). Hoje insere mesmo sem canal — daí o problema.
- **Whitelist canais BR**: já existe em `BR_BRAND_PATTERNS`. Quando reativar, fazer o `INSERT` ser condicional a `channels.length > 0`.

## Arquivos a alterar
- `src/hooks/useDailyGames.ts` — adicionar flag `MANUAL_ONLY` e filtro `.eq("source","manual")`.
- `src/pages/admin/AdminApiSync.tsx` — banner de status "API pausada".
- SQL via insert tool: pausar 4 cron jobs + DELETE jogos não-manuais.
