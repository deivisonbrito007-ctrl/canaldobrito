

# Auditoria do Portal Mobile

## Problemas Identificados

### 1. Variáveis de debug ainda no código
- `LiveNowSection.tsx` ainda tem `DEBUG_FORCE_LIVE` e `DEBUG_LIVE_COUNT` no código. Mesmo desativadas, poluem o componente e podem ser ativadas acidentalmente.

### 2. App.css com estilos não utilizados
- O arquivo `src/App.css` contém estilos do template Vite padrão (`logo-spin`, `.read-the-docs`, `#root` com padding/text-align) que conflitam com o layout e não são usados.

### 3. Footer sobreposto pelo BottomNav
- O `PublicFooter` tem `pb-20` mas o conteúdo pode ficar parcialmente coberto pelo bottom nav fixo dependendo do safe-area-inset.

### 4. Acessibilidade — botões sem aria-label
- Os botões do `BottomNav` não possuem `aria-label`, dificultando navegação por leitores de tela.
- Botões de filtro no `DailyGamesSection` também não têm labels acessíveis.

### 5. NewsReleasesSection — overview escondido em telas < 380px
- O texto de descrição usa `hidden min-[380px]:block`, cortando informação importante em telas de 320px.

### 6. Performance — motion animations sem `layout` ou `willChange`
- Muitos cards usam `framer-motion` com animações de entrada mas sem `will-change: transform` para otimizar GPU.

### 7. CategoryIconsCarousel — marquee pode causar motion sickness
- O auto-scroll infinito não respeita `prefers-reduced-motion`.

## Plano de Correções

### Arquivo: `src/components/public/LiveNowSection.tsx`
- Remover `DEBUG_FORCE_LIVE`, `DEBUG_LIVE_COUNT` e toda lógica condicional de debug.

### Arquivo: `src/App.css`
- Limpar estilos não utilizados do template Vite (manter arquivo mínimo ou vazio).

### Arquivo: `src/components/public/BottomNav.tsx`
- Adicionar `aria-label={item.label}` nos botões de navegação.

### Arquivo: `src/components/public/NewsReleasesSection.tsx`
- Trocar `hidden min-[380px]:block` por `block` para mostrar overview em todas as telas (com `line-clamp-2`).

### Arquivo: `src/components/public/CategoryIconsCarousel.tsx`
- Adicionar `@media (prefers-reduced-motion: reduce)` para pausar o marquee.

### Arquivo: `src/index.css`
- Adicionar regra para pausar animações quando `prefers-reduced-motion` está ativo.

### Arquivo: `src/pages/Index.tsx`
- Aumentar `pb-24` para `pb-28` no main para garantir espaço extra para o bottom nav com safe-area.

