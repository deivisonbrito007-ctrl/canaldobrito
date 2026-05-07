# Auditoria — Aba Novidades (Admin)

## Estado atual
- **Testes**: `AdminNovidades.test.tsx` ✅ 5/5 passando.
- **Banco**: 8 itens, 8 ativos, 0 sem gênero/poster/backdrop/sinopse — saúde ótima.
- **Arquivo**: `src/pages/admin/AdminNovidades.tsx` (299 linhas) — toda a lógica em 1 componente.

## Issues encontrados

| # | Sev | Problema |
|---|---|---|
| 1 | 🔴 alto | `confirm()` nativo no delete — quebra em iOS PWA, sem tema. |
| 2 | 🔴 alto | Cada linha amontoa: ↑↓ + poster + título + 2 selects + switch + 2 botões em `flex` sem wrap → trunca/overflow no mobile (320–375px). |
| 3 | 🟠 médio | Header "Adicionados" com botão "Atualizar N sem gênero" + badge contador → estoura largura no mobile. |
| 4 | 🟠 médio | Switch e botões de delete/refresh com `h-6/h-8` < 44px (toque iOS). |
| 5 | 🟠 médio | Sem busca/filtro na lista de adicionados (8 hoje, vai crescer). |
| 6 | 🟠 médio | Sem filtro por tipo (filme/série) ou status (ativos/inativos/sem gênero). |
| 7 | 🟠 médio | Race condition em `handleAdd`: se TMDB ainda não retornou itens, não há guarda no servidor (sem unique constraint em `tmdb_id+content_type`). |
| 8 | 🟡 baixo | `runtime` e `seasons` renderizados como `<span>` soltos sem separador. |
| 9 | 🟡 baixo | Botão "Add" do TMDB com `opacity-100` no mobile cobre a nota do filme. |
| 10 | 🟡 baixo | Fontes 9–10px (abaixo de 11–12px mínimo recomendado). |
| 11 | 🟡 baixo | `console.log` em produção (toggle/delete). |
| 12 | 🟡 baixo | Batch update sequencial — paralelizar com concorrência 3. |
| 13 | 🟡 baixo | Sem dashboard/insights (totais por tipo, badge mais usada, nota média). |
| 14 | 🟡 baixo | Sem skeleton no loading inicial. |
| 15 | 🟡 baixo | Cobertura de testes não cobre `handleAdd`, `handleReorder`, `handleBatchUpdate`, delete via AlertDialog. |

## Plano de implementação

### A. UX/Mobile-first (prioritário)
- **Linha de item responsiva**: layout em 2 níveis no mobile (poster + título/badges em cima; controles ↑↓/refresh/switch/delete em barra abaixo). Em ≥sm volta ao layout horizontal atual.
- **Toques ≥36px**: aumentar switch wrapper, refresh e delete; manter ↑↓ compactos mas com área de toque expandida.
- **Header "Adicionados"** com `flex-wrap`, contador em badge compacta, botão "Atualizar sem gênero" colapsa em ícone-only no mobile.
- **Botão Add** do TMDB: virar pill compacto no canto do poster (não tampar título/nota).
- **Fontes mínimas**: subir 9–10px → 11–12px.
- **Substituir `confirm()`** por `<AlertDialog>` (já usado em outras telas).

### B. Filtros & Dashboard
- **Mini stats bar** no topo: Total · Ativos · Filmes · Séries · Sem gênero · Nota média.
- **Filtros** (chips): Todos · Filmes · Séries · Inativos · Sem gênero.
- **Busca** local com debounce 250ms (filtra título/gênero).
- **Sort visual**: Manual (display_order) · Mais novos · Nota.

### C. Robustez
- **Guarda de duplicidade no servidor**: capturar erro `23505` e mostrar toast "já adicionado" (cobre race condition); manter check client-side como UX.
- **Batch paralelo** (concorrência 3) usando `Promise.all` em chunks.
- **Remover `console.log`** de produção.
- **Skeleton shimmer** durante carregamento inicial dos itens.

### D. Testes
Expandir `AdminNovidades.test.tsx` com:
- `handleAdd` chama `mutateAsync` com payload correto.
- Guard de duplicado bloqueia add.
- Filtro "Sem gênero" filtra a lista.
- Busca filtra por título.
- Delete via AlertDialog (abrir → confirmar → mutate).
- Reorder ↑/↓ chama mutate com swap de `display_order`.

### E. Sugestões opcionais (a confirmar)
- Migration para `UNIQUE(tmdb_id, content_type)` em `news_releases` (reforça B/guard).
- Drag-to-reorder (touch-friendly) usando `@dnd-kit`.
- Badge "NOVO" nos itens criados < 7 dias.
- Cron semanal sincronizando metadados via TMDB.
- Export CSV.

## Arquivos
- `src/pages/admin/AdminNovidades.tsx` — refator UI, filtros, AlertDialog, batch paralelo, remover logs.
- `src/components/admin/NovidadesStatsBar.tsx` — **novo** mini-dashboard reutilizável.
- `src/pages/admin/__tests__/AdminNovidades.test.tsx` — expandir suíte.
- *(opcional E)* `supabase/migrations/*` — unique constraint.

## Para confirmar
Quais itens da seção **E** incluir? (constraint UNIQUE, drag-and-drop, badge NOVO, cron, export CSV)
