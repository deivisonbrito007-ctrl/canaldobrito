## Página pública de Programação Diária

Nova rota leve, focada em compartilhamento via WhatsApp/Stories — sem header/footer/bottom-nav do app, layout vertical limpo, pronta pra screenshot ou link direto.

### Rota

`/programacao` hoje cai dentro do `<Index />` (com bottom-nav, abas, etc). Vou criar uma rota **paralela e dedicada**:

- **`/agenda`** — versão pública compartilhável, standalone (sem nav, sem abas).
- Aceita `?date=YYYY-MM-DD` pra compartilhar a agenda de um dia específico (default = hoje em America/Sao_Paulo).

### Estrutura visual da página (mobile-first, 320–430px)

```text
┌──────────────────────────────────┐
│ [Logo Canal do Brito]            │  ← header mínimo (clicável → /)
│ AGENDA DE HOJE                   │  ← Bebas Neue, accent #00ff87
│ Quarta, 13 de maio · 24 jogos    │  ← data PT-BR + total
├──────────────────────────────────┤
│ Resumo por esporte (chips)       │
│ ⚽ 14  🏀 4  🥊 2  🎾 2  🏎️ 1  ⛳ 1│  ← clicáveis = filtra
├──────────────────────────────────┤
│ ⚽ FUTEBOL — 14 jogos             │  ← header de grupo
│ ┌────────────────────────────┐   │
│ │ 16:00  Flamengo x Palmeiras│   │
│ │        Brasileirão         │   │
│ │        📺 Globo, Premiere  │   │
│ │        🔴 AO VIVO          │   │  ← se live agora
│ └────────────────────────────┘   │
│ … demais cards de futebol …      │
├──────────────────────────────────┤
│ 🏀 BASQUETE — 4 jogos             │
│ … cards …                         │
├──────────────────────────────────┤
│ … demais esportes …               │
├──────────────────────────────────┤
│ [📋 Copiar texto]  [📲 WhatsApp] │  ← barra fixa no rodapé
│ [📸 Salvar imagem]                │
│ canaldobrito.site                 │
└──────────────────────────────────┘
```

### Features de compartilhamento

1. **Copiar texto** — usa o gerador `whatsappText.ts` já existente (mesmo formato do parser/admin) e copia pro clipboard.
2. **Compartilhar WhatsApp** — `https://wa.me/?text=...` com o texto pré-formatado + link `canaldobrito.site/agenda?date=...`.
3. **Salvar imagem** — usa `html-to-image` (lib leve, ~14kb) pra exportar a página como PNG vertical 1080×1920 (formato story). Fallback: `Web Share API` se disponível.
4. **Web Share API nativo** — botão "Compartilhar" usa `navigator.share()` em mobile (compartilha texto + URL).

### Comportamento

- Esportes ordenados por contagem (futebol primeiro normalmente).
- Dentro de cada esporte: ordem cronológica por horário.
- Jogos `is_live` (computado dinamicamente via `isGameCurrentlyLive`) ganham badge vermelho 🔴 AO VIVO.
- Jogos já encerrados aparecem em opacidade reduzida (50%).
- Chips de esporte no topo: clicar filtra; clicar de novo limpa.
- Date picker discreto no canto superior direito (apenas seta ◀ ontem / amanhã ▶ + data) pra navegar dias.
- Empty state amigável: "Sem jogos para esta data — confira amanhã!"

### SEO + meta sociais

- `<title>` dinâmico: `Agenda de hoje — Quarta 13/05 · 24 jogos | Canal do Brito`
- `<meta name="description">` com resumo (`14 jogos de futebol, 4 de basquete, …`)
- Open Graph + Twitter Card (preview rico no WhatsApp/Twitter):
  - `og:title`, `og:description`, `og:image` (placeholder ou screenshot pré-gerado), `og:url`
- JSON-LD `SportsEvent` array com os jogos do dia.
- Canonical: `https://canaldobrito.site/agenda?date=YYYY-MM-DD`.

### Arquivos a criar/editar

**Novos:**
- `src/pages/AgendaPublica.tsx` — página standalone (sem `<AppNavbar/>`, sem `<BottomNav/>`).
- `src/components/public/agenda/AgendaHeader.tsx` — logo + título + data + total + nav de dias.
- `src/components/public/agenda/SportSummaryChips.tsx` — chips de contagem por esporte.
- `src/components/public/agenda/SportGroup.tsx` — header de esporte + lista de cards.
- `src/components/public/agenda/AgendaShareBar.tsx` — barra fixa de ações (copiar/WhatsApp/imagem).
- `src/lib/agendaShareImage.ts` — helper `html-to-image` pra gerar PNG.

**Editados:**
- `src/App.tsx` — adicionar `<Route path="/agenda" element={<AgendaPublica />} />` (lazy).
- `package.json` — instalar `html-to-image` (~14kb gzip).

**Reaproveitado (sem mudar):**
- `useAllDailyGames(date)` — busca os jogos.
- `SPORT_EMOJI`, `SPORT_LABEL`, `isGameCurrentlyLive` de `gameUtils.ts`.
- `whatsappText.ts` — gera texto pra clipboard/WhatsApp.
- `getLocalDateString`, `formatCountdown` de `dateUtils.ts` (timezone São Paulo).
- `GameCard` ou simplificação dele (versão "share-friendly" sem botões de ação).

### Detalhes técnicos

- Página é **pública** (RLS já permite SELECT em `daily_games` para todos).
- Filtro: `archived = false AND active = true AND date = ?`.
- Sem dependência de auth, sem tracking de admin.
- Container max-width 430px centralizado também em desktop, com fundo `#07080a` em tela cheia.
- Respeita safe areas iOS (`env(safe-area-inset-bottom)`) na barra de ações.
- Botão "Voltar para o app" discreto no rodapé linka pra `/`.

### Decisões pendentes (posso assumir o default se preferir)

1. **Rota**: `/agenda` (default) ou `/programacao-hoje`?
2. **Esportes vazios**: ocultar grupos sem jogos (default) ou mostrar "0 jogos"?
3. **Imagem compartilhável**: gerar dinâmica (html-to-image) — confirma adicionar a lib?
4. **Navegação de dias**: incluir setas ontem/amanhã (default sim) ou só hoje pra manter foco?
