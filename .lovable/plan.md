## Objetivo

Reduzir o app a duas abas — **Programação** (com o conteúdo atual da página pública `/agenda`) e **Filmes e Séries** — eliminando a aba "Ao Vivo" e a página standalone `/agenda`. Tudo continua linkado e nada quebra.

## Mudanças

### 1. BottomNav (`src/components/public/BottomNav.tsx`)
- Remover o item `live` (Ao Vivo).
- Manter apenas dois itens, nesta ordem:
  - **Programação** (id `schedule`, ícone `CalendarDays`) — passa a ocupar o slot da esquerda (default).
  - **Filmes e Séries** (id `novidades`, ícone `Clapperboard`).
- Layout continua `justify-around`, alvos ≥44px, safe-area mantida.

### 2. Aba Programação = conteúdo da agenda pública
Criar um componente novo `src/components/public/ProgramacaoTab.tsx` derivado do corpo de `AgendaPublica`, **sem**:
- O `<AgendaHeader>` (logo + navegação de dias no topo).
- O `<ShareBar>` fixo no rodapé (conflita com BottomNav).
- O wrapper `min-h-screen` com gradiente próprio (o app já tem background).
- O link "Voltar para o app" e os metas de SEO/canonical (já são tratados pelo app principal).

O componente mantém:
- Hook `useAllDailyGames(date)` lendo `?date=` da URL (com fallback para hoje).
- Filtro de esportes, hero ao vivo, carrossel "Em Breve", CTA "Assine já".
- A própria navegação de dias (anterior / hoje / próximo) **deslocada para dentro do conteúdo**, logo abaixo do título "AGENDA DE HOJE", em uma linha compacta — mantém a função sem duplicar header.
- Tick de 20s, lógica de `isGameCurrentlyLive`.

### 3. `src/pages/Index.tsx`
- `TAB_ORDER` vira `["schedule", "novidades"]`.
- Default `activeTab` = `"schedule"`.
- Em `handleTabChange`, normalizar legados:
  - `"home"`, `"live"`, `"ao-vivo"` → `"schedule"`.
  - `"highlights"`, `"sugestoes"`, `"destaques"`, `"filmes"`, `"series"` → `"novidades"`.
- `renderContent`: remover o branch `live` (com `CategoryIconsCarousel`, `LivePageContent`, `PromoStrip`); a aba `schedule` renderiza o novo `ProgramacaoTab` (lazy).
- Manter o handler `nav-tab-change` (compatibilidade com botões internos como "Ver destaques").

### 4. Roteamento (`src/App.tsx`)
- Remover as rotas: `/ao-vivo`, `/novidades`, `/sugestoes`, `/destaques`, `/filmes-e-series`, `/filmes`, `/series`.
- Manter apenas:
  - `/` → `Index` (abre em Programação).
  - `/programacao` → `Index`.
  - `/agenda` → **redirect** para `/programacao` (preserva o `?date=` via `<Navigate to={... + search} replace />`), garantindo que links já compartilhados no WhatsApp continuem abrindo na nova aba.
- Remover o `lazy(AgendaPublica)` e excluir o arquivo `src/pages/AgendaPublica.tsx` (lógica reaproveitada no novo componente).

### 5. `src/lib/utils.ts` (deep-links)
- `PublicTab` vira `"schedule" | "novidades"`.
- `TAB_SLUGS`: `{ schedule: "programacao", novidades: "filmes-e-series" }`.
- `SLUG_TO_TAB`: mapear todos os slugs antigos (`ao-vivo`, `live`, `home`, `agenda`, etc.) para `"schedule"` e os de filmes/séries para `"novidades"`.
- `buildDeepLink`: ajustar fallback `home` → `programacao`.

### 6. `src/lib/whatsappText.ts`
- Trocar `${siteUrl}/agenda?date=${dateStr}` por `${siteUrl}/programacao?date=${dateStr}`.

### 7. Admin — sem mudança de schema, só ajustes de UI
- `src/pages/admin/AdminWhatsApp.tsx`: remover o item de tab `"live"` do gerador de mensagens (linhas com `tab: "live"` e o template "🔴 Ao Vivo agora no portal!"), e remover `"home"`/`"live"` da lista `(["home", "live", "novidades", "schedule"] as DeepTab[])`, deixando apenas `["schedule", "novidades"]`.
- `src/components/admin/whatsapp/ABTemplateLab.tsx`: `TABS` passa a ser `["schedule", "novidades"]`.
- `src/lib/abTemplates.ts`: trocar templates com `tab: "live"` por `tab: "schedule"`.
- `src/components/admin/ChannelPreviewStage.tsx`: remover a aba "Ao vivo" do preview (ou renomear para "Programação"); ajustar `TabsContent value="live"`.
- **Banners, Filmes, Séries, Novidades, Configurações, Analytics, Auditoria**: nenhuma alteração — não dependem da aba Ao Vivo. Os banners continuam aparecendo via `LazyPromoStrip`/`BannerSections` onde já são consumidos (se quisermos que continuem visíveis na nova Programação, posso anexar `<PromoStrip />` no fim do `ProgramacaoTab`; recomendo fazer isso para não perder a vitrine de banners).

### 8. E2E e analytics
- `src/pages/E2EModals.tsx`: trocar `useState("live")` por `useState("schedule")`.
- `src/lib/analytics.ts`: comentário "/ao-vivo" → "/programacao".

### 9. Limpeza opcional (recomendada, mas posso preservar se preferir)
Componentes que ficam órfãos após remover a aba Ao Vivo: `LivePageContent`, `LiveNowHero`, `LiveNowSection`, `LiveEventsSection`, `LiveFeedSection`, `WatchTodaySection`, `Hero`, `HeroBanner`, `CategoryIconsCarousel`, `CategoryBar`, `CategoryPills`. Posso deletá-los para reduzir o bundle, **ou** manter no repo caso queira reutilizá-los depois. Aviso antes de excluir.

## Como tudo continua funcionando

- **Links já compartilhados** (`/agenda?date=YYYY-MM-DD`) → redirecionam para `/programacao?date=...`, e o `ProgramacaoTab` lê o `?date` normalmente.
- **Botões internos** que disparam `nav-tab-change` com `"novidades"` (ex.: "Ver destaques" no estado vazio) continuam válidos.
- **Admin WhatsApp** continua gerando mensagens com link válido, agora apontando para `/programacao`.
- **PWA / SW**: nenhuma mudança de manifest necessária; rotas são SPA fallback.

## Diagrama final

```text
BottomNav
 ├─ [📅 Programação]  ← default, conteúdo da antiga /agenda
 └─ [🎬 Filmes e Séries]

Rotas
 /                 → Index (Programação)
 /programacao      → Index (Programação)
 /filmes-e-series  → Index (Filmes e Séries)   (mantida só para deep-link interno)
 /agenda(...)      → 301 → /programacao(...)
 /assinar, /login, /admin/*, /s/:slug → inalteradas
```
