

## Auditoria Completa e Melhorias — Canal do Brito

### Resultados da Auditoria

**Estrutura geral**: O sistema esta bem arquitetado com lazy loading, skeleton fallbacks, separacao clara entre componentes publicos e admin, e boas praticas de acessibilidade (aria-labels, min-h 44px touch targets, prefers-reduced-motion).

#### Problemas Identificados

**1. Grain overlay bloqueia interacoes (CRITICO)**
O `.grain-overlay` tem `z-index: 55`, que esta ACIMA do bottom nav (`z-50`) e do header sticky (`z-50`). Embora tenha `pointer-events: none`, isso pode causar problemas de rendering e z-index stacking em alguns browsers mobile.

**2. LiveNowHero — AnimatePresence sem key**
O `AnimatePresence` no `LiveNowHero` nao tem `mode` nem controla a saida corretamente. A `motion.section` dentro nao tem `key`, entao a animacao de `exit` nunca dispara.

**3. Multiplos timers duplicados para "tick" ao vivo**
- `AppNavbar` tem seu proprio `setInterval` de 60s
- `Hero` tem outro `setInterval` de 60s
- `LiveNowHero` tem outro `setInterval` de 60s
- `DailyGamesSection` tem outro

Sao 4 timers independentes fazendo a mesma coisa. Isso causa re-renders descoordenados.

**4. Dashboard admin — grid de stats cortado em mobile**
O grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` com 5 cards deixa o 5o card sozinho numa linha em mobile (2 cols), criando layout assimetrico.

**5. Quick Actions grid assimetrico**
7 botoes em `grid-cols-2` = ultimo botao sozinho. O codigo ja trata isso com `col-span-2`, mas visualmente fica inconsistente.

**6. Falta de testes para LiveNowHero**
O componente novo nao tem testes unitarios.

**7. ContentDetailSheet — dragStart nao cancela drag**
O `handleDragStart` verifica scroll position mas nao faz nada para prevenir o drag (o callback nao pode cancelar o drag no framer-motion).

---

### Plano de Melhorias

**Fase 1 — Correcoes de bugs**

| # | O que | Arquivo |
|---|-------|---------|
| 1 | Reduzir `z-index` do grain overlay de 55 para 1 | `src/index.css` |
| 2 | Corrigir `AnimatePresence` no LiveNowHero — usar key condicional para que exit funcione | `LiveNowHero.tsx` |

**Fase 2 — Melhorias de UI Mobile**

| # | O que | Arquivo |
|---|-------|---------|
| 3 | Dashboard stats: mudar para `grid-cols-3 lg:grid-cols-5` para 5 cards ficarem simetricos (3+2 no mobile, 5 no desktop) | `AdminDashboard.tsx` |
| 4 | Quick Actions: reorganizar para 3 colunas com icones menores no mobile, mantendo 2 colunas no formato atual | `AdminDashboard.tsx` |
| 5 | LiveNowHero header: reduzir fonte do titulo e usar `flex-wrap` para evitar quebra em telas 320px | `LiveNowHero.tsx` |
| 6 | MatchCard: ajustar `min-w` de 280px para 260px em mobile para caber melhor em telas pequenas | `LiveNowHero.tsx` |

**Fase 3 — Performance**

| # | O que | Arquivo |
|---|-------|---------|
| 7 | Extrair hook `useLiveTick()` centralizado para eliminar 4 timers duplicados | Novo `src/hooks/useLiveTick.ts` |
| 8 | Atualizar AppNavbar, Hero, LiveNowHero e DailyGamesSection para usar o hook centralizado | 4 arquivos |

**Fase 4 — Testes**

| # | O que | Arquivo |
|---|-------|---------|
| 9 | Rodar suite existente de 71 testes e reportar resultados | - |
| 10 | Adicionar testes para LiveNowHero (render vazio, render com jogos, contagem correta) | `src/components/public/__tests__/LiveNowHero.test.tsx` |

**Fase 5 — Melhorias adicionais sugeridas**

| # | Sugestao | Impacto |
|---|----------|---------|
| A | **Seletor de data na aba Programacao** — navegar entre ontem/hoje/amanha | Alto — feature solicitada |
| B | **Skeleton no ContentHealthBar** — mostrar skeleton em vez de `null` durante loading | Baixo — CLS |
| C | **Agrupar "Atividade Recente" por tipo** — com tabs filme/serie/banner | Medio — UX admin |
| D | **PWA: badge de "ao vivo" no icone do app** — usando Badge API | Medio — engagement |
| E | **Tema claro para admin** — toggle light/dark no painel | Medio — acessibilidade |

### Arquivos modificados (Fases 1-4)
- `src/index.css` — z-index fix
- `src/components/public/LiveNowHero.tsx` — AnimatePresence fix + mobile ajustes
- `src/pages/admin/AdminDashboard.tsx` — grid mobile
- `src/hooks/useLiveTick.ts` — novo hook centralizado
- `src/components/public/AppNavbar.tsx` — usar useLiveTick
- `src/components/public/Hero.tsx` — usar useLiveTick
- `src/components/public/DailyGamesSection.tsx` — usar useLiveTick
- `src/components/public/__tests__/LiveNowHero.test.tsx` — novo teste

