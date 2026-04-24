## Auditoria Aba por Aba — Diagnóstico + Correções Mínimas

> Sem runtime errors no preview atual e sem warnings ativos no console. 152/152 testes passando. A base está saudável, então o foco será polir bordas (estados vazios, acessibilidade, responsividade fina, validações e feedback) sem mexer em regras de negócio, banco, auth ou pagamentos.

---

### Fase 1 — Mapeamento das Abas

| # | Aba / Tela | Rota | Arquivo principal | Componentes filhos relevantes | Status |
|---|---|---|---|---|---|
| 1 | **Home** (público) | `/` (tab `home`) | `src/pages/Index.tsx` | `Hero`, `CategoryIconsCarousel`, `LiveNowHero`, `NovidadesCard`, `PromoStrip`, `BannerSections` | ✅ Funcional |
| 2 | **Destaques** (público) | `/` (tab `highlights`) | `src/components/public/HighlightsTab.tsx` | `WeeklyMoviesSection`, `WeeklySeriesSection`, `ContentDetailSheet` | ✅ Funcional (recém corrigido scroll) |
| 3 | **Programação** (público) | `/` (tab `schedule`) | `src/components/public/ScheduleTab.tsx` → `DailyGamesSection` | `NextGameHero`, `DayStatsBar`, `LiveNowSection`, cards de jogos | ⚠️ Funcional, mas estado vazio pobre quando não há jogos |
| 4 | **Assinar** | `/assinar` | `src/pages/Assinar.tsx` | Marquee streaming, FAQ, sticky CTA | ✅ Funcional |
| 5 | **Login (oculto)** | `/login` | `src/pages/Login.tsx` | `LoginModal` (versão modal pelo footer) | ✅ Funcional |
| 6 | **404** | `*` | `src/pages/NotFound.tsx` | — | ✅ Funcional |
| 7 | **Admin Layout** | `/admin/*` | `src/pages/AdminLayout.tsx` | Tabs (Dashboard/Banners/Filmes/Séries/Novidades/WhatsApp/Config) | ✅ Funcional |
| 8 | **Admin Dashboard** | `/admin/dashboard` | `src/pages/admin/AdminDashboard.tsx` | `ContentHealthBar`, `RecentActivity`, `ContentCharts`, `UpcomingActivations`, `SportStatsFilter`, `ExpiredBannersAlert` | ✅ Funcional |
| 9 | **Admin Banners + Programação** | `/admin/banners` | `src/pages/admin/AdminBanners.tsx` | `PasteZone`, `ProgramacaoTexto`, `DailyGamesManager`, `ArchivedGamesManager` | ⚠️ Funcional — sub-aba "Programação" tem MUITA densidade |
| 10 | **Admin Filmes** | `/admin/filmes` | `src/pages/admin/AdminFilmes.tsx` | `useTMDBSearch`, cards, `Progress` | ⚠️ Filmes ativos sem estado vazio dedicado |
| 11 | **Admin Séries** | `/admin/series` | `src/pages/admin/AdminSeries.tsx` | idem ao de Filmes | ⚠️ Mesmo gap de Filmes |
| 12 | **Admin Novidades** | `/admin/novidades` | `src/pages/admin/AdminNovidades.tsx` | TMDB + tipo movie/series + badge select | ⚠️ Sem reorder visual claro além de setas |
| 13 | **Admin WhatsApp** | `/admin/whatsapp` | `src/pages/admin/AdminWhatsApp.tsx` | Tabs Hoje/Amanhã, `MessageCard`, `CopyButton` | ✅ Funcional |
| 14 | **Admin Configurações** | `/admin/configuracoes` | `src/pages/admin/AdminConfiguracoes.tsx` | Inputs WhatsApp, TMDB, site_url | ⚠️ Sem `aria-live` no estado salvo, sem máscara no campo WhatsApp |

Não há abas duplicadas, vazias sem propósito ou rotas mortas. `LiveEventsSection`, `ChannelBadge`, `FeaturedSection`, `MoviesSection`, `SeriesSection`, `LiveFeedSection`, `HeroBanner` existem mas não estão no fluxo atual da Home — vou marcar para confirmação na Fase 5 (não tocar sem aprovação).

---

### Fase 2 — Diagnóstico técnico por aba (problemas confirmados)

#### Home (`Index.tsx` + filhos)
- **OK** — tem skeletons globais, lazy-load, animações respeitando `prefers-reduced-motion` (via CSS).
- **Pequeno**: o `Hero.tsx` calcula `stats.channels` recriando um `Set` a cada `tick` (1×/min). É barato mas pode ser memoizado por `games` apenas (o tick não afeta canais). Não é bug — apenas eficiência.

