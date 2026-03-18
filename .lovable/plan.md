

# Novidades como Hero Banner Netflix-style (Mobile-First)

## Arquivo: `src/components/public/NewsReleasesSection.tsx`

Reescrever de stories horizontais para um **carrossel hero grande**, otimizado para mobile (320-430px).

### Layout Mobile-First
- **Altura**: `h-[360px]` mobile / `h-[420px]` em `sm:` — ocupa boa parte da tela sem precisar scroll
- **Bordas**: `rounded-2xl` (mobile) / `rounded-3xl` (sm+)
- **Margens**: `mx-4` para respiro lateral no mobile
- **Imagem**: `object-cover` fullscreen com fallback de cor sólida

### Conteúdo Sobreposto (touch-friendly)
- **Badge** top-left: tipo lançamento/destaque, tamanho `text-[10px]` com ícone
- **Rating** top-right (se disponível): estrela + nota
- **Título**: `text-2xl` bold na parte inferior, `line-clamp-2`, drop-shadow forte para legibilidade
- **Overview**: `text-xs`, `line-clamp-2`, `max-w-[90%]` — texto curto para não poluir no mobile
- **Pill** de content_type (Filme/Série) discreto acima do título

### Interação Mobile
- **Swipe** via touch: controle por `touchstart`/`touchend` com threshold de 50px para trocar slide
- **Auto-rotação**: a cada 4s, pausa ao tocar
- **Dots de navegação**: na parte inferior, área de toque mínima de 44px entre dots
- **Transição**: fade simples com `AnimatePresence` do framer-motion

### Gradiente e Legibilidade
- Gradiente forte de baixo: `from-black/90 via-black/50 to-transparent` cobrindo 2/3 inferior
- Garante que texto branco sobre qualquer imagem seja legível no sol (telas mobile ao ar livre)

### Dados
- Usa `useActiveNewsReleases()` existente — sem mudança no banco ou hooks
- Sem mudança no `Index.tsx` — componente já está posicionado

