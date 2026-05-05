# Plano: Aba unificada "Filmes e Séries"

Fundir as abas **Novidades** e **Sugestões** em uma única aba chamada **"Filmes e Séries"**, reduzindo de 4 para 3 abas e eliminando a redundância entre o carrossel destaque e o grid.

## 1. Bottom Nav (3 abas)

`src/components/public/BottomNav.tsx`:
- Remover item `highlights`.
- Renomear `novidades` → label **"Filmes e Séries"**, ícone `Clapperboard` (lucide) no lugar de `Sparkles`.
- Abas finais: Ao Vivo · Filmes e Séries · Programação.

## 2. Roteamento e deep-links

`src/pages/Index.tsx`:
- `TAB_ORDER = ["live", "novidades", "schedule"]`.
- `handleTabChange`: se receber `"highlights"`, redirecionar para `"novidades"` (compat com eventos `nav-tab-change` e `?tab=highlights`).
- Remover bloco do `HighlightsTab` em `renderContent()` e seu `lazy import`.

`src/lib/utils.ts` (SLUG_TO_TAB): mapear `highlights`, `sugestoes`, `destaques` → `novidades`. Manter `novidades` e adicionar `filmes-e-series` / `filmes` / `series` → `novidades`.

## 3. NovidadesPage — nova estrutura

`src/components/public/NovidadesPage.tsx` passa a orquestrar 3 blocos:

```text
[Hero header + filtros]
       │
[🔥 Em Destaque]   ← FeaturedCarousel (curadoria real)
       │
[Destaques da Semana]   ← WeeklyMoviesSection + WeeklySeriesSection
       │
[Explorar todos]   ← Grid/Lista (sem duplicar destaques)
```

### 3.1 Curadoria do FeaturedCarousel
Mudar `featured` para mostrar **apenas** itens com `badge_type ∈ {lancamento, estreia, exclusivo}` (até 5). Se nenhum existir, esconder o carrossel (não cair no fallback de "primeiros 5").

### 3.2 Seções da Semana
Importar `WeeklyMoviesSection` e `WeeklySeriesSection` direto de `src/components/public/`. Renderizar entre o carrossel e o grid, com separador shimmer igual ao `HighlightsTab` quando ambos têm itens.

### 3.3 Grid "Explorar"
- Renomear cabeçalho para **"Explorar"** (ou manter rótulo do filtro ativo).
- Deduplicar: `filtered` exclui IDs presentes em `featured` quando `filter === "all"` (com filtro específico, mostrar tudo do filtro).
- Manter toggle Grade/Lista, modal de busca e ContentDetailSheet.

### 3.4 Comportamento dos filtros
- Filtros (Filmes / Séries / Lançamentos / Estreias / Exclusivos) afetam **carrossel + grid**.
- Quando um filtro está ativo, **ocultar** as seções "Destaques da Semana" (elas são curadoria fixa e não fazem sentido filtradas) e mostrar apenas Hero filtrado + Grid.
- Filtro "Todos" mostra a estrutura completa (3 blocos).

## 4. Header da página

- Título: **"FILMES E SÉRIES 🎬"**.
- Subtítulo: contagem total combinada (`news_releases` + curadoria semanal, deduplicada por `tmdb_id` quando possível).

## 5. Limpeza

- `HighlightsTab.tsx`: manter o arquivo (sem rota) ou deletar. **Recomendação**: deletar `HighlightsTab.tsx` e seu fallback `HighlightsFallback` em `Index.tsx`. Os componentes `WeeklyMoviesSection` / `WeeklySeriesSection` continuam usados.
- Atualizar memória `mem://features/home-page-layout` para refletir 3 abas.

## 6. QA

- Verificar que `?tab=highlights` antigo ainda abre a nova aba.
- Conferir que filtro "Lançamentos" não mostra item duplicado entre hero e grid.
- Mobile 320–430px: filtros continuam scrolláveis, seções da semana mantêm carrossel horizontal próprio.

## Arquivos tocados

- `src/components/public/BottomNav.tsx` (editar)
- `src/pages/Index.tsx` (editar)
- `src/components/public/NovidadesPage.tsx` (editar — maior mudança)
- `src/lib/utils.ts` (editar SLUG_TO_TAB)
- `src/components/public/HighlightsTab.tsx` (deletar)
- `mem://features/home-page-layout` (atualizar)