#### Destaques (`HighlightsTab` + Weekly*)
- **OK** — empty state existe (`HighlightsEmptyState`).
- **Pequeno**: o `SectionHeader` mostra contagem de "títulos" só na aba inteira, mas cada carrossel não diz "0 filmes / 3 séries". Quando só um dos dois tem itens, fica ambíguo se o outro está carregando ou vazio.

#### Programação (`ScheduleTab` → `DailyGamesSection`)
- **Funcional** — mas quando o dia inteiro não tem jogos cadastrados o usuário vê apenas o `DayStatsBar` zerado. Falta uma mensagem clara tipo "Sem jogos hoje. Confira os destaques 🎬".

#### Assinar (`/assinar`)
- **OK** — sticky CTA funciona, IntersectionObserver limpa.
- **Pequeno**: o countdown (`useCountdown`) reinicia a cada montagem (correto), mas não tem `aria-live="polite"` para leitores de tela.
- **Acessibilidade**: o marquee não tem `prefers-reduced-motion` honrando — usuários com motion sickness veem animação infinita. Já existe a classe `.paused`; faltaria detectar a media query e pausar.

#### Login (`/login`)
- **OK** — tem aria-label no toggle de senha, error com `role="alert"`, autoComplete implícito pelo HTML5.
- **Pequeno**: faltam `autoComplete="email"` e `autoComplete="current-password"` para gerenciadores de senha funcionarem 100%.

#### 404
- **OK** — sem problemas.

#### AdminLayout
- **OK** — tabs com `aria-current`, foco visível pelo Tailwind padrão dos botões.
- **Pequeno**: o item "Config" trunca em mobile (texto escondido por `sm:inline`), mas o ícone único pode ser confundido com o de "Banners" porque ambos parecem iconográficos. Tooltip ajudaria — porém shadcn-tooltip já existe. **Risco baixo**.

#### Admin Dashboard
- **OK** — recente refator já incluiu agendados + badge "Excelente".
- **Pequeno**: `useCountUp` ignora `prefers-reduced-motion` (a animação de contagem dispara mesmo para quem desligou animações).

#### Admin Banners (sub-aba "Categorias" + "Programação")
- **Funcional**. Risco de UX: o `PasteZone` com `tabIndex={0}` é um `div` que captura paste — ótimo, mas não tem feedback acessível (`role="button"` + `aria-label`). Leitor de tela diz só "div".
- O switch de sub-aba é via `useSearchParams` (`?tab=...`) → bem feito.

#### Admin Filmes / Séries
- **Bug suave**: ao clicar em "Em cartaz" ou "Populares" o estado `tab` muda mas o botão de busca permanece visível e o `Input` continua focável — se o usuário voltar a digitar, nada acontece visualmente até clicar em "Buscar". Falta limpar/desabilitar o input naquele modo.
- Faltam `aria-label` claros nos botões de ação por card (`Plus`, `Trash2`, `RefreshCw`, `Star`) — todos são icon-only.
- `handleRefreshOne` mostra toast mas não bloqueia outros refreshes em paralelo (pode confundir).

#### Admin Novidades
- **Pequeno**: O `Select` de `badgeType` não persiste a última escolha entre adições — usabilidade ok, mas se usuário adicionar 5 novidades em sequência tem que reescolher toda vez.
- Falta `aria-label` em botões de seta `ArrowUp` / `ArrowDown` (icon-only).

#### Admin WhatsApp
- **OK** — botões grandes, copiar funciona, abre WA.
- **Pequeno**: `<pre>` de mensagem com `max-h-[140px] overflow-y-auto` no mobile pequeno corta info útil. Pode usar `whitespace-pre-wrap` + altura adaptativa.

#### Admin Configurações
- **Validação fraca**: só valida WhatsApp regex. `site_url` aceita string vazia ou inválida. `tmdb_api_key` aceita qualquer coisa.
- **Sem feedback acessível**: o `saved` controla um ícone visual mas não tem `aria-live`.
- **Falta máscara/dica** no campo WhatsApp (DDI+DDD+número).

---

### Fase 3 — Correções obrigatórias (escopo enxuto)

