

# Situacao Atual e Plano de Protecao

## Diagnostico

| Data | Status |
|------|--------|
| 24/03 | **0 jogos** — apagados pela versao antiga da Edge Function (irrecuperavel) |
| 25/03 | **17 jogos** inativos — agendados para ativar as 00:00 BRT (03:00 UTC) |

A correcao de timezone ja aplicada impede que isso se repita. Os jogos de 25/03 estao seguros.

## Plano: Soft Delete para protecao futura

### 1. Adicionar coluna `archived` na tabela `daily_games`
- `archived boolean default false`
- Jogos arquivados ficam invisiveis na pagina publica mas continuam no banco

### 2. Atualizar Edge Function `activate-scheduled`
- Trocar `DELETE` por `UPDATE SET archived = true` para jogos > 2 dias
- Manter hard delete apenas para jogos > 30 dias (limpeza final)
- Assim, jogos apagados por engano podem ser recuperados pelo admin

### 3. Atualizar hook `useDailyGames`
- Query publica: adicionar `.eq("archived", false)`
- Query admin (`useAllDailyGames`): mostrar todos, com badge "Arquivado" nos antigos

### 4. Botao "Desarquivar" no admin
- No `DailyGamesManager`, jogos arquivados aparecem com opacity reduzida e botao para reativar

### 5. Ativar jogos de hoje (25/03) manualmente agora
- Executar UPDATE para setar `active = true` e `publish_at = null` nos 17 jogos de 25/03, sem esperar o cron

## Arquivos modificados
- Migration SQL: coluna `archived`, default false
- `supabase/functions/activate-scheduled/index.ts`: soft delete
- `src/hooks/useDailyGames.ts`: filtro archived
- `src/components/admin/DailyGamesManager.tsx`: UI para arquivados

