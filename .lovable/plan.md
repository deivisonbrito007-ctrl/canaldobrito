## Reestruturação das Abas do Portal

### Nova estrutura de navegação

Hoje há 3 abas: `Início` (Hero+Categorias+Live+Novidades+Promo), `Destaques`, `Programação`.

Vai virar **4 abas**:

| Antes | Depois | Conteúdo |
|---|---|---|
| Início | **Ao Vivo** | Hero + Categorias + LiveNowHero + Promo |
| — | **Novidades** (nova) | NovidadesCard + BannerSections |
| Destaques | **Sugestões** (renomeado) | HighlightsTab (sem alterar conteúdo) |
| Programação | **Programação** | ScheduleTab (sem alterar) |

### Mudanças no código

**1. `src/components/public/BottomNav.tsx`**
- Substituir os 3 itens por 4: `live` (ícone Radio), `novidades` (Sparkles), `highlights` (Star com label "Sugestões"), `schedule` (CalendarDays).

**2. `src/pages/Index.tsx`**
- `TAB_ORDER = ["live", "novidades", "highlights", "schedule"]`, default `"live"`.
- Criar componente lazy `NovidadesTab` que renderiza `NovidadesCard` + `BannerSections`.
- Aba `live`: Hero + CategoryIconsCarousel + LiveNowHero + PromoStrip.
- Atualizar deep-link `?tab=`: aceitar os 4 valores diretamente; manter compat com `?tab=home` redirecionando para `live`.

**3. `src/lib/utils.ts` — `buildDeepLink`**
- Tipos aceitos: `"live" | "novidades" | "highlights" | "schedule"` (remover `"home"`).

**4. `src/pages/admin/AdminWhatsApp.tsx`**
- Nova seção **"Links rápidos por aba"** com 4 cards (um por aba), cada um com:
  - URL do site + `?tab=<aba>` 
  - Botão "Copiar link"
  - Botão "Abrir WhatsApp" com mensagem curta personalizável padrão por aba
- Atualizar templates prontos: badges de tab corretos.
- O link do "Geral do Dia" continua sem `?tab` (vai pro padrão = Ao Vivo).

**5. Eventos `nav-tab-change`**
- Componentes que disparam (`LiveNowHero`, `DailyGamesSection`, `LiveFeedSection`, `CategoryIconsCarousel`) — verificar e ajustar valores enviados (`home` → `live`, etc).

### Sugestões adicionais

- **Badge "NOVO"** discreto na aba Novidades por 7 dias após adicionar conteúdo (usar `created_at` mais recente em `news_releases`).
- **Pré-visualização do link**: no admin, mostrar miniatura/screenshot da aba destino ao passar mouse no card de link rápido (opcional, posso pular se preferir simples).
- **QR Code** ao lado de cada link rápido — útil pra compartilhar fora do WhatsApp também.
- **Texto-padrão por aba** editável e salvo em `settings`, pra você customizar a mensagem sem mexer no código.

Confirme se quer todas as 4 sugestões ou só o essencial (links + cópia).