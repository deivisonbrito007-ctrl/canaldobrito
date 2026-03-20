

# Correção e Otimização da Aba Programação no Mobile

## Problemas Identificados

1. **Header duplicado**: `ScheduleTab` renderiza um `SectionHeader` ("Programação Canal do Brito") E o `DailyGamesSection` tem seu próprio header ("PROGRAMAÇÃO 11 jogos 3 ao vivo"). Redundante e ocupa ~80px extras.
2. **Nomes de times truncados**: "Chapeco..." e "Corinthia..." no NextGameHero — em telas de 320-375px o layout `flex` com time/horário/time não cabe.
3. **NextGameHero muito grande**: Ocupa ~180px de altura, empurrando os cards para baixo. No mobile isso é precioso.
4. **Cards de jogo largos demais**: O `p-4` interno + badges + reminder button criam overflow horizontal em telas estreitas.
5. **Filtros ok mas podem ser mais compactos**: Os botões "Competição" e "Canal" poderiam estar numa linha de scroll horizontal.

## Correções

### 1. Remover header duplicado
- **`ScheduleTab.tsx`**: Remover o `SectionHeader` — o `DailyGamesSection` já tem seu próprio header com stats integrados.

### 2. Compactar NextGameHero no mobile
- **`NextGameHero.tsx`**: Reduzir padding de `p-4` para `p-3`, texto de times de `text-base` para `text-sm`, e usar `text-ellipsis` com `max-w` adequado. Em telas estreitas (<375px), nomes longos devem truncar com `...` sem quebrar layout.

### 3. Otimizar GameCard para mobile
- **`DailyGamesSection.tsx`**:
  - Reduzir padding interno dos cards de `p-4` para `p-3`
  - Badge de competição: reduzir `max-w-[160px]` para `max-w-[140px]` e garantir truncate
  - Linha de times: garantir que `truncate` funcione com `min-w-0` nos containers flex
  - Grid de cards: forçar `grid-cols-1` no mobile (remover `sm:grid-cols-2`)

### 4. Header da seção mais compacto
- **`DailyGamesSection.tsx`**: Fazer o header "PROGRAMAÇÃO" + badges wrap corretamente no mobile usando `flex-wrap` e gap menor.

### 5. Scroll horizontal nos filtros
- **`DailyGamesSection.tsx`**: Wrap os botões de filtro em container com `overflow-x-auto scrollbar-hide` para scroll horizontal natural em mobile.

## Arquivos modificados
- `src/components/public/ScheduleTab.tsx` — remover SectionHeader duplicado
- `src/components/public/DailyGamesSection.tsx` — compactar cards, header, e filtros para mobile
- `src/components/public/NextGameHero.tsx` — reduzir tamanho e garantir truncate nos nomes