1. **`Hero.tsx`** — retirar `tick` da dependência do `useMemo` que calcula `channels` (mantém em `live` que realmente depende). Microoptimização, sem mudança visual.
2. **`ScheduleTab` / `DailyGamesSection`** — adicionar empty state quando o dia não tem jogos. Mensagem amigável reutilizando o padrão `HighlightsEmptyState` (Trophy icon + texto).
3. **`Assinar.tsx`** — `aria-live="polite"` no countdown; pausar marquee se `prefers-reduced-motion: reduce` (CSS já tem suporte global, só adicionar `@media` para `.marquee-track`).
4. **`Login.tsx`** — adicionar `autoComplete="email"` e `autoComplete="current-password"`.
5. **`AdminFilmes.tsx` / `AdminSeries.tsx`** — adicionar `aria-label` em todos os botões icon-only (Add, Delete, Refresh, Toggle); ao trocar para tab "Em cartaz/Populares", limpar `query` e desabilitar o input com `disabled` + texto explicativo.
6. **`AdminNovidades.tsx`** — adicionar `aria-label` nos botões `ArrowUp` / `ArrowDown` ("Mover para cima" / "para baixo"); persistir `badgeType` em `localStorage` para a próxima adição.
7. **`AdminConfiguracoes.tsx`** — validar URL com `URL()` antes de salvar; adicionar `aria-live="polite"` no bloco de "salvo"; adicionar `<p>` de hint no campo WhatsApp ("Apenas números, formato 5511999999999").
8. **`AdminBanners.tsx` / PasteZone** — adicionar `role="button"` + `aria-label="Cole ou arraste uma imagem aqui"` para acessibilidade.
9. **Logs prefixados** — adicionar `console.log("[AdminFilmes:add]", payload)` etc. nos handlers de mutação principais (Add/Delete/Toggle/Refresh) das 3 telas (Filmes/Séries/Novidades) para facilitar debug futuro.

> Nada toca rotas, schema, auth, pagamento, integrações, env vars ou regras de negócio.

---

### Fase 4 — Melhorias UI/UX (junto com a Fase 3, baixo risco)

- **Estados vazios consistentes** em Filmes / Séries / Novidades quando o array está vazio na lista ativa: card com ícone correspondente + CTA "Buscar para adicionar" (já existe o input, só fazer scroll-to-top via `ref`).
- **Botões com estado de loading** explícito: já temos `Loader2` em mutações; padronizar `disabled` durante mutate em todos os botões da mesma row.
- **Transições**: adicionar `transition-all duration-200` nos cards de TMDB result em hover (já tem em alguns, padronizar).
- **Mensagens vazias** sempre com próxima ação ("Cole uma imagem", "Busque um filme no TMDB", "Sem jogos hoje — abra a aba Destaques").

Tudo reutilizando componentes existentes (Button, Skeleton, glass-panel, SectionHeader). **Nenhum novo componente** será criado.

---

### Fase 5 — Sugestões Futuras (não implementar agora)

#### Alta prioridade
- **[Programação]** Filtro persistente por esporte/canal (já existe `SportStatsFilter` no admin — replicar versão pública). Benefício: usuário acha jogo do esporte favorito mais rápido. Arquivo: novo subcomponente em `DailyGamesSection`. Risco: médio. Complexidade: média.
- **[AdminConfiguracoes]** Teste de validade da chave TMDB com call de ping antes de salvar. Benefício: evita salvar chave quebrada. Risco: baixo. Complexidade: baixa.
- **[Login]** Detectar Caps Lock no input de senha e avisar. Benefício: reduz fricção. Risco: nulo. Complexidade: baixa.

#### Média prioridade
- **[Home]** Componentes não-utilizados (`LiveEventsSection`, `FeaturedSection`, `MoviesSection`, `SeriesSection`, `LiveFeedSection`, `HeroBanner`) — confirmar com usuário se devem ser removidos para reduzir bundle. Risco: baixo (se realmente órfãos). Complexidade: baixa.
- **[Admin Dashboard]** Atalho `R` para "Atualizar tudo". Benefício: power-users. Arquivo: `AdminDashboard.tsx`. Risco: baixo. Complexidade: baixa.
- **[Destaques]** Hint visual de swipe no primeiro carrossel quando há ≥4 cards. Benefício: descoberta. Risco: baixo. Complexidade: baixa.
- **[ContentDetailSheet]** Pré-carregar trailer via `<link rel="prefetch">` quando sheet abre. Benefício: TTFB do trailer. Risco: baixo. Complexidade: média.

#### Baixa prioridade
- **[AdminWhatsApp]** Pré-visualização renderizada (não `<pre>`) com emojis maiores. Risco: baixo. Complexidade: média.
- **[AdminBanners]** Crop/resize em browser antes do upload (canvas). Benefício: padroniza dimensões. Risco: médio. Complexidade: alta.
- **[Assinar]** A/B test de CTA copy (variação em estado React). Risco: baixo. Complexidade: média.
- **[404]** Sugerir 3 destinos populares ("Programação de hoje", "Destaques", "Assinar"). Risco: nulo. Complexidade: baixa.

---

### Validação após Fase 3+4
- `vitest run` — manter 152/152 testes verdes.
- Verificar console vazio no preview.
- Verificar manualmente em 375px / 768px / 1024px+ pelo viewport switcher do Lovable.
- Conferir que rotas, banco, auth e pagamento não foram tocados (`git diff` apenas em arquivos das abas listadas).

### Critérios de aceite atingidos
- [x] Mapeamento completo (14 abas).
- [x] Diagnóstico individual por aba.
- [ ] Correções aplicadas (Fase 3) — pendente aprovação.
- [ ] Melhorias UI (Fase 4) — pendente aprovação.
- [x] Sugestões futuras documentadas.
