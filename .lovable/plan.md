

## Problema: Jogo de amanhã aparece como "Ao Vivo"

### Diagnóstico

O screenshot mostra **00:04** no relógio. O jogo tem horário **00:00** e provavelmente foi cadastrado com a data de **hoje** (26/03). A função `isGameCurrentlyLive("00:00", "2026-03-26")` retorna `true` porque 4 minutos se passaram desde o início — dentro da duração de 105min do futebol.

O Google mostra "Amanhã, 00:00" porque ele considera o contexto do dia anterior, mas no sistema o jogo está com a data correta (dia 26).

Além disso, o `useAllDailyGames` não filtra por `active: true`, então jogos desativados também podem aparecer como ao vivo.

### Solução

Duas correções:

#### 1. `src/components/public/LiveNowHero.tsx` — Filtrar jogos inativos
Na linha 228, adicionar filtro por `active`:
```ts
const all = (allGames || []).filter((g) => !g.archived && g.active);
```

#### 2. Verificar dados do jogo
O jogo provavelmente está com a data correta (hoje) e horário 00:00. Se o jogo realmente é amanhã, a data no banco precisa ser corrigida para 27/03 no painel admin.

**Nota:** Não é um bug de lógica — a função `isGameCurrentlyLive` está funcionando corretamente. Um jogo com data de hoje e horário 00:00, acessado às 00:04, **é** ao vivo pela lógica do sistema. A solução é garantir que a data do jogo no banco esteja correta.

### Ação recomendada
- Corrigir o filtro de jogos ativos no `LiveNowHero`
- Verificar/corrigir a data do jogo no painel admin (se deveria ser 27/03, alterar a data)

