

# Melhorar Carregamento da Página

## Problemas Identificados

1. **Google Fonts via CSS @import** — bloqueia renderização até baixar as fontes
2. **4 componentes buscam `daily_games` separadamente** — Hero, AppNavbar, LiveFeedSection, LiveEventsSection todos chamam `useDailyGames(today)`. React Query deduplica, mas cada um cria listeners e re-renders independentes
3. **BannerSections faz 7 queries separadas** (cover + 5 categorias + football_guide), todas retornando vazio atualmente — requests desnecessários
4. **framer-motion importado em 4+ componentes da home** — bundle pesado carregado eager
5. **Seções abaixo do fold (NovidadesCard, PromoStrip, BannerSections) carregam imediatamente** — sem lazy loading

## Plano de Otimização

### 1. Mover Google Fonts para `<link>` no `index.html`
Substituir o `@import url(...)` no `src/index.css` por tags `<link rel="preconnect">` e `<link rel="stylesheet">` no `index.html`. Isso permite download paralelo sem bloquear o CSS.

### 2. Lazy load das seções abaixo do fold na Home
No `Index.tsx`, envolver `NovidadesCard`, `PromoStrip` e `BannerSections` com `lazy()` + `Suspense`, similar ao que já é feito com `HighlightsTab` e `ScheduleTab`.

### 3. Prefetch da query `daily_games` no QueryClient
Configurar `staleTime: 60000` no `useDailyGames` para que React Query reutilize o cache entre os 4 componentes sem refetch. Já tem `refetchInterval: 60000`, mas falta `staleTime` — sem ele, cada mount dispara um refetch.

### 4. Adicionar `loading="lazy"` nas imagens do NovidadesCard
As imagens do carrossel de novidades não têm `loading="lazy"`.

### 5. Corrigir warning do `forwardRef` no console
O `GameCard` e `AnimatePresence` estão gerando warnings de ref. Envolver `GameCard` com `React.forwardRef` para eliminar o erro.

## Resultado Esperado
- Fonts carregam em paralelo (não bloqueiam)
- Menos re-renders com `staleTime` no cache
- Seções abaixo do fold carregam sob demanda
- Console limpo sem warnings

