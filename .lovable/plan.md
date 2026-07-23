# Overhaul Profissional do Painel Admin

Auditoria completa das 12 páginas admin (`/admin/*`) com correções de bugs, melhorias de UX, polimento visual e paridade total mobile + desktop. Escopo restrito ao admin — o site público não será alterado nesta rodada.

## Áreas cobertas

Dashboard, Banners, Filmes, Séries, Novidades, Programação, WhatsApp, Canais/Logos, Analytics, Auditoria, GitHub, Segurança, Configurações, Layout global (`AdminLayout`).

## Fase 1 — Fundação (Layout + Consistência global)

Toca `AdminLayout.tsx` e cria primitivas compartilhadas usadas por todas as páginas.

1. **Header/nav responsivo real**
   - Substituir o scroll horizontal de 12 abas por um padrão híbrido:
     - Mobile (≤640px): drawer lateral (shadcn `Sheet`) acionado por botão hambúrguer + barra fixa mostrando só a aba ativa; libera espaço vertical e evita cortes.
     - Tablet/Desktop: nav horizontal com agrupamento por seção (Conteúdo · Operação · Sistema) e menu "mais" (`DropdownMenu`) quando estourar.
   - Respeitar `env(safe-area-inset-top)` no header sticky para iOS notch.
   - Corrigir `min-h-[44px]` real nos botões (hoje há inconsistência entre `h-8` e `min-h-[36px]`).

2. **Breadcrumb + Page Header primitivo**
   - Criar `src/components/admin/AdminPageHeader.tsx` (título, subtítulo, ações à direita, breadcrumb) e adotar em todas as páginas para consistência.

3. **Estados globais compartilhados**
   - `AdminEmptyState`, `AdminErrorState`, `AdminLoadingCard` — hoje cada página reinventa. Padronizar com shimmer, ícone, CTA de retry.

4. **Tokens de cor e espaçamento**
   - Auditar cores hardcoded (`text-emerald-400`, `bg-blue-500/10`...) e mover para tokens semânticos em `index.css` (`--admin-accent-content`, `--admin-accent-ops`) mantendo paleta atual.
   - Corrigir contraste WCAG AA nos textos `text-[9px]`/`text-[10px]` (aumentar para `text-[11px]` mínimo ou reforçar peso/cor).

5. **Toaster consistente**
   - Padronizar variantes (success/warning/error) e duração; hoje mistura `toast.success` e `toast()` sem padrão.

## Fase 2 — Dashboard

- **Fix bug**: `getSPDate` calcula fuso errado (subtrai UTC offset duas vezes em máquinas fora de UTC-3). Usar `America/Sao_Paulo` via `Intl.DateTimeFormat` (padrão do projeto — memória `temporal-sync-logic`).
- **Reorganizar hierarquia visual**: Saudação + data → Health bar → Alertas críticos → Cards → Charts → Atividade. Hoje alertas ficam entre cards e quebram foco.
- **Cards clicáveis**: adicionar hover/focus visíveis e `aria-describedby` explicando o total/ativos.
- **Contadores animados**: pausar animação com `prefers-reduced-motion` (já respeita, mas revisar).
- **Mobile**: grid 2 colunas com cards mais altos + tipografia legível; hoje `text-[9px]` corta em telas pequenas.

## Fase 3 — Banners

- **Fix**: reset de seleção múltipla ao trocar de aba/filtro (hoje persiste e causa ações em itens ocultos).
- **Toolbar bulk**: mover para topo sticky com contador e "Selecionar todos visíveis" — hoje é fixa embaixo e sobrepõe o último banner no mobile.
- **DnD**: adicionar handle visual dedicado (`GripVertical`) para evitar arrasto acidental no mobile ao rolar; feedback de "reorder scope: only within this date".
- **Preview mobile/desktop**: manter, mas adicionar toggle de aspect ratio real (16:9, 9:16) e overlay de safe-area.
- **Recurring schedule**: validar limites (max 12 repetições) com mensagens claras.
- **Programação inline**: mover o botão "Copiar prompt-modelo" para dentro de um `Popover` com o texto visível — hoje é botão isolado.

## Fase 4 — Filmes / Séries / Novidades (unificação)

Essas 3 páginas duplicam ~80% da lógica (CRUD, TMDB, upload, filtros, activate/deactivate).

