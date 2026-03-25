

## Problema

O carrossel horizontal de filmes/series na aba Destaques usa scroll nativo (`overflow-x-auto`), mas o container pai (`motion.div` no Index.tsx) tem `drag="x"` para swipe entre abas. Resultado: ao tentar rolar os cards horizontalmente, o gesto e capturado pelo drag de abas, mudando de aba em vez de rolar o carrossel.

## Solucao

Detectar quando o usuario esta interagindo com um carrossel horizontal e bloquear o drag de abas nesse caso.

### Alteracoes

**1. Index.tsx — Bloquear drag quando toque inicia em area de scroll horizontal**

- Adicionar `onDragStart` que verifica se o elemento tocado (ou um ancestral proximo) tem `overflow-x: auto/scroll` ou um atributo `data-horizontal-scroll`.
- Se sim, cancelar o drag retornando `false` ou setando uma flag que faz `onDragEnd` ignorar o swipe.
- Alternativa mais robusta: usar `dragListener={false}` + `dragControls` e so iniciar o drag quando o toque nao esta sobre um carrossel.

**Abordagem escolhida**: Adicionar `data-horizontal-scroll` nos containers de carrossel e usar `onDragStart` para verificar:

```tsx
// Index.tsx - no motion.div
onDragStart={(e) => {
  const target = e.target as HTMLElement;
  if (target.closest("[data-horizontal-scroll]")) {
    return false; // framer-motion ignora
  }
}}
```

**2. WeeklyMoviesSection.tsx e WeeklySeriesSection.tsx — Marcar carrosseis**

Adicionar `data-horizontal-scroll` e `touch-action: pan-x` no container flex de scroll:

```tsx
<div
  data-horizontal-scroll
  className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 pb-2"
  style={{ touchAction: "pan-x" }}
>
```

**3. Tambem aplicar nos outros carrosseis horizontais da home** (LiveNowHero match cards, CategoryIconsCarousel) para consistencia.

### Arquivos modificados
- `src/pages/Index.tsx` — drag guard no `onDragStart`
- `src/components/public/WeeklyMoviesSection.tsx` — `data-horizontal-scroll` + `touch-action: pan-x`
- `src/components/public/WeeklySeriesSection.tsx` — idem
- `src/components/public/LiveNowHero.tsx` — idem no carrossel de matches
- `src/components/public/CategoryIconsCarousel.tsx` — idem

