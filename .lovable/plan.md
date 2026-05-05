## Aba "Ao Vivo" — visual premium

Modernizar `ChannelBadge`, `LiveNowSection`, `LiveFeedSection` e `LiveEventsSection` com gradientes, glows, animações e melhor hierarquia. Sem mudanças de banco/lógica — apenas visual e ergonomia.

### 1. `ChannelBadge.tsx` — refazer

- Estender `ChannelConfig` com `gradient` (Tailwind `from-… to-…`) e `glow` (`shadow-[0_0_…]`).
- Tamanhos: prop nova `size?: "sm" | "md" | "lg"` (default `md`).
  ```ts
  const SIZE_CLASSES = {
    sm: "text-[9px] px-1.5 py-0.5 gap-0.5 rounded-md",
    md: "text-[10px] px-2 py-1 gap-1 rounded-lg",
    lg: "text-[11px] px-2.5 py-1.5 gap-1.5 rounded-lg",
  };
  ```
- Hover: `transition-all duration-200 hover:scale-105 hover:brightness-110`.
- Aplicar `bg-gradient-to-r ${gradient}` + `glow` por canal.
- Adicionar canais novos: **YouTube** (vermelho, short `YT`), **DAZN** (amarelo).
- Mapa de cores conforme tabela do prompt (ESPN, SporTV, Premiere, Disney+, CazéTV, TNT, Prime, Max, Band, Record, GOAT, ge tv, Space, YouTube, DAZN).
- Canal do Brito mantém logo PNG, ganha glow âmbar mais forte e gradiente tri-cor (vermelho→laranja→âmbar).

### 2. `LiveNowSection.tsx` (carrossel)

- Card: `border-destructive/30`, hover `-translate-y-1.5` + `shadow-[0_12px_32px_hsl(0,84%,60%,0.25)]` + `hover:border-destructive/50`, `group`.
- Barra de acento: gradiente já existe — adicionar `relative overflow-hidden` e camada interna `animate-shimmer` (linear-gradient transparente → branco/15% → transparente).
- Badge LIVE: envolver em `div` com `bg-destructive/15 border border-destructive/30 rounded-full px-2 py-0.5` para dar contêiner.
- Separador VS/X: `bg-gradient-to-br from-destructive/25 to-destructive/10 border-destructive/30`, texto `font-extrabold`.
- Times: `font-extrabold` (já é `font-bold`).
- Canais: mostrar até **3** (era 2) via `slice(0, 3)`, contador `+N` quando exceder, `size="sm"` em mobile.
- Footer com `bg-muted/20` envolvendo time + canais.

### 3. `LiveFeedSection.tsx` (grid)

- Card: `hover:-translate-y-1 hover:shadow-[0_8px_24px_hsl(0,84%,60%,0.2)] hover:border-destructive/40`.
- Barra de acento: adicionar shimmer overlay igual ao LiveNow.
- Badge LIVE com contêiner arredondado (mesmo padrão do LiveNow).
- Separador VS com gradiente sutil `bg-gradient-to-br from-destructive/15 to-destructive/5` em vez de `bg-surface`.
- Permitir até 2 canais visíveis + contador (hoje mostra só 1).
- Footer com `bg-muted/20`.

### 4. `LiveEventsSection.tsx` (F1, MMA, surf)

- Mesmas melhorias do LiveFeed mas com **tema âmbar**:
  - Acento: `from-amber-500/80 via-orange-500/60 to-transparent` + shimmer.
  - Badge LIVE: contêiner `bg-amber-500/15 border-amber-500/30`.
  - Hover: `hover:border-amber-500/40 hover:shadow-[0_8px_24px_rgba(245,158,11,0.18)]`.

### 5. CSS — `src/index.css`

Adicionar utilitário (perto da `@keyframes shimmer` existente, que é para skeleton):
```css
@keyframes shimmer-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer-sweep {
  animation: shimmer-sweep 2.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer-sweep { animation: none; }
}
```
(Nome diferente do `shimmer` existente para não conflitar com skeleton.)

### Mobile-first

- Em telas <640px: badges usam `size="sm"` automaticamente quando passado `size="md"` em mobile (ou simplesmente fixar `size="sm"` nas seções via `useIsMobile`).
- Hierarquia: máx. 3 canais visíveis no LiveNow / 2 no LiveFeed.
- Touch targets ≥44px nos cards permanecem (já são).

### Acessibilidade

- Manter `prefers-reduced-motion`: shimmer e pulse desativados (já tratado globalmente; reforçar para `.animate-shimmer-sweep`).
- Contraste AA: textos `text-*-300` sobre `bg-*-600/25` passam.

### Arquivos editados

- `src/components/public/ChannelBadge.tsx` — gradientes, glows, prop `size`, novos canais
- `src/components/public/LiveNowSection.tsx` — shimmer no acento, contêiner LIVE, separador melhor, +1 canal
- `src/components/public/LiveFeedSection.tsx` — mesmo tratamento + footer com bg
- `src/components/public/LiveEventsSection.tsx` — tema âmbar consistente
- `src/index.css` — keyframe `shimmer-sweep`

Sem novas dependências, sem mudanças no schema do banco, sem alteração de lógica de negócio.
