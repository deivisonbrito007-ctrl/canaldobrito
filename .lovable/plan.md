# Refatoração cinematográfica de Filmes & Séries (v3)

Reconstrução completa da `NovidadesPage` para parecer um streaming premium real (Netflix / Prime / Apple TV) com foco em mobile-first e usuário vindo do WhatsApp Status. Mantém a Bottom Nav atual (2 botões) e o backend existente.

**Mudança v3** (sobre v2): adicionado um **plano de proteção contra regressões** para garantir que nada quebre — mapeamento explícito do que é tocado, fallbacks, smoke checks e estratégia de rollback.

## Escopo confirmado

- Trilhas: `🆕 Lançamentos`, `🎬 Filmes da Semana`, `📺 Séries da Semana`. Sem "Em Alta" e sem "Exclusivos".
- Hero cinematográfico com auto-rotate, swipe só dentro do hero.
- CTA `▶ Assistir Trailer` abre `TrailerModal` via `useTrailerKey` (já existe).
- Sem favoritos, sem "continue assistindo", sem mudança de Bottom Nav, sem migrations.

## Estrutura final

```text
CinemaHero (auto-rotate)
CinemaCategoryRail (chips Apple TV)
PosterRail "🆕 Lançamentos"
PosterRail "🎬 Filmes da Semana"
PosterRail "📺 Séries da Semana"
PremiumCTA → /assinar
Grid filtrada (só quando chip ≠ Todos)
```

## Componentes novos (`src/components/public/cinema/`)

- `CinemaHero.tsx` — backdrop full-bleed `60vh`/`70vh`, badges, sinopse 2 linhas, dois CTAs, auto-rotate 7s, `framer-motion` cross-fade. `React.forwardRef`.
- `PosterRail.tsx` + `PosterCard.tsx` — scroll horizontal `snap-mandatory scrollbar-hide`, `mask-image` nas bordas, posters `aspect-[2/3]` maiores que hoje, hover/tap sutil.
- `CinemaCategoryRail.tsx` — chips glass com 1 camada de glow `primary/15`. Reaproveita `FilterId` e `stats` da página atual.
- `PremiumCTA.tsx` — banner `rounded-3xl`, gradiente sutil, CTA largura total `min-h-[52px]` → `/assinar`.
- `CinemaSearchButton.tsx` — refino visual; abre o `SearchModal` existente.
- `useCinemaShelves.ts` — hook único: combina `useActiveNewsReleases` + `useActiveMovies` + `useActiveSeries` e retorna `{heroItems, shelves, allForSearch}`. Centraliza a derivação para facilitar ligar/desligar trilhas opcionais (`Novas Temporadas`, `Mais Bem Avaliados`) no futuro.

## Mudanças nos componentes existentes

- `NovidadesPage.tsx` reescrita: passa a usar os componentes acima. Mantém hooks, `SearchModal`, `ContentDetailSheet`, atalho `/`, lógica de filtros e ordenação. `viewMode` (grid/list) removido — só grid premium na grade filtrada.
- `src/index.css` — adicionar `--primary-hover` se faltar; classe `cinema-bg-noise` opcional. Sem mexer em tokens existentes.

## Plano anti-regressão (novo)

### O que **NÃO** vou tocar

- `src/integrations/supabase/*` — nada de schema/types.
- Hooks de dados (`useNewsReleases`, `useMovies`, `useSeries`, `useTrailerKey`, `useTrailerAvailability`) — só consumo.
- Toda a aba `Programação` (`ProgramacaoTab`, `LiveHeroCard`, `SportSection`, etc.).
- Bottom Nav, `Index.tsx`, `App.tsx` rotas.
- Admin inteiro (`/admin/**`).
- `ShareRedirect`, `whatsappText`, `agendaRedirect` (helpers que acabamos de proteger).
- Service worker / PWA / push notifications.

### Mapeamento de impacto antes de codar

Antes de criar arquivos, rodar `rg` para confirmar todos os consumidores dos componentes que vou parar de importar:

- `NovidadesCard`, `WeeklyMoviesSection`, `WeeklySeriesSection`, `HeroBanner`.
- Se algum aparecer em outra rota (admin, E2E, share), **não** removo do repo — apenas paro de importar em `NovidadesPage`.
- Lista de consumidores vai virar comentário no topo do `NovidadesPage` para auditoria futura.

### Fallbacks e estados degradados

