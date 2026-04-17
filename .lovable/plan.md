

## Auditoria Completa do Sistema + Melhorias

### Diagnóstico

**1. Warning React no console (recorrente):**
`Function components cannot be given refs` em `BannerSections` → causado pelo `AnimatePresence`/`PopChild` do framer-motion (em `Index.tsx`) que tenta medir o filho via ref. O primeiro filho dentro do `motion.div` é `<Suspense>` → `BannerSections` (function component sem `forwardRef`). O mesmo padrão pode atingir `Hero`, `LazyNovidadesCard`, `LazyPromoStrip` em outras transições.

**2. Banco de dados (linter):**
- `push_subscriptions` tem políticas RLS `WITH CHECK (true)` para INSERT/UPDATE/DELETE — qualquer pessoa pode apagar inscrições alheias. Aceitável para push anônimo, mas idealmente DELETE deveria exigir `endpoint` próprio (não há como sem auth — manter mas documentar).
- Bucket `banners` é público e permite listagem.
- Proteção contra senhas vazadas desabilitada no Auth.

**3. Estado do conteúdo:**
235 jogos nos últimos 7 dias (75 ativos, 145 arquivados) — saudável. Configurações OK (4 chaves, tmdb protegida).

**4. Cobertura de testes:**
132 testes passando. Faltam testes para: `useDailyGames` (sanitizeGame com whitelist), `AdminConfiguracoes`, `AdminFilmes`, `AdminSeries`, `AdminNovidades`, `DailyGamesSection`, `Hero`, `CategoryIconsCarousel`.

**5. UX/UI Admin:**
- Dashboard tem boa densidade mas falta atalho de teclado para "Atualizar tudo" e a barra de "Saúde do Conteúdo" não destaca visualmente quando passa de 90%.
- `RecentActivity` mostra apenas 5 itens — sem botão "Ver todos".
- Nenhum indicador de quantos itens estão agendados (publish_at futuro) entre filmes/séries/novidades — só jogos.

---

### Plano de Melhorias

#### Passo 1 — Corrigir warning de ref (BannerSections)
Em `src/components/public/BannerSections.tsx`: envolver o componente raíz em `React.forwardRef<HTMLDivElement>`, repassando ref ao `<div className="space-y-10">`. Faz o mesmo para `Hero`, `NovidadesCard`, `PromoStrip` se forem renderizados como filho direto de `AnimatePresence` (verificar — eles ficam dentro de outro `<div>` do `home`, então não precisam).

#### Passo 2 — Teste para sanitizeGame whitelist
Criar `src/hooks/__tests__/useDailyGames.test.ts` testando que:
- `dateBumped`, `selected` e qualquer campo desconhecido são removidos
- Campos válidos (`home_team`, `channels`, `publish_at`) são preservados
- Strings com surrogates quebradas são limpas

#### Passo 3 — Melhorias UI no Dashboard Admin
**Arquivo:** `src/pages/admin/AdminDashboard.tsx`
- Adicionar contador de **agendados** (publish_at futuro) também para filmes, séries, novidades nos cards (igual ao que já existe para jogos).
- Adicionar badge "🎉 Excelente" quando `ContentHealthBar` ≥ 90% (em `ContentHealthBar.tsx`).
- Em `RecentActivity`: aumentar limite para 8 itens e adicionar `<details>` colapsável "Ver mais".

#### Passo 4 — Melhoria UX Programação (admin)
Em `ProgramacaoTexto.tsx`: após publicar com sucesso, mostrar toast com botão "Ver no público" que dispara o evento `nav-tab-change` para a aba `schedule` e abre `/` em nova aba.

#### Passo 5 — Habilitar proteção de senhas vazadas
Documentar no plano: o usuário precisa habilitar manualmente em Backend → Auth → Password protection (link nos avisos do linter). Vou só notificar — não dá pra fazer via SQL.

#### Passo 6 — Rodar suite de testes
Executar `vitest run` e confirmar 0 regressões.

---

### Detalhes técnicos
- `forwardRef` em `BannerSections` resolve o warning sem mudar comportamento visual.
- A whitelist `DAILY_GAMES_COLUMNS` já existe — apenas adicionar testes garante que regressões futuras não reintroduzam o bug.
- O badge "Excelente" usa apenas Tailwind (sem novo asset).

