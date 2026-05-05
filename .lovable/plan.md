# Auditoria e melhorias — aba Filmes e Séries

## Diagnóstico

Após revisar `NovidadesPage`, `WeeklyMoviesSection`, `WeeklySeriesSection`, `ContentDetailSheet`, `ContentCard`, `ContentListItem`, `FilterChip`, `SearchModal` e os testes existentes, encontrei o seguinte:

### Bugs / warnings ativos
1. **Warning do React** no console: `MovieCard` (e por consequência `SeriesCard`) "cannot be given refs". O `framer-motion` no caminho `AnimatePresence → motion.div → MovieCard` exige `forwardRef` quando o componente é alvo de medição/animação. Regra de projeto (memória Core) já manda usar `React.forwardRef` em componentes envolvidos com framer-motion/tooltips.
2. `ContentDetailSheet` já é `forwardRef`, mas o warning ainda aparece no rastro porque o componente irmão (`MovieCard`) é o real culpado — ao corrigir #1 o stack some.

### Cobertura de testes ausente
- `ContentCard`, `ContentListItem`, `FilterChip`, `BadgePill`, `SearchModal` e a própria `NovidadesPage` (filtros, ordenação, empty state, alternância grid/list) não têm testes.

### Pontos de UX/mobile a melhorar
- **Empty state global**: se `stats.all === 0` e não houver `weeklyMovies/weeklySeries`, a página fica em branco abaixo do hero (sem CTA).
- **Ordenação fica escondida**: o `<select>` só aparece dentro do filtro ativo. Não é descoberto na visão padrão "Todos".
- **Botão de busca** (`44×44`) ok, mas falta atalho de teclado (`/`) e foco automático no modal.
- **Filtros com scroll horizontal**: o mask-gradient corta o último chip em telas estreitas (≤360px). Ajustar padding e snap.
- **Acessibilidade**: chips usam `<button>` mas faltam `aria-pressed`. Sort `<select>` precisa de label visível em telas grandes — ok manter `sr-only` em mobile.
- **Performance**: `WeeklyMoviesSection` e `WeeklySeriesSection` chamam `useTrailerAvailability` separadamente. Já está cacheado, ok manter.
- **iOS safe area**: o container tem `pb-2`. Como `BottomNav` cobre o final, adicionar `pb-[calc(5rem+env(safe-area-inset-bottom))]` para evitar último item escondido em iPhones.

### Sugestões extras (opcionais, marco como nice-to-have)
- Mostrar contador de resultados no header quando há filtro ativo (já feito).
- Persistir filtro/ordem em `sessionStorage` para preservar entre navegações.
- Adicionar skeleton específico para listas (atualmente reaproveita o de grid).

## Mudanças propostas

### 1. Corrigir warning de refs (Core memory)
- `WeeklyMoviesSection.tsx`: converter `MovieCard` em `React.forwardRef<HTMLDivElement, Props>` aplicando `ref` no `motion.div`.
- `WeeklySeriesSection.tsx`: idem para `SeriesCard`.

### 2. Empty state global na NovidadesPage
- Quando `!isLoading && stats.all === 0 && weeklyCount === 0`, renderizar painel central "Em breve novos títulos" com ícone e CTA para abrir busca.

### 3. Ordenação visível no modo "Todos"
- Mover o `<select>` de ordenação para o header global (à direita do botão de busca em telas ≥sm; abaixo do filtro chips em mobile). A ordenação afeta apenas o grid filtrado; quando filtro = "all", ela ordena `WeeklyMovies` + `WeeklySeries` localmente passando prop `sort` para essas seções.
- Alternativa mais simples: manter dentro do filtro ativo e remover do escopo (escolher na implementação).

### 4. Acessibilidade & atalhos
- Adicionar `aria-pressed={active}` em `FilterChip`.
- `NovidadesPage`: listener de teclado para `/` abrir `SearchModal`.
- `SearchModal`: `autoFocus` no input + `Escape` fecha (verificar se já existe).

### 5. Padding & safe area mobile
- Trocar `pb-2` no wrapper por `pb-[calc(5rem+env(safe-area-inset-bottom))]`.
- Ajustar mask-gradient dos filtros para `calc(100%-12px)` e `pr-4` para garantir visibilidade do último chip em 320px.

### 6. Testes (Vitest + Testing Library)
Criar arquivos novos:
- `src/components/public/novidades/__tests__/FilterChip.test.tsx` — render label/contagem, click handler, `aria-pressed`.
- `src/components/public/novidades/__tests__/ContentCard.test.tsx` — título, badge de tipo, fallback de imagem, callback `onSelect`.
- `src/components/public/novidades/__tests__/ContentListItem.test.tsx` — render lista, rating, chevron, callback.
- `src/components/public/novidades/__tests__/BadgePill.test.tsx` — variantes (`lancamento`, `nova_temporada`, `estreia`, `exclusivo`, `movie`, `series`).
- `src/components/public/__tests__/NovidadesPage.test.tsx` — mock dos hooks `useActiveNewsReleases`/`useActiveMovies`/`useActiveSeries`; verifica:
  - render do header e contagem total
  - alternância de filtro mostra o grid e esconde o carrossel
  - mudança no `<select>` reordena (A–Z e Ano)
  - alternância grid → list troca os componentes renderizados
  - empty state global aparece quando todos os hooks retornam vazio
- Atualizar `WeeklyMoviesSection.test.tsx` / `WeeklySeriesSection.test.tsx` para garantir que `forwardRef` não quebra o render existente.

### 7. Rodar a suíte completa
- Executar `bunx vitest run` ao final e reportar resultado (passes/falhas).

## Arquivos afetados

- `src/components/public/WeeklyMoviesSection.tsx` (forwardRef)
- `src/components/public/WeeklySeriesSection.tsx` (forwardRef)
- `src/components/public/NovidadesPage.tsx` (empty state global, safe-area, atalho `/`, aria)
- `src/components/public/novidades/FilterChip.tsx` (aria-pressed)
- `src/components/public/novidades/SearchModal.tsx` (autoFocus / Escape — apenas se faltar)
- 5 arquivos novos de teste em `src/components/public/novidades/__tests__/` e `src/components/public/__tests__/`

## Itens fora do escopo (sugestões para depois)

- Persistência de filtro/ordem em `sessionStorage`.
- Skeleton dedicado para a visão lista.
- Pré-carregamento de pôsteres do próximo "lote" no scroll vertical (IntersectionObserver).
- Compartilhamento de cards via Web Share API.
