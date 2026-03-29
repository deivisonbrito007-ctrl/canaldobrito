

## Problema: Conteúdos não aparecem no portal

### Diagnóstico

**Novidades (news_releases):**
- Existem **11 itens ativos** no banco, mas o hook `useActiveNewsReleases` usa `.limit(6)` — os 5 itens mais recentes (A Nobreza do Amor, Máquina de Guerra, Outlander, Lindas e Letais, Hannah Montana) não aparecem.

**Destaques (featured_movies / featured_series):**
- Existem **10+ filmes** e **10+ séries** ativos no banco.
- Esses conteúdos só aparecem na **aba Destaques** (Highlights), que requer clique do usuário. Na aba Home não há nenhuma seção de filmes/séries.

### Correções

#### 1. Aumentar ou remover o limite de Novidades
**Arquivo:** `src/hooks/useNewsReleases.ts`

Remover o `.limit(6)` do `useActiveNewsReleases` para mostrar todos os itens ativos, ou aumentar para `.limit(12)`.

#### 2. Exibir filmes e séries na aba Home
**Arquivo:** `src/pages/Index.tsx`

Adicionar `WeeklyMoviesSection` e `WeeklySeriesSection` na aba Home (dentro do bloco de lazy-loaded content abaixo do fold), para que filmes e séries da semana apareçam sem precisar trocar de aba.

```
<Suspense fallback={<BelowFoldSkeleton />}>
  <LazyNovidadesCard />
  <LazyPromoStrip />
  <LazyWeeklyMovies />     ← NOVO
  <LazyWeeklySeries />     ← NOVO
  <LazyBannerSections />
</Suspense>
```

Adicionar lazy imports:
```ts
const LazyWeeklyMovies = lazy(() => import("@/components/public/WeeklyMoviesSection")...);
const LazyWeeklySeries = lazy(() => import("@/components/public/WeeklySeriesSection")...);
```

### Arquivos alterados
- `src/hooks/useNewsReleases.ts` — remover/aumentar `.limit(6)`
- `src/pages/Index.tsx` — adicionar seções de filmes e séries na home

