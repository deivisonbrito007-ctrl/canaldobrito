

# Plano: Portal Visual Baseado em Banners

## Resumo

Transformar a home de um sistema com abas (Programação/Filmes/Séries) para um **scroll vertical contínuo**: Banners do Dia → Filmes → Séries. Remover referências a jogos e o badge "AO VIVO". A tabela `daily_banner` ganha campos `sort_order`, `title`, `link_url` para suportar múltiplos banners gerenciáveis.

## Análise do Estado Atual

- A home usa **3 abas** (Programação, Filmes, Séries) — a aba Programação mostra `BannerSections` (banners por categoria: cover, football, basketball, etc.)
- **Não existe** GamesSection/GameCard no frontend — tabela `games` existe no DB mas não é usada na UI
- `daily_banner` existe no DB mas também não é usada no frontend
- O sistema de banners atual usa a tabela `banners` com categorias
- Badge "AO VIVO" existe no `PublicHeader.tsx`

## Mudanças

### 1. Migração DB — Atualizar `daily_banner`
- Adicionar colunas: `sort_order` (int, default 0), `title` (text, nullable), `link_url` (text, nullable)
- RLS já existe e está correta

### 2. Novo Hook — `useDailyBanners.ts`
- Query para buscar banners ativos do dia atual, ordenados por `sort_order`
- Mutations para CRUD (criar, atualizar, deletar) para o admin

### 3. `src/pages/Index.tsx` — Layout Scroll Vertical
- **Remover** sistema de abas completamente
- Layout: Header → DailyBannerCarousel → MoviesSection → SeriesSection → Footer
- Scroll contínuo sem abas

### 4. `src/components/public/DailyBannerCarousel.tsx` — Novo Componente
- Carrossel snap-scroll horizontal no mobile (full-width, swipe)
- Auto-play com dots e setas
- Lazy loading, skeleton, transições suaves
- Título da seção "📺 Programação do Dia"

### 5. `src/components/public/PublicHeader.tsx`
- Remover badge "AO VIVO"

### 6. `src/pages/admin/AdminBanners.tsx` — Aba "Banners do Dia"
- Adicionar seção/aba para gerenciar `daily_banner` (upload, ordenar, ativar/desativar, excluir)
- Manter gestão dos banners por categoria existente

### 7. Remover `BannerSections.tsx`
- Componente de banners por categoria pode ser mantido se desejado, mas removido da home (ou mantido abaixo do carrossel principal se fizer sentido)

### 8. Limpeza
- Remover imports não utilizados (abas, Clock, etc.) do Index
- Atualizar WhatsApp messages para remover "ao vivo" se desejado

## Arquivos Afetados
1. **Migração SQL** — `daily_banner` add columns
2. **Criar** `src/hooks/useDailyBanners.ts`
3. **Criar** `src/components/public/DailyBannerCarousel.tsx`
4. **Editar** `src/pages/Index.tsx` — scroll vertical
5. **Editar** `src/components/public/PublicHeader.tsx` — remover AO VIVO
6. **Editar** `src/pages/admin/AdminBanners.tsx` — adicionar gestão daily_banner

