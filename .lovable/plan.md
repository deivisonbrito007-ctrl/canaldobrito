

# Plano: Seção "Novidades & Lançamentos"

## Resumo

Criar uma nova seção pública e aba admin para gerenciar conteúdos marcados como "Novidade" ou "Lançamento", com integração TMDB, exibida entre o carrossel do dia e "Assista Hoje".

## 1. Migração DB — Tabela `news_releases`

```sql
CREATE TABLE public.news_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'movie',  -- 'movie' | 'series'
  badge_type text NOT NULL DEFAULT 'novidade', -- 'novidade' | 'lancamento'
  image_url text,
  overview text,
  year integer,
  rating numeric,
  tmdb_id integer,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: leitura pública, insert/update/delete para admins (mesmo padrão das outras tabelas).

## 2. Criar `src/hooks/useNewsReleases.ts`

Hook com queries e mutations seguindo o padrão de `useMovies.ts`:
- `useActiveNewsReleases()` — ativos, ordenados por `display_order`, limit 6
- `useAllNewsReleases()` — todos, para o admin
- `useAddNewsRelease()`, `useToggleNewsRelease()`, `useDeleteNewsRelease()`, `useUpdateNewsRelease()`

## 3. Criar `src/components/public/NewsReleasesSection.tsx`

- Busca até 6 itens ativos
- Se vazio, retorna `null` (seção oculta)
- Header: ícone Sparkles, título "Novidades & Lançamentos", badge de contagem
- Layout: scroll horizontal snap no mobile, grid no desktop (3-4 colunas)
- Cards com poster 2:3, badges no topo-esquerdo:
  - Content badge: "🎬 Filme" (emerald) ou "📺 Série" (blue)
  - Badge type: "🆕 Lançamento" (purple) ou "🔥 Novidade" (orange) — posicionado logo abaixo do content badge
- Rating badge amber no topo-direito (mesmo padrão existente)
- Título, ano, gênero, sinopse no overlay inferior

## 4. Criar `src/pages/admin/AdminNovidades.tsx`

Seguindo o padrão de `AdminFilmes.tsx`:
- Busca TMDB (filmes e séries) para adicionar itens
- Ao adicionar do TMDB, formulário permite escolher `badge_type` (novidade/lançamento) e `content_type` (filme/série)
- Lista de itens adicionados com: toggle ativo, delete, editar ordem
- Campos: título, imagem, descrição, ano, nota, badge_type, content_type, display_order

## 5. Editar `src/pages/AdminLayout.tsx`

- Adicionar nova aba "Novidades" com ícone `Sparkles` no array `adminTabs`
- Atualizar grid de `grid-cols-4` para `grid-cols-5`

## 6. Editar `src/App.tsx`

- Adicionar rota `/admin/novidades` com componente `AdminNovidades`

## 7. Editar `src/pages/Index.tsx`

- Importar e renderizar `NewsReleasesSection` entre `DailyBannerCarousel` e `WatchTodaySection`

## Hierarquia da Home

1. Header
2. DailyBannerCarousel (Programação do Dia)
3. **NewsReleasesSection** (Novidades & Lançamentos) — NOVO
4. WatchTodaySection (Assista Hoje)
5. Footer

## Arquivos Afetados

| Ação | Arquivo |
|------|---------|
| Migração SQL | nova tabela `news_releases` + RLS |
| Criar | `src/hooks/useNewsReleases.ts` |
| Criar | `src/components/public/NewsReleasesSection.tsx` |
| Criar | `src/pages/admin/AdminNovidades.tsx` |
| Editar | `src/pages/AdminLayout.tsx` — nova aba |
| Editar | `src/App.tsx` — nova rota |
| Editar | `src/pages/Index.tsx` — adicionar seção |

