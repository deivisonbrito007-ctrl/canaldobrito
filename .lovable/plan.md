# Auditoria — Aba WhatsApp (Admin)

## Estado atual
- **Arquivo**: `src/pages/admin/AdminWhatsApp.tsx` (458 linhas, monolítico).
- **Testes**: `AdminWhatsApp.test.tsx` ✅ 3/3 (cobertura rasa: só renderização de header/templates/textarea).
- **Funções**: Header · Link do Site · Links rápidos por aba · Preview do dia (Hoje) com validação · Mensagem personalizada · 5 textos prontos.

## Issues encontrados

| # | Sev | Problema |
|---|---|---|
| 1 | 🔴 alto | `navigator.clipboard.writeText` sem fallback nem try/catch — quebra em iOS sem HTTPS/PWA e contextos sem permissão; toast "Copiado!" mente em caso de erro. |
| 2 | 🔴 alto | Só pré-visualiza **hoje**. Sem opção de "Amanhã" / dia específico — fluxo recorrente do admin é mandar à noite a programação do dia seguinte. |
| 3 | 🟠 médio | Texto WhatsApp não escapa caracteres problemáticos do markdown (`*` no nome do time quebra negrito). |
| 4 | 🟠 médio | Validação só conta — não lista quais jogos têm problema (admin precisa abrir Programação para descobrir). |
| 5 | 🟠 médio | "Links rápidos" e "Textos Prontos" duplicam funcionalidade (live/novidades/schedule aparecem 2x). |
| 6 | 🟠 médio | Botão "Status" no Quick Tab é confuso — abre WhatsApp normal, não o Status. Renomear "Enviar". |
| 7 | 🟠 médio | Mobile 320–375px: header das `DayPreviewCard` faz wrap feio quando tem ícone + título + subtítulo; chips de validação podem estourar. |
| 8 | 🟡 baixo | `pre` da preview com `max-h-[140px]/[320px]` e fonte 11px é difícil de ler no mobile; sem botão "expandir". |
| 9 | 🟡 baixo | Sem indicador "última atualização da programação" — admin não sabe se os jogos exibidos são os mais recentes. |
| 10 | 🟡 baixo | Mensagem personalizada não aceita placeholder `{LINK}` para posicionar o link no meio do texto — sempre vai no fim. |
| 11 | 🟡 baixo | `useMemo` de `templates` calcula `new Date()` 1x na montagem — após meia-noite mostra a data do dia anterior até refresh. |
| 12 | 🟡 baixo | Sem contador de templates copiados/enviados na sessão (feedback de produtividade). |
| 13 | 🟡 baixo | Sem testes para `buildDayText`, `validateDay`, fluxo de copy, `MessageCard` e Quick Tab. |
| 14 | 🟡 baixo | `console.log` (não há, ✅) — porém também não há tratamento de erro para `window.open` bloqueado por popup blocker. |

## Plano de implementação

### A. Robustez & UX core (alto impacto)
- **Clipboard com fallback**: helper `safeCopy(text)` com try/catch + fallback `document.execCommand('copy')` em textarea oculto; toast só aparece em sucesso real, `toast.error` em falha.
- **Seletor de dia** no card de preview: chips "Hoje · Amanhã · +2d · Personalizado (date input)". Hook usa `useAllDailyGames(selectedStr)` reativo.
- **Lista de problemas detalhada**: dentro do `DayPreviewCard`, accordion "Ver problemas" listando jogos com `sem canal / 00:00 / duplicados` (link clicável que dispara navegação para `/admin/programacao`).
- **Sanitização de markdown WhatsApp**: escapar `*`, `_`, `~`, `` ` `` em nomes de times/competições antes de envolver com `*…*`.

### B. Mobile-first
- Reduzir padding interno dos cards em `<sm` (`p-3` em vez de `p-4`), header das DayPreviewCard com `flex-wrap` e ícone alinhado.
- Chips de validação: `truncate` + `whitespace-nowrap` + container `overflow-x-auto scrollbar-none`.
- Aumentar `pre` para `max-h-[60vh]` em mobile com botão "Expandir/Recolher".
- Garantir 44px mínimo no botão "Enviar" do Quick Tab (atualmente 36px).

### C. Limpeza e consolidação
- Mesclar **Quick Tab Links** + **Textos Prontos** em **uma seção única** "Compartilhar por aba" com 2 modos (link curto / mensagem completa) via toggle.
- Renomear botão "Status" → "WhatsApp" (não abre Status, abre share normal).
- Mostrar "Atualizado há Xs" no card de preview com `useLiveTick(60_000)`.
- Recalcular `todayStr` a cada minuto via `useLiveTick` para corrigir mudança de dia sem refresh.

### D. Mensagem personalizada
- Suportar placeholder `{LINK}` no corpo: se presente, substitui pela URL; se ausente, anexa no final (comportamento atual).
- Toggle "qual aba linkar?" (live/novidades/schedule/home) — gera link curto rastreado.
- Salvar último rascunho em `localStorage("admin:wppDraft")`.

### E. Testes (cobrir lógica crítica)
Expandir `AdminWhatsApp.test.tsx` e adicionar `__tests__/whatsapp.text.test.ts` com:
- `buildDayText`: jogos vazios → null; ordena por esporte e horário; agrupa por sport detectado vs salvo; escapa markdown.
- `validateDay`: detecta `noChannel`, `zeroTime`, `duplicates` corretamente.
- `safeCopy`: sucesso, falha, fallback execCommand.
- Seletor de dia muda hook `useAllDailyGames(date)`.
- Botão Enviar dispara `trackShare` com payload correto.
- Sanitização: `"FC *Star*"` vira `FC \*Star\*`.

### F. Sugestões opcionais (a confirmar)
- **F1**: Botão "Copiar como imagem" (canvas → PNG da preview) para stories.
- **F2**: Histórico das últimas 10 mensagens enviadas (localStorage), com 1-clique para reenviar.
- **F3**: Atalho de teclado `Ctrl/Cmd+Enter` na textarea para enviar.
- **F4**: Pré-agendar mensagem (gera `<noticia>` e salva em `audit_logs` para envio manual depois).
- **F5**: Variantes A/B do texto com tracking via `utm_content`.

## Arquivos
- `src/pages/admin/AdminWhatsApp.tsx` — refator (extrair `DayPreviewCard`, `MessageCard`, `QuickShareList` para `src/components/admin/whatsapp/`).
- `src/components/admin/whatsapp/DayPreviewCard.tsx` — **novo**.
- `src/components/admin/whatsapp/QuickShareList.tsx` — **novo** (consolida Quick + Textos).
- `src/components/admin/whatsapp/CustomMessageBox.tsx` — **novo**.
- `src/lib/whatsappText.ts` — **novo** (`buildDayText`, `validateDay`, `escapeWppMarkdown`, `safeCopy`).
- `src/lib/__tests__/whatsappText.test.ts` — **novo**.
- `src/pages/admin/__tests__/AdminWhatsApp.test.tsx` — expandir.

## Para confirmar
1. Quais itens da seção **F** incluir? (imagem, histórico, atalho, agendar, A/B)
2. Manter os 5 templates atuais ou reduzir para 3 (Geral, Jogos, Entretenimento)?
3. Posso rodar a suíte completa (`vitest`) ao final para validar que nada quebrou?
