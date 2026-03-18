

# Plano de Refinamento Visual Premium - Brito Solutions

## Escopo

Refinamento completo de UI/UX em todos os componentes públicos e admin, sem alterar lógica de negócios. Foco em: paleta mais sofisticada, hierarquia visual, espaçamento, microinterações e consistência.

## Arquivos Afetados (11 arquivos)

### 1. Paleta e Design Tokens (`src/index.css`)
- Fundo principal mais profundo: `224 71% 4%` (quase preto azulado)
- Card com variação sutil de grafite
- Verde principal mais vibrante apenas em pontos estratégicos (badges, CTAs)
- Melhorar utilitários: `glass-card` com blur mais forte, novas classes `premium-shadow`, `section-divider`
- Skeleton loading com shimmer mais suave
- Melhorar focus-visible global para inputs e botões

### 2. Header Público (`PublicHeader.tsx`)
- Adicionar sombra dinâmica no scroll (via estado ou CSS)
- Aumentar blur do backdrop
- Melhorar espaçamento e hierarquia do logo + data
- Badge "AO VIVO" com glow e pulse mais refinado
- Linha gradient sutil na borda inferior

### 3. Navegação por Abas (`Index.tsx`)
- Abas com visual mais premium: fundo sutil no item ativo
- Indicador inferior com glow
- Ícones maiores e melhor alinhamento
- Label "Atualizado às HH:mm" abaixo das abas
- Transições mais suaves entre conteúdos

### 4. Banners (`BannerSections.tsx`)
- Cabeçalho de categoria mais forte: tipografia maior, badge de contagem
- Imagem com rounded-2xl no desktop, overlay gradiente mais rico (multi-stop)
- Sombra externa sutil (glow) no container do banner
- Dots de navegação maiores e mais elegantes
- Animação de entrada com scale sutil
- Texto de apoio opcional sobre o banner

### 5. Cards de Filmes (`MoviesSection.tsx`)
- Cards com `rounded-2xl`, sombra premium, borda sutil
- Hover: scale(1.03) + shadow elevado + overlay escuro gradual
- Badge de nota com fundo amber/dourado mais bonito
- Tag de gênero com visual pill moderna
- Grid gap maior, padding de seção aumentado
- Placeholder de imagem ausente mais elegante
- Estado vazio com visual mais premium

### 6. Cards de Séries (`SeriesSection.tsx`)
- Mesmas melhorias dos filmes para consistência total

### 7. Footer (`PublicFooter.tsx`)
- Visual mais premium com separador gradient
- Logo com opacidade melhor
- WhatsApp com botão estilizado em verde
- Hierarquia clara: marca > contato > ação > copyright
- Espaçamento vertical maior

### 8. WhatsApp FAB (`WhatsAppFab.tsx`)
- Ícone do WhatsApp real (SVG inline) em vez do MessageCircle genérico
- Sombra glow verde
- Animação de entrada (scale-in com delay)
- Pulse sutil de atenção

### 9. Admin Layout (`AdminLayout.tsx`)
- Header admin mais refinado com melhor separação visual
- Tabs com visual mais moderno (active state com fundo + borda inferior)
- Melhor espaçamento do container

### 10. Páginas Admin (AdminBanners, AdminFilmes, AdminSeries, AdminConfiguracoes)
- Cards com bordas mais suaves e sombras premium
- Botões de ação com hover states melhorados
- Inputs com focus ring em verde, bordas mais claras
- Estados vazios mais elegantes com ícones maiores
- Listas de itens com hover row highlight
- Feedback visual melhorado (transições em switches, botões)

### 11. Componentes UI Base (`button.tsx`, `input.tsx`, `card.tsx`)
- Button: transição mais suave (200ms), hover com brightness, active com scale(0.98)
- Input: focus com ring verde, border mais visível, padding melhorado
- Card: sombra premium padrão, borda mais sutil

## Princípios

- Zero alteração em lógica, hooks, ou fluxo de dados
- Mobile-first com touch areas >= 44px mantidas
- Consistência total: mesmos border-radius (xl/2xl), gaps, sombras
- Microinterações sutis (sem exagero): hover, focus, entrada

## Ordem de Implementação

1. Design tokens e utilitários CSS (base)
2. Componentes UI base (button, input, card)
3. Header + Footer + FAB (moldura)
4. Index + Abas (navegação)
5. Banners + Movies + Series (conteúdo)
6. Admin (painel)

