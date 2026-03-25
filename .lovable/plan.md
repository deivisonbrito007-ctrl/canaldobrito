

## Pull-to-Refresh no Mobile

### Objetivo
Adicionar um gesto de "puxar para baixo" no topo da página que invalida todos os caches do React Query, atualizando jogos ao vivo, filmes, séries e banners.

### Abordagem
Criar um hook `usePullToRefresh` customizado que detecta o gesto de arrastar para baixo via touch events (não framer-motion, para evitar conflito com o swipe horizontal entre abas). Quando o usuário puxa além de um limiar (~80px) e solta, invalidamos todas as queries.

### Arquivos

**1. `src/hooks/usePullToRefresh.ts`** (novo)
- Hook que registra `touchstart`, `touchmove`, `touchend` no elemento alvo
- Só ativa quando `window.scrollY === 0` (topo da página)
- Retorna `{ pullDistance, isRefreshing }` para controlar o indicador visual
- No release, chama `queryClient.invalidateQueries()` via `useQueryClient()`
- Após ~800ms, reseta o estado de refreshing

**2. `src/components/public/PullToRefreshIndicator.tsx`** (novo)
- Indicador visual no topo: ícone de seta/spinner com a cor `primary`
- Transição suave: aparece conforme o `pullDistance` aumenta, gira quando `isRefreshing`
- Oculto quando `pullDistance === 0` e não está refreshing

**3. `src/pages/Index.tsx`** (editar)
- Importar e usar `usePullToRefresh` passando ref do container `<main>`
- Renderizar `<PullToRefreshIndicator>` logo acima do conteúdo dentro do `<main>`
- O hook só ativa em viewports touch (verificação via `'ontouchstart' in window`)

### Detalhes técnicos
- Touch events nativos em vez de framer-motion drag vertical para não conflitar com o drag horizontal já existente entre abas
- `overscroll-behavior-y: contain` no container para evitar o pull-to-refresh nativo do Chrome
- Invalidação ampla: `queryClient.invalidateQueries()` sem filtro, atualizando tudo de uma vez
- Feedback tátil com animação spring CSS no indicador

