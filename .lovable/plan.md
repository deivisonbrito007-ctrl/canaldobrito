## Diagnóstico

A captura mostra o `ContentDetailSheet` (bottom sheet) sendo renderizado **atrás da BottomNav**, com a parte inferior cortada e o conteúdo (poster/título "COMO MÁGICA") escondido pela barra de navegação. Isso é o bug visual reportado no mobile.

Investigando o código encontrei três problemas reais:

### 1. z-index conflitante (causa principal do bug visual)
- `BottomNav` usa `z-50`
- `ContentDetailSheet` usa `z-[60]` ✔ (acima da nav)
- **Mas** `Index.tsx` envolve a página em `<AnimatePresence>` + `motion.div` que cria um novo *stacking context*. Como a `<main>` tem `z-10` e o sheet é renderizado como filho dela (via portal-less `fixed`), o `position: fixed` do sheet fica preso ao stacking context da `motion.div` ancestral (que está abaixo do `BottomNav` `z-50`). Resultado: o sheet aparece visualmente **abaixo** da BottomNav no mobile, mesmo com `z-[60]`.
- Mesmo problema afeta o `TrailerModal` (`z-[70]`) — também fica preso pelo `motion.div` ancestral em alguns navegadores mobile (Chrome Android, conforme screenshot).

### 2. `padding-bottom` insuficiente no sheet
- `ContentDetailSheet` usa `paddingBottom: calc(6rem + env(safe-area-inset-bottom))` no conteúdo interno, mas o sheet em si tem `max-h-[85vh]` e termina em `bottom-0`. A `BottomNav` tem ~64px + safe-area, então o conteúdo final do sheet (botões, links) fica encoberto.

### 3. Sheet/Modal não usam React Portal
- Por estar dentro do `motion.div` da página, qualquer transformação/animação do ancestral também afeta o `position: fixed` (bug conhecido do CSS: `transform` em ancestral quebra `fixed`).

## Plano de Correção

### A. Renderizar overlays via Portal (`createPortal` para `document.body`)
Refatorar `ContentDetailSheet.tsx` e `TrailerModal.tsx` para envolver o `<AnimatePresence>` em `createPortal(..., document.body)`. Isso resolve o bug raiz: os overlays escapam do stacking context da página animada e respeitam de fato seu `z-index` global, tanto em mobile quanto desktop.

### B. Ajustar offsets do BottomNav
- Em `ContentDetailSheet`: aumentar `max-h` para `90vh` e elevar o `bottom` final acima da BottomNav quando aberto (ou simplesmente usar portal + manter z-[60], já que a nav some atrás do backdrop). Garantir `paddingBottom` final do conteúdo scroll = `calc(7rem + env(safe-area-inset-bottom))`.
- Em `TrailerModal`: já está centralizado; com portal o `z-[70]` passa a funcionar e fica acima de tudo.

### C. Esconder BottomNav quando há overlay aberto (UX bonus)
Pequena melhoria: quando `sheetOpen` ou `trailerItem` ativos, emitir um evento ou usar contexto para esconder a `BottomNav` (ou usar `inert` + `aria-hidden`). Alternativa mais simples: aumentar o backdrop do sheet para cobrir 100vh (já está `inset-0`), o que com portal já resolve visualmente.

### D. Corrigir `dragSnapToOrigin` em iOS
`framer-motion` `dragSnapToOrigin` em iOS pode falhar ao recolocar o sheet quando o usuário solta abaixo do threshold. Garantir reset explícito de `dragY.set(0)` no `onDragEnd` quando não dispara o close.

### E. Garantir que clicks no card abrem corretamente em desktop
`NovidadesCard.handleCardClick` depende de `didSwipe.current`, mas `didSwipe` só é setado em `onTouchEnd` (mobile). No desktop funciona ok. Sem mudança necessária.

## Arquivos a editar

1. `src/components/public/ContentDetailSheet.tsx` — adicionar `createPortal`, ajustar paddings, fix do `dragY` reset.
2. `src/components/public/TrailerModal.tsx` — adicionar `createPortal`.
3. (opcional) `src/components/public/BottomNav.tsx` — aceitar prop `hidden` e esconder com transition; controlar via estado em `Index.tsx` se quisermos a melhoria UX bonus.

## Sugestões adicionais (opcionais, posso aplicar junto)

- **Loading do trailer**: hoje o `useTrailerKey` é refeito a cada abertura. Cachear por `tmdb_id` (já existe `useTrailerAvailability` parcial) para abertura instantânea ao reabrir o mesmo conteúdo.
- **Acessibilidade**: adicionar `role="dialog"` + `aria-modal="true"` + focus trap no `ContentDetailSheet` e `TrailerModal`.
- **ESC para fechar**: já não é tratado nos overlays — adicionar listener de `Escape` (ajuda em desktop).
- **Bloqueio de scroll do body** quando overlay aberto (`overflow: hidden` no `<body>`), evitando scroll de fundo no mobile.

## Testes

- Atualizar testes existentes do `NovidadesCard` para mockar `createPortal` (ou simplesmente confirmar que renderiza em `document.body`).
- Adicionar teste novo: `ContentDetailSheet.test.tsx` cobrindo: abre, mostra título, botão fechar dispara `onClose`, ESC fecha.
- Rodar `bunx vitest run` ao final.
