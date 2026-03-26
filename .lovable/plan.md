

## Problema: jogos agendados nao aparecem na tab Amanha

### Causa raiz

O `AdminWhatsApp.tsx` usa o hook `useDailyGames` (linha 135-136), que filtra por `active=true` e `archived=false`. Jogos agendados com `publish_at` futuro tem `active=false` ate a Edge Function `activate-scheduled` os ativar. Por isso nao aparecem na tab Amanha.

### Correcao

**Arquivo:** `src/pages/admin/AdminWhatsApp.tsx`

Trocar `useDailyGames` por `useAllDailyGames` nas linhas 135-136. O hook `useAllDailyGames` ja existe em `useDailyGames.ts` e busca todos os jogos da data sem filtrar por `active` ou `archived`.

Depois, filtrar no `buildDayText` para excluir apenas os `archived=true` (jogos deletados), mas incluir os `active=false` (agendados).

Alteracoes:
1. Importar `useAllDailyGames` em vez de `useDailyGames`
2. Trocar as chamadas nas linhas 135-136 para `useAllDailyGames(todayStr)` e `useAllDailyGames(tomorrowStr)`
3. No `buildDayText`, filtrar `games.filter(g => !g.archived)` para nao incluir arquivados

### Resultado esperado
- Jogos agendados (com `publish_at` futuro, `active=false`) aparecerao na tab Amanha
- Jogos arquivados continuam excluidos
- O admin pode copiar a programacao completa mesmo antes da ativacao automatica

