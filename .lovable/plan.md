
## Auditoria do Dashboard Admin

### O que foi verificado
- Fluxo de dados: `useAllBanners`, `useAllMovies`, `useAllSeries`, `useAllNewsReleases`, `useAllDailyGames(hoje)` — todos com `isLoading`, `isError`, `refetch`, `dataUpdatedAt`.
- Componentes: `ContentHealthBar`, `ExpiredBannersAlert`, `ContentCharts` (Bar+Pie), `SportStatsFilter`, `UpcomingActivations`, `RecentActivity`, Quick Actions.
- Suíte de testes: **72/72 passam** (`bunx vitest run src/pages/admin src/components/admin`).
- Logs do console: limpos (apenas mensagem inócua `RESET_BLANK_CHECK` do harness).

### Issues encontradas

| # | Severidade | Problema |
|---|---|---|
| 1 | Médio | Card "Jogos Hoje" abre `/admin/banners?tab=programacao` mas o param `tab` não é lido em `AdminBanners` — abre sempre na 1ª aba. |
| 2 | Médio | Quick Action "Programação" tem o mesmo problema. |
| 3 | Médio (mobile) | `grid-cols-3` no stat grid → 5 cards quebram em 3+2, com o 4º/5º ocupando colunas desbalanceadas em telas pequenas. Em <360px o `text-2xl` corta. |
| 4 | Baixo | Quick Actions com `grid-cols-3` em mobile gera 7 botões → última linha com 1 item solitário. |
| 5 | Baixo | `getGreeting()` e `now` usam `new Date()` direto — viola memória "Lock all time/date logic to America/Sao_Paulo". |
| 6 | Baixo | `useCountUp` não respeita `prefers-reduced-motion` (memória de acessibilidade). |
| 7 | Baixo | Recharts loga warnings de width/height=0 nos testes (jsdom sem ResizeObserver) — ruído. |
| 8 | Baixo | `lastUpdated` mostra apenas `HH:mm` sem label — usuários não sabem que é "última atualização". |
| 9 | Baixo | Botão refresh não dá feedback visual durante refetch (sem spinner). |
| 10 | Cobertura | Faltam testes para: navegação ao clicar em stat card, alerta de erro, botão refresh, estado loading dos stat cards. |

### Plano de implementação

**1. Roteamento de "Programação" (issues 1, 2)**
- Em `src/pages/admin/AdminBanners.tsx`: ler `useSearchParams()` e mapear `?tab=programacao` para a aba correta no carregamento (e atualizar a URL ao trocar de aba).

**2. Layout responsivo (issues 3, 4)**
- Stat grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (2 colunas em mobile <360px-mid evita corte; 3 em sm).
- Reduzir número da contagem para `text-xl sm:text-2xl` quando muito grande.
- Quick Actions: `grid-cols-2 sm:grid-cols-4` (linhas balanceadas com 7 itens → 2/2/2/1 em mobile, 4/3 em sm+).

**3. Time zone (issue 5)**
- Importar helper `getSPNow()`/`getSPDate()` de `@/lib/dateUtils` (criar se não existir uma versão simples) ou usar `getLocalDateString()` já existente. Saudação derivada de hora SP.

**4. Reduced motion (issue 6)**
- `useCountUp`: detectar `window.matchMedia('(prefers-reduced-motion: reduce)').matches` e setar `count = target` direto.

**5. UX do refresh (issues 8, 9)**
- Mostrar `Atualizado HH:mm` (label completo) em telas ≥sm; só `HH:mm` em <sm.
- Botão refresh: aplicar `animate-spin` no ícone enquanto `isFetching` (somar `isFetching` dos 5 hooks).

**6. Silenciar warnings de chart nos testes (issue 7)**
- Em `src/test/setup.ts`: stub `ResizeObserver` global. Limpa o output.

**7. Novos testes em `AdminDashboard.test.tsx`**
- Click em stat card "Banners" navega para `/admin/banners` (`useNavigate` mock).
- Render do alerta de erro quando `isError = true`.
- Botão refresh chama todos os `refetch`.
- Estado loading dos stat cards renderiza skeletons.

**8. Sugestões adicionais (proposta — implemento se aprovado)**
- **Sticky stat bar em mobile**: ao rolar, manter um mini-resumo no topo. *(skip por padrão — adiciona complexidade)*
- **Indicador de "novo desde última visita"**: salvar `lastVisitedAt` em localStorage, marcar items criados depois com bullet. *(opcional)*
- **Atalho de teclado** `R` para refresh. *(opcional)*

Vou implementar **#1 a #7** (correções e melhorias core). Os adicionais (#8) ficam como sugestão; me avise se quer algum deles também.

### Arquivos a editar
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminBanners.tsx` (apenas leitura de `?tab=`)
- `src/test/setup.ts` (stub ResizeObserver)
- `src/pages/admin/__tests__/AdminDashboard.test.tsx` (novos casos)

Sem migrações de banco. Sem mudanças em RLS.
