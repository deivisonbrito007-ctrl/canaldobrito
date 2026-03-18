

# Redesign Completo — Brito Solutions Streaming App

## Visão Geral
Transformar toda a página pública em um app mobile de streaming premium com nova identidade visual (cores, tipografia, efeitos de fundo), nova estrutura de navegação e componentes completamente refeitos.

---

## Mudanças

### 1. CSS Global (`src/index.css`)
- Substituir fontes: `Bebas Neue` (display) + `Outfit` (corpo)
- Novas variáveis de cor: `--background: #080810`, `--card: #131325`, `--accent: #00e5a0`, `--accent2: #7c3aed`, `--accent3: #f59e0b`, `--muted: #6b6b8a`, `--live: #ef4444`
- Adicionar efeitos de fundo: dois blobs animados (roxo + verde) com keyframe `drift`, grain overlay
- Glassmorphism utilities para navbar/bottom nav

### 2. Página Index (`src/pages/Index.tsx`)
- Remover `PublicHeader` e `CategoryBar`
- Nova estrutura: `AppNavbar` → Saudação → `CategoryPills` → `HeroBanner` → `LiveGamesSection` → `WatchTodaySection` → `ContinueWatchingSection` → `ReleaseBanner` → `FeaturedSection` → `BottomNav`
- Blobs de fundo e grain overlay no wrapper principal
- Padding inferior para safe area do bottom nav

### 3. Novo: `AppNavbar` (`src/components/public/AppNavbar.tsx`)
- Sticky top, glassmorphism background
- Logo quadrado com gradiente roxo→verde + "BRITO SOLUTIONS" em Bebas Neue
- Data atual formatada
- Ícone de busca à direita

### 4. Novo: `CategoryPills` (`src/components/public/CategoryPills.tsx`)
- Scroll horizontal sem scrollbar
- Pills: Todos · 🎬 Filmes · 📺 Séries · ⚽ Esportes · 🆕 Lançamentos · 🔥 Em Alta
- Ativo: fundo verde + texto escuro + glow
- Inativos: border semitransparente

### 5. Novo: `HeroBanner` (`src/components/public/HeroBanner.tsx`)
- Usa dados mock (ou dados reais dos filmes/séries quando disponíveis)
- Card de 420px, border-radius 24px, mx-4
- Imagem com overlay + zoom animado
- Badge "Novo Lançamento" pulsante, badge rating âmbar
- Título em Bebas Neue 46px, descrição, botões (play verde + info glass)
- 3 dots com rotação automática a cada 3.2s

### 6. Refatorar: `LiveNowSection` → visual novo
- Cards 280px com borda-top vermelha (gradiente)
- Background radial vermelho sutil
- Placar centralizado com fundo vermelho, Bebas Neue
- Indicador "● AO VIVO" piscando
- Canais em tags com border semitransparente
- Hover: translateY(-3px) + shadow vermelho
- Mantém lógica real do banco (useDailyGames) + dados mock como fallback

### 7. Refatorar: `WatchTodaySection` → visual novo
- Cards poster 150×220px com badge tipo verde + rating âmbar
- Overlay gradiente, info na parte inferior
- Hover scale(1.04)

### 8. Novo: `ContinueWatchingSection` (`src/components/public/ContinueWatchingSection.tsx`)
- Dados mock (3 itens com progresso)
- Cards 200px com thumb 115px, overlay play no hover
- Barra de progresso verde na base
- Info: episódio verde uppercase + título

### 9. Novo: `ReleaseBanner` (`src/components/public/ReleaseBanner.tsx`)
- Banner largo com gradiente escuro + blob roxo
- Border roxo sutil
- Título "LANÇAMENTOS" em Bebas Neue
- Botão roxo com 🚀
- Emoji flutuante animado

### 10. Novo: `FeaturedSection` (`src/components/public/FeaturedSection.tsx`)
- Cards full-width com thumb à esquerda + info à direita
- Badge colorido ("🆕 Novo" ou "⭐ Top 10")
- Dados mock
- Hover translateY(-2px) + shadow roxo

### 11. Novo: `BottomNav` (`src/components/public/BottomNav.tsx`)
- Sticky bottom, glassmorphism
- 5 itens: Início · Buscar · [Central play] · Programação · Perfil
- SVG stroke icons
- Ativo: verde + linha acima
- Botão central: gradiente roxo→verde, glow

### 12. Saudação inline no Index
- "Bem-vindo de volta 👋" muted
- "O que vai assistir **hoje**?" com "hoje" em verde

### 13. Header e Footer antigos
- `PublicHeader` não será mais usado no Index
- `PublicFooter` removido do Index (bottom nav substitui)
- Componentes mantidos para eventual uso em outras páginas

---

## Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/index.css` |
| Editar | `src/pages/Index.tsx` |
| Editar | `src/components/public/LiveNowSection.tsx` |
| Editar | `src/components/public/WatchTodaySection.tsx` |
| Criar | `src/components/public/AppNavbar.tsx` |
| Criar | `src/components/public/CategoryPills.tsx` |
| Criar | `src/components/public/HeroBanner.tsx` |
| Criar | `src/components/public/ContinueWatchingSection.tsx` |
| Criar | `src/components/public/ReleaseBanner.tsx` |
| Criar | `src/components/public/FeaturedSection.tsx` |
| Criar | `src/components/public/BottomNav.tsx` |