- **Extrair `useContentAdmin<T>` genérico** e componente `ContentAdminTable` reutilizável (colunas, filtros, ações, bulk, edição inline). Reduz ~1500 linhas duplicadas.
- **Filtros unificados**: chips de status (Ativo/Agendado/Expirado/Inativo) + busca + gênero.
- **Fix**: `AdminNovidades` não valida `hero_image` obrigatório antes de ativar.
- **TMDB sync**: botão "Sincronizar metadados" com progresso e retry em falhas parciais.
- **Poster upload**: dropzone com preview 2:3 e validação de dimensão mínima (500x750).
- **Mobile**: substituir tabelas por cards empilhados abaixo de 768px (hoje quebra horizontalmente).

## Fase 5 — Programação / WhatsApp / Canais

- **DailyGamesManager**: adicionar "Duplicar para amanhã", agrupar por período (Manhã/Tarde/Noite/Madrugada) e mostrar contador por esporte.
- **ProgramacaoTexto**: preview lado a lado (texto → cards parseados) antes de salvar, com botões "Editar linha" inline.
- **AdminWhatsApp**: revisar A/B template lab — validar limites de caracteres, preview no formato real do WhatsApp (bolha verde).
- **AdminCanaisLogos**: adicionar busca por alias, indicador de logo faltando, ações de bulk (renomear em massa via padrão).

## Fase 6 — Analytics / Auditoria / Segurança / Config / GitHub

- **Analytics**: hoje 1028 linhas em um único arquivo. Quebrar em subcomponentes por card; adicionar filtro de período (7d/30d/90d) e comparativo período anterior.
- **Auditoria**: paginação virtualizada, filtro por ação/entidade/actor, export CSV.
- **Segurança**: acrescentar botão "Re-scan" chamando a Edge Function correspondente e agrupar findings por severidade com badges consistentes.
- **Configurações**: seções colapsáveis (Geral · VAPID · TMDB · Push) com validação por seção; mascarar secrets com toggle de visibilidade.
- **GitHub Diagnóstico**: exibir último commit e status de sync com indicador semafórico.

## Fase 7 — Paridade Mobile + Desktop (polimento final)

Passe transversal em todas as páginas:

- **Safe areas iOS**: `env(safe-area-inset-*)` em headers, footers fixos e toolbars bulk.
- **Touch targets ≥44px**: auditar todos botões `size="icon"` e `size="sm"`.
- **Overflow horizontal**: remover `overflow-x: auto` desnecessário (fonte de "corte" reclamado); usar `flex-wrap` ou breakpoints.
- **Focus rings visíveis**: `focus-visible:ring-2 ring-primary/40` em todos os interativos.
- **Keyboard nav**: verificar `Tab`/`Enter`/`Escape` em modais, DnD (usar `@dnd-kit` keyboard sensor).
- **Reduced motion**: revisar animações de shimmer, blob, count-up.
- **Testes**: expandir suíte Playwright para cobrir os 3 breakpoints (375, 768, 1440) em cada página admin.

## Ordem de execução proposta

Cada fase é entregável independente. Sugestão de ordem:

```text
Fase 1 (Fundação) → Fase 2 (Dashboard) → Fase 3 (Banners)
      ↓
Fase 4 (Conteúdo unificado) → Fase 5 (Programação/WA/Canais)
      ↓
Fase 6 (Analytics/Audit/Sec/Config/GH) → Fase 7 (Polimento mobile+desktop)
```

Como é overhaul completo, cada fase é aprovada e implementada antes de partir para a próxima — evita PRs gigantes e permite ajuste de direção.

## Detalhes técnicos

- **Sem mudanças de schema/RLS** — apenas UI/UX admin.
- **Nenhuma alteração no site público** (Index, Programação pública, Novidades pública, etc.).
- **React Query**: manter chaves e invalidação atuais; adicionar `placeholderData: keepPreviousData` onde há paginação.
- **shadcn/ui**: usar `Sheet`, `DropdownMenu`, `Command`, `Tabs`, `Accordion` já disponíveis.
- **DnD**: manter `@dnd-kit` (já instalado para Banners) e reaproveitar em ordenações futuras.
- **Testes**: Vitest para lógica extraída (hooks unificados); Playwright para regressão visual em 3 viewports.
- **Zero regressão funcional**: cada fase acompanha smoke test manual + `bunx vitest run` dos testes existentes.

## Confirmação necessária antes de começar

1. Aprovar a ordem das fases (ou reordenar).
2. Confirmar que posso extrair componentes/hooks compartilhados (`AdminPageHeader`, `useContentAdmin`) — implica refactor amplo em Filmes/Séries/Novidades.
3. Confirmar que troca do header admin (drawer no mobile) está OK — é a mudança visual mais impactante.
