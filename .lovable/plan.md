## O que encontrei (verificado no código e no banco)

Comparando `AdminFilmes.tsx` (638 linhas), `AdminSeries.tsx` (395) e `AdminNovidades.tsx` (574), as três fazem a mesma coisa (buscar no TMDB → adicionar → ativar/desativar → atualizar metadados → remover), mas cada uma evoluiu separadamente:

| Recurso | Filmes | Séries | Novidades |
|---|---|---|---|
| Reordenar itens | Drag & drop (@dnd-kit, teclado + toque) | **não tem** | Setas ↑↓ (só na ordem manual) |
| Seleção múltipla (ativar/desativar/excluir em lote) | Sim | **não tem** | **não tem** |
| Skeleton de carregamento | Sim (shimmer) | **não tem** (`isLoading` nem é lido) | Sim |
| Realtime (`useRealtimeMovies`) | Sim | **não tem** | **não tem** |
| Busca dentro da lista adicionada | **não tem** | **não tem** | Sim (com debounce) |
| Filtros (tipo/inativos/sem gênero) | **não tem** | **não tem** | Sim (chips) |
| Ordenação (A-Z, nota, data) | **não tem** | **não tem** | Sim (persistida em localStorage) |
| Botão "Atualizar todos" (lote completo) | Sim | Sim | **só "sem gênero"** |
| Paginação | Paginação numérica (20) | Paginação numérica (20) | Scroll infinito |
| Stats no topo | 3 cards (total/ativos/nota) | 3 cards | `NovidadesStatsBar` |
| Badge "já adicionado" nos resultados | Sim (✓ no card) | Sim | Sim (botão "✓") |

Confirmações no banco: `featured_movies` tem `sort_order`; **`featured_series` não tem nenhuma coluna de ordem**; `news_releases` usa `display_order`. Ou seja, ordenar séries exige uma coluna nova.

Além das diferenças, dois pontos de qualidade: em Séries os botões de lote ficam `h-9` sem contagem de progresso consistente, e em Novidades a atualização em lote só cobre itens sem gênero (não repõe backdrop/tagline faltando).

## Plano de padronização

**1. Camada de dados (hooks)**
- Migração: adicionar `sort_order integer` em `featured_series` (backfill pela ordem atual de `created_at`), mantendo os GRANTs/RLS existentes.
- Criar `useReorderSeries` (espelho de `useReorderMovies`) e `useReorderNewsReleases` (persistência em lote de `display_order`).
- Criar `useRealtimeSeries` e `useRealtimeNewsReleases` reaproveitando o padrão de `useRealtimeMovies`.

**2. Componentes compartilhados**
- Extrair de Filmes um `ContentListToolbar` (busca na lista + chips de filtro + select de ordenação + ações em lote + modo seleção) e uma `SortableContentRow` genérica (grip, poster, título/metadados, ações), parametrizados por cores/rótulos (azul/filmes, roxo/séries, âmbar/novidades).
- Extrair `TMDBSearchGrid` (grade de resultados + badge "já adicionado" + botão adicionar), hoje triplicada com pequenas divergências.

**3. Aplicar às três abas**
- **Séries**: ganha drag & drop, seleção múltipla em lote, skeleton de carregamento, realtime, busca/filtros/ordenação na lista.
- **Filmes**: ganha busca na lista, chips de filtro (inativos / sem gênero / sem backdrop) e ordenação persistida.
- **Novidades**: troca as setas ↑↓ por drag & drop (mantendo as setas como fallback acessível), ganha seleção múltipla em lote, realtime e "Atualizar todos" (não só os sem gênero).
- Padronizar rótulos, `aria-label`, toasts e diálogos de confirmação (sempre com o título do item) nas três.

**4. Paginação**
Unificar em paginação numérica de 20 itens (padrão de Filmes/Séries), porque drag & drop e scroll infinito conflitam — reordenar dentro de uma lista que cresce por observer causa saltos. Novidades mantém contador "x–y de N".

**5. Validação**
- Typecheck + suíte de testes (há testes para as três páginas em `src/pages/admin/__tests__`), atualizando-os para a nova estrutura.
- Auditoria Playwright a 384px: sem overflow horizontal e alvos de toque de 44px nas três abas.

## Sugestões extras (posso incluir se quiser)
- **Editar título/nota/gênero inline** nas três abas (hoje só é possível re-sincronizar do TMDB).
- **Alerta de saúde do conteúdo** (itens sem backdrop/sinopse/gênero) com botão "corrigir todos", como já existe no painel de Banners.
- **Ação "enviar para Novidades"** direto de um filme/série já cadastrado, evitando buscar de novo no TMDB.

## Detalhes técnicos
Sem mudança de contrato público: as páginas públicas continuam lendo `active` + ordem (`sort_order`/`display_order`). Reordenação em lote via um único `update` por índice em transação de mutação otimista, com rollback e toast de erro — igual ao já usado em `useReorderMovies`.