- **Sem dados**: cada `PosterRail` retorna `null` quando `items.length === 0`. `CinemaHero` cai num placeholder estático com CTA `Assinar agora` se `heroItems.length === 0`. Nada de seção vazia.
- **Sem `backdrop_url`**: hero usa `image_url` (poster) com `object-cover` + blur de fundo do mesmo poster (técnica Spotify) — nunca renderiza preto.
- **Sem `tmdb_id` ou trailer indisponível** (`useTrailerAvailability` falsy): CTA `▶ Assistir Trailer` vira `+ Detalhes` (abre `ContentDetailSheet`) e o ícone muda. Sem botão morto.
- **Erro de rede**: `isError` do React Query mostra skeleton + `EmptyDayState`-like fallback (reutilizo padrão visual já existente).
- **Imagens 404**: `onError` no `<img>` substitui por placeholder `bg-surface-2` + ícone `ImageOff` (já tem em `NovidadesCard`).

### Acessibilidade preservada

- Todos os CTAs com `aria-label`.
- Hero com `role="region" aria-label="Destaques"` e cada slide com `aria-roledescription="slide"`.
- Auto-rotate respeita `useReducedMotion()`.
- Tab order: hero → chips → trilhas → CTA → grid.
- Foco visível mantido (não vou suprimir outline em nenhum componente).

### Performance / mobile

- `useTrailerAvailability` chamado **uma vez** no topo da página com a lista combinada. Mapa distribuído por prop — evita N requests duplicadas que existem hoje (`NovidadesCard` + cada `Weekly*Section` chamam separadamente).
- `loading="lazy"` em backdrops/posters fora do hero. `fetchpriority="high"` no slide ativo.
- Skeletons shimmer (memória global) em todas as seções enquanto `isLoading`.
- Sem layout shift: cada poster tem `aspect-[2/3]` reservado.

### Smoke tests manuais (vou rodar antes de declarar pronto)

1. `/` (home) carrega → aba "Filmes & Séries" abre sem erros no console.
2. Hero rotaciona, swipe horizontal funciona dentro do hero, **não** dispara troca de aba.
3. Tap em poster abre `ContentDetailSheet`.
4. Tap em `▶ Assistir Trailer` abre `TrailerModal`; se trailer indisponível, CTA mostra estado correto.
5. Botão de busca abre `SearchModal`; atalho `/` continua funcionando.
6. Chip de filtro mostra a grade abaixo; chip "Todos" esconde a grade.
7. Aba "Programação" continua intocada (smoke: troco de aba e volto).
8. `/agenda?date=2026-05-20` ainda redireciona para `/programacao?date=2026-05-20` (não mexo nesse caminho, mas confiro).
9. Admin (`/admin/dashboard`) abre sem erro de import.
10. Lighthouse no preview mobile: sem erros de console, sem warnings críticos.

### Tipagem e build

- TypeScript strict mantido. `useCinemaShelves` usa os tipos `NewsRelease`, `Movie`, `Series` exportados pelos hooks.
- Sem `any` em props públicas dos novos componentes.
- O harness roda build automaticamente após cada edit; vou corrigir qualquer erro antes de seguir.

### Rollback fácil

- Toda a lógica nova vive em `src/components/public/cinema/`. Se precisar reverter, basta restaurar a versão anterior de `NovidadesPage.tsx` e apagar a pasta `cinema/`.
- Não removo nenhum arquivo legado nesta passada (`NovidadesCard`, `WeeklyMoviesSection`, etc. ficam no repo). Limpeza física só em uma 2ª passada após observação em produção.

## Sugestões adicionais (opcionais, posso ativar agora ou depois)

- **Trilha "🎞️ Novas Temporadas"** — `badge_type='nova_temporada'`. Some quando vazia.
- **Trilha "⭐ Mais Bem Avaliados"** — `rating>=7.5` ordenado desc, top 12. Substitui bem o "Em Alta" sem repetir o termo.
- **Pré-fetch de detalhes** ao tocar/scrollar o poster (reduz latência ao abrir o sheet).
- **Telemetria** `view_cinema_hero_slide` e `click_cinema_cta` reaproveitando `trackContentClick` para medir o impacto da refatoração.

Por padrão **não ligo nenhuma** sem você confirmar — para manter o escopo enxuto e o risco baixo.

## Arquivos tocados

Criados:
- `src/components/public/cinema/CinemaHero.tsx`
- `src/components/public/cinema/PosterRail.tsx`
- `src/components/public/cinema/PosterCard.tsx`
- `src/components/public/cinema/CinemaCategoryRail.tsx`
- `src/components/public/cinema/PremiumCTA.tsx`
- `src/components/public/cinema/CinemaSearchButton.tsx`
- `src/components/public/cinema/useCinemaShelves.ts`

Editados:
- `src/components/public/NovidadesPage.tsx` (reescrita da composição)
- `src/index.css` (apenas se faltar `--primary-hover`)

Não removidos: `NovidadesCard`, `WeeklyMoviesSection`, `WeeklySeriesSection`, `HeroBanner` ficam intactos no repo.
