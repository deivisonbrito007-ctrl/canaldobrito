

# Separar "Assista Hoje" e "Em Destaque" em Destaques da Semana (Filmes + Séries)

## Situacao Atual
- **WatchTodaySection**: mistura filmes e séries em um carrossel horizontal único
- **FeaturedSection**: dados estáticos hardcoded (emojis, sem imagens reais)
- Admin já gerencia filmes e séries separadamente, mas não há conceito de "destaque da semana"

## Plano

### 1. Página pública — Substituir WatchTodaySection e FeaturedSection

Remover ambos os componentes e criar dois novos:

**`WeeklyMoviesSection.tsx`** — "Destaque da Semana · Filmes"
- Carrossel horizontal com snap scroll (mesmo padrão visual do WatchTodaySection atual)
- Cards em poster 2:3, com badge "🎬 Filme", rating, ano, genero
- Dados de `useActiveMovies()`
- Icone `Film` + titulo "Destaque da Semana"

**`WeeklySeriesSection.tsx`** — "Destaque da Semana · Séries"
- Mesmo layout de carrossel horizontal
- Badge "📺 Série", dados de `useActiveSeries()`
- Icone `Clapperboard` + titulo "Destaque da Semana"

Ambos usam o visual da imagem de referencia: cards com poster real, badge de tipo no canto superior esquerdo, rating no canto superior direito, titulo + ano na parte inferior com gradiente.

### 2. Index.tsx — Atualizar layout

Substituir `<WatchTodaySection />` e `<FeaturedSection />` pelos dois novos componentes:
```
<WeeklyMoviesSection />
<WeeklySeriesSection />
```

### 3. Admin — Sem mudanças necessárias

Os admins já gerenciam filmes (`AdminFilmes`) e séries (`AdminSeries`) separadamente com busca TMDB, toggle ativo/inativo, e exclusão. O campo `active` já controla o que aparece na pagina publica. Não precisa de alteração no admin.

### Arquivos modificados
- `src/components/public/WeeklyMoviesSection.tsx` (novo)
- `src/components/public/WeeklySeriesSection.tsx` (novo)
- `src/pages/Index.tsx` (trocar imports)
- `src/components/public/FeaturedSection.tsx` (pode ser removido)
- `src/components/public/WatchTodaySection.tsx` (pode ser removido)

