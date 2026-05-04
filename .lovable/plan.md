# Deep-links para compartilhar abas no WhatsApp

## Problema atual
Em `AdminWhatsApp.tsx` todos os 4 templates ("Geral", "Jogos", "Entretenimento", "Ao Vivo") usam o mesmo `siteUrl` (raiz). O app é SPA com tabs internas (`home`, `highlights`, `schedule`) controladas por `useState` em `src/pages/Index.tsx` — não existe URL distinta por aba. Resultado: ao clicar no link do status, o usuário sempre cai na Home, nunca direto na seção citada.

## Solução
Criar **deep-links via query string** que, ao carregar, abrem a aba correta e rolam até a seção. Depois usar esses links nos templates do WhatsApp e em botões "Compartilhar" diretamente nas seções públicas.

### 1. Suporte a deep-link em `src/pages/Index.tsx`
No `useEffect` de inicialização, ler `?tab=` (e opcional `?section=`) da URL e:
- mapear para `home | highlights | schedule | live | novidades`
- chamar `handleTabChange` com a aba correta (`live` e `novidades` → aba `home`)
- após render, fazer `scrollIntoView` no anchor correspondente (`#live`, `#novidades`)
- limpar a query (`history.replaceState`) para não “grudar” no histórico

Mapeamento:
| Param            | Aba destino | Scroll para |
|------------------|-------------|-------------|
| `tab=schedule`   | schedule    | topo        |
| `tab=highlights` | highlights  | topo        |
| `tab=live`       | home        | `#live`     |
| `tab=novidades`  | home        | `#novidades`|

### 2. Adicionar `id` âncora nas seções
- `LiveNowHero` (ou wrapper em `Index.tsx`): `<section id="live">`
- `NovidadesCard`: `<section id="novidades">`

### 3. Helper `buildDeepLink(tab)` em `src/lib/utils.ts`
```ts
export const buildDeepLink = (base: string, tab?: string) =>
  tab ? `${base.replace(/\/$/, '')}/?tab=${tab}` : base;
```

### 4. Atualizar `src/pages/admin/AdminWhatsApp.tsx`
Cada template recebe seu próprio link via novo placeholder `LINK_TAB`:

| Template          | tab param   |
|-------------------|-------------|
| Geral do Dia      | (nenhum, raiz) |
| ⚽ Jogos          | `schedule`  |
| 🍿 Entretenimento | `highlights`|
| 🔴 Ao Vivo        | `live`      |
| 🆕 Novidades (novo) | `novidades` |

Ajustar `MessageCard` para receber `tab` e usar `buildDeepLink(siteUrl, tab)`. Também atualizar `buildDayText` (Hoje/Amanhã) para apontar para `?tab=schedule`.

### 5. Botões "Compartilhar no WhatsApp" em cada seção pública (sugestão UX)
Adicionar botão pequeno (ícone `Share2`) no header de:
- `LiveNowHero` → compartilha `?tab=live`
- `DailyGamesSection`/`ScheduleTab` → `?tab=schedule`
- `HighlightsTab` → `?tab=highlights`
- `NovidadesCard` → `?tab=novidades`

Cada botão abre `https://wa.me/?text=<texto curto>%20<deepLink>` — útil para o admin compartilhar do próprio site sem ir até o painel.

## Sugestões adicionais (opcionais)
- **Open Graph dinâmico**: como é SPA, o preview do WhatsApp sempre mostra metadados de `index.html`. Para previews diferentes por aba seria preciso SSR/edge function — deixar para depois.
- **UTM tracking**: anexar `&utm_source=whatsapp&utm_campaign=status` para medir cliques no Analytics.
- **Encurtador**: integrar com Bitly/short.io futuramente para links mais limpos no status.

## Arquivos a alterar
- `src/pages/Index.tsx` — leitura de `?tab=` + scroll
- `src/components/public/LiveNowHero.tsx` — `id="live"` + botão share
- `src/components/public/NovidadesCard.tsx` — `id="novidades"` + botão share
- `src/components/public/HighlightsTab.tsx` — botão share
- `src/components/public/ScheduleTab.tsx` (ou `DailyGamesSection`) — botão share
- `src/lib/utils.ts` — helper `buildDeepLink`
- `src/pages/admin/AdminWhatsApp.tsx` — templates com links específicos + novo card "Novidades"
- `src/pages/admin/__tests__/AdminWhatsApp.test.tsx` — atualizar asserts dos links
