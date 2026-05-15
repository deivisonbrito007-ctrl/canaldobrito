# Auditoria — Admin › Banners

Revisei `src/pages/admin/AdminBanners.tsx` (574 linhas), `useBanners.ts`, `ExpiredBannersAlert` e `UpcomingActivations`. A página funciona bem, mas tem pontos claros de correção, polimento e oportunidades de novos recursos.

---

## 1. Bugs / correções

1. **Reordenação só funciona dentro da página (não respeita filtro por data)**
   `moveBanner` troca `sort_order` entre vizinhos do array global, mas a UI agrupa por dia. Mover "para baixo" o último de um dia troca com o primeiro do dia anterior — comportamento confuso. Corrigir para reordenar somente dentro do mesmo grupo de data.

2. **Race condition no `sort_order` de uploads múltiplos**
   `baseOrder` é calculado a partir do `banners` em cache no momento do clique. Se houver 2 uploads simultâneos ou banners criados por outro admin, geramos `sort_order` duplicado. Usar `max(sort_order)+i` via RPC, ou atualizar `baseOrder` após cada insert lendo o retorno.

3. **Reorder com 2 mutations paralelas pode invalidar a query no meio**
   `Promise.all([updateBanner.mutateAsync, updateBanner.mutateAsync])` dispara 2 invalidations seguidas e provoca refetch duplo + flicker. Trocar por uma única RPC `reorder_banners(_ids uuid[])` (já existe padrão idêntico em `reorder_channel_mappings`).

4. **`isFutureSchedule` usado só para custom**
   Os botões "Amanhã 00h/06h/12h" não validam se já passaram (ex: às 14h escolher "Amanhã 12h" cria agendamento para o dia atual passado se a função tiver bug de fuso). Validar todos os modos antes do upload.

5. **`upsert: true` no Storage com path único**
   `path` inclui `Date.now()-i`, então `upsert` é inútil. Remover para não mascarar colisões reais.

6. **Switch de ativar não bloqueia se houver `publish_at` futuro**
   Marcar manualmente como ativo um banner agendado deveria limpar `publish_at` (ou avisar). Hoje fica ativo + agendado, estado inconsistente que o `ExpiredBannersAlert`/cron pode ignorar.

7. **Sem feedback ao falhar no Switch / reorder**
   `updateBanner.mutate` (fire-and-forget) não trata erro. Adicionar `onError` toast.

8. **`alt` text fraco**
   "Banner Capa de 11/05/2026" não ajuda SEO/leitor de tela. Usar `banner.title` quando existir e cair para descrição mais útil.

9. **Tipo `any` em `bannerData` e `isScheduled(banner: any)`**
   Tipar com `Partial<Banner>` para não perder o type-check.

10. **`setTick` 60s roda mesmo quando aba "Programação" está aberta**
    Inútil, gasta render. Mover para dentro do bloco `categories` ou condicionar.

11. **Banner expirado (`expires_at < now`) não tem UI de gestão aqui**
    `ExpiredBannersAlert` existe mas não é renderizado nesta página — apenas aponta para `/admin/banners` (que já é esta). Incluir o alerta no topo + ação "desativar expirados".

---

## 2. Melhorias de UX/UI

- **Drag-and-drop nativo para reordenar** (usar `@dnd-kit/sortable` ou HTML5 DnD): substitui as setas ↑↓, muito mais rápido com 10+ banners.
- **Preview ao colar/arrastar antes de enviar**: mostrar miniaturas com botão "Confirmar envio" — evita uploads acidentais.
- **Filtro/busca no topo da lista**: por status (ativos | agendados | inativos | expirados) e por data.
- **Bulk actions**: checkbox por banner → ativar/desativar/excluir/reagendar em lote.
- **Edição inline de título** (clique no título ou ícone lápis). Hoje não há como definir/editar `title` após criação.
- **Definir `expires_at` na criação e edição** — campo existe na tabela mas não há UI.
- **Validação de proporção 16:9**: avisar (não bloquear) se a imagem enviada não estiver perto de 16:9, com sugestão de recorte.
- **Compressão client-side** (browser-image-compression) antes do upload para PNGs/JPEGs > 1 MB — economiza banda/storage.
- **Copiar URL pública** do banner (botão de cópia no card).
- **Duplicar banner** (útil para reagendar a mesma arte).
- **Mover entre categorias** (select no card).
- **Skeleton mais fiel** (já tem shimmer, mas só 3 placeholders fixos).
- **Tabs do topo**: "Programação" e "Categorias" estão como pílulas sem indicador ativo forte. Acrescentar contador ("Categorias · 24") e atalho de teclado (1/2).
- **Sticky header da categoria** ao rolar, para sempre saber onde está.
- **Agrupar por data já existe — adicionar collapse/expand** por dia.
- **Estados visuais por banner**: ativo / agendado / expirado / desativado com cor de borda lateral (faixa esquerda 3px).
- **Mostrar quem criou** (precisa de coluna `created_by` — opcional; útil em time multi-admin).

---

## 3. Novos recursos (maior valor)

A. **Painel de saúde por categoria** no topo: nº ativos, próxima ativação (countdown), próxima expiração, peso total em MB.
B. **Pré-visualização "como o usuário vê"**: botão que abre modal com o carrossel real da home filtrado naquela categoria.
C. **Histórico/auditoria**: usar `audit_logs` (já existe) para listar últimas ações no banner (criou, ativou, agendou, excluiu).
D. **Agendamento recorrente** (ex.: "todo sábado às 12h por 4 semanas") gerando N banners agendados a partir da mesma imagem.
E. **Importar via URL**: colar link de imagem (Drive, Imgur) e baixar server-side.
F. **Modo "Rotação automática"**: marcar X banners e definir intervalo (cron já existe via `activate-scheduled`) para alternar qual fica ativo.

---

## 4. Performance / código

- Extrair `BannerCard`, `ScheduleControls`, `UploadZone`, `CategoryTabs` para componentes próprios (`AdminBanners.tsx` tem 574 linhas).
- Memoizar `grouped` com `useMemo` (recalculado a cada tick de 60s sem necessidade).
- `useAllBanners(category)` refaz fetch a cada troca de aba — habilitar `keepPreviousData: true`.
- Substituir `setTick` por `useLiveTick` (hook já existe no projeto).

---

## 5. Acessibilidade

- Setas ↑↓ não têm `aria-keyshortcuts`; o tab order entre Switch e botões fica longo. Empacotar ações em `role="toolbar"`.
- Cores de status (ativo/inativo) dependem só de cor — adicionar ícone redundante (✓ / ⏸) para daltonismo.
- `AlertDialog` de exclusão não menciona qual banner — incluir miniatura/título.

---

## Sugestão de execução (faseada)

```text
Fase 1 — Correções rápidas (1 PR)
  • bugs 1, 2, 4, 5, 6, 7, 8, 9, 10, 11
  • renderizar <ExpiredBannersAlert/> no topo da aba Categorias

Fase 2 — UX foundation (1 PR)
  • drag-and-drop com dnd-kit + RPC reorder_banners
  • edição inline de título + campo expires_at
  • filtros (status/data) e busca
  • bulk actions

Fase 3 — Recursos premium (1 PR por item)
  • painel de saúde + preview público
  • histórico via audit_logs
  • agendamento recorrente / rotação automática
```

## Pergunta antes de implementar

Quer que eu siga direto com a **Fase 1 (correções)** agora, ou prefere escolher itens específicos das Fases 2/3 para incluir já no primeiro PR?
