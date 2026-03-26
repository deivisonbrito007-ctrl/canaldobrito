

## Corrigir seção "Ao Vivo" — jogos não aparecem + layout dos cards

### Problema 1: Jogos não aparecem

O `LiveNowHero` usa `useDailyGames()` que filtra `active=true AND archived=false`. **Todos os jogos de hoje estão com `active=false`** (agendados, aguardando ativação automática). Resultado: a seção nunca aparece.

**Correção:** Trocar para `useAllDailyGames()` no `LiveNowHero.tsx` e filtrar manualmente apenas `archived=false`. Assim jogos agendados mas dentro do horário "ao vivo" aparecem corretamente. (Mesmo padrão já usado no AdminWhatsApp.)

### Problema 2: Layout dos cards — texto cortado/sobrepondo

Os cards atuais usam carrossel horizontal com `min-w-[260px]` fixo. Com nomes longos (ex: "República Tcheca", "Bósnia e Herzegovina"), o `truncate` corta os nomes. Em telas maiores, o espaço não é aproveitado.

**Correção no MatchCard:**
- Trocar `truncate` por `line-clamp-2` nos nomes dos times para permitir quebra de linha
- Reduzir fonte de `text-[15px]` para `text-[13px]` para caber melhor
- Aumentar `min-w` para `min-w-[280px]` em mobile
- Em telas `sm+`, usar grid responsivo em vez de carrossel horizontal quando há poucos jogos (≤4)

**Correção no EventCard:**
- Adicionar `line-clamp-2` em vez de `line-clamp-1` no nome do evento

### Problema 3: Cores de acento faltando

O `SPORT_ACCENT` no `LiveNowHero` não inclui `hockey` e `baseball`. Jogos desses esportes caem no fallback genérico.

**Correção:** Adicionar `hockey: "bg-sky-500"` e `baseball: "bg-yellow-600"` ao mapa.

### Alterações

**Arquivo:** `src/components/public/LiveNowHero.tsx`
1. Trocar import de `useDailyGames` para `useAllDailyGames`
2. Filtrar `!g.archived` no `useMemo` dos jogos ao vivo
3. Adicionar `hockey` e `baseball` ao `SPORT_ACCENT`
4. No `MatchCard`: trocar `truncate` por `line-clamp-2`, reduzir fonte para `text-[13px]`
5. No layout do carrossel: quando `matches.length <= 4` em telas `sm+`, usar grid `grid-cols-2` em vez de scroll horizontal, para melhor aproveitamento de espaço
6. No `EventCard`: trocar `line-clamp-1` por `line-clamp-2`

### Resultado esperado
- Jogos com `active=false` mas no horário ao vivo aparecem na seção
- Nomes longos não ficam cortados nem sobrepostos
- Todos os esportes têm cor de acento correta

