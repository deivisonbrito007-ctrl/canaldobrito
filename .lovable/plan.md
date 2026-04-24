## Plano: Corrigir build errors + Polir Home

### Fase 1 — Corrigir os 6 erros de TypeScript em `src/sw.ts`

Instalar como devDependencies os pacotes do Workbox que já são usados em runtime pelo `vite-plugin-pwa`, mas estão sem types:

```bash
bun add -d workbox-precaching workbox-core workbox-routing workbox-strategies workbox-expiration
```

Isso resolve automaticamente:
- TS2307 nos 5 imports
- TS2339 do `__WB_MANIFEST` (declarado por `workbox-precaching`)

**Risco:** baixo. Sem mudança de runtime — só types.

---

### Fase 2 — Polir Home (pontos finos)

**a) Logs prefixados** (sem mudar lógica):
- `src/components/public/CategoryIconsCarousel.tsx` → `console.log('[Home:category-select]', cat.label)` em `handleClick`.
- `src/components/public/NovidadesCard.tsx` → `console.log('[FeaturedCarousel:navigate]', dir)` em `prev()`/`next()`.
- `src/components/public/LiveNowHero.tsx` → `console.log('[LiveNow:view-all]', true)` no botão "Ver todos →".

**b) Aria-labels faltantes:**
- `LiveNowHero.tsx`: `aria-label` no botão "Ver todos →" e no botão expand "Ver todos os X jogos".
- `Hero.tsx`: `role="group"` + `aria-label="Estatísticas de hoje"` no container das 3 stats.
- `AppNavbar.tsx`: `aria-label="Assinar Canal do Brito"` no link "Assine já".

**c) Contraste do badge "X jogos"** em `LiveNowHero.tsx`:
Subir de `bg-destructive/15` para `bg-destructive/20` (melhora WCAG sem quebrar estética).

---

### Fase 3 — Validação

1. `bunx tsc --noEmit` → esperado **0 erros**.
2. `bunx vitest run` → esperado **152/152 passando**.
3. Console no preview → esperado 0 erros, com logs `[Home:...]`, `[FeaturedCarousel:...]`, `[LiveNow:...]` aparecendo nas interações.

---

### O que **NÃO** será feito
- ❌ Criar `Home.tsx`, `Header.tsx`, `CategoryTabs.tsx` etc. — duplicariam `Index.tsx`, `AppNavbar.tsx`, `CategoryIconsCarousel.tsx` que já existem.
- ❌ Reescrever Hero/LiveNow/Novidades — visual já bate com o screenshot e quebraria os 152 testes.
- ❌ Mexer em rotas, auth, Supabase, billing, schema.

---

### Sugestões Futuras (não executar agora)
- **Alta**: Prefetch da próxima imagem do carrossel Novidades.
- **Média**: Mostrar data no header também em mobile (`text-[10px]`).
- **Baixa**: Setas prev/next opcionais no `CategoryIconsCarousel` em desktop.