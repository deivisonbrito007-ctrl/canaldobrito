# Auditoria e melhorias da aba Banners (Admin)

## Resposta direta
**Sim, dá para subir vários banners de uma vez** — hoje o componente só aceita um arquivo por vez (`<input>` sem `multiple`, paste/drop pegam apenas o primeiro). Vou habilitar multi-upload sequencial (mantém ordem, preserva agendamento por lote, mostra progresso N/M).

## Achados da auditoria

### Funcionalidade
1. **Single-file only** — `handleUpload`, `handleDrop` e `handlePaste` ignoram múltiplos itens.
2. **Sem validação de tipo/tamanho** — qualquer imagem passa, inclusive 50MB.
3. **Agendamento aceita data passada** — `datetime-local` sem `min`; banner agendado para ontem fica `active=false` para sempre.
4. **`refetchInterval: 60_000`** em `useAllBanners` força re-render do admin a cada minuto (custo desnecessário fora do tick de countdown).
5. **`moveBanner` faz 2 updates sequenciais sem optimistic update** — flicker visível ao reordenar.
6. **`window.confirm()`** para excluir/desativar todos — quebra estética e não testável.
7. **Sem feedback de erros parciais** em "Desativar todos" (Promise.all rejeita no primeiro erro, esconde sucessos).

### UX / Mobile (320–430px)
8. Cabeçalho com `activos / agendados / inativos / total` em uma linha — quebra/overflow em 320px.
9. Pills de categoria (`📺 Capa`, `📋 Guia do Futebol`) viram horizontal scroll mas sem indicador.
10. Botões de reordenar e excluir são `h-9 w-9` (36px) — abaixo do mínimo iOS de 44px.
11. Card do banner sem swipe-to-delete nem long-press menu (esperado num admin mobile-first).
12. Toast `confirm()` nativo é horrível em iOS PWA.

### Acessibilidade
13. Pills de seção/categoria sem `role="tab"` / `aria-selected`.
14. Switch sem `aria-label` descritivo (apenas "Ativo/Off" como texto irmão).
15. Imagem do banner sem `alt` semântico quando `title` é null (cai em "Banner" genérico — ok, mas poderia incluir categoria + data).

### Tests
16. Mock de `useAllBanners` retorna `data: []` — nunca exercita listagem, agrupamento por data, reordenar, agendamento ou multi-upload.
17. Sem teste para validação de arquivo, data passada, ou paste/drop multi.

## Plano de implementação

### 1. Multi-upload (`src/pages/admin/AdminBanners.tsx`)
- `<input type="file" multiple accept="image/*">`.
- `PasteZone`: iterar `clipboardData.items` e `dataTransfer.files` coletando todos os arquivos de imagem.
- Nova função `uploadMany(files: File[])`:
  - valida cada arquivo (`validateImageFile`: tipo image/* e ≤5MB), descarta inválidos com `toast.error` agregado.
  - estado `progress = { current, total }` exibido como barra fina + contador "Enviando 3/8".
  - upload sequencial (não paralelo, evita rate-limit do Storage); cada falha individual exibe toast e segue.
  - usa o mesmo `scheduleMode/scheduleDate` para todo o lote, incrementando `sort_order` continuamente.
  - resumo final: "5 enviados, 1 com erro".

### 2. Validação de agendamento
- `datetime-local` recebe `min={getScheduleDate(0).slice(0, 16)}` (próximas 24h+).
- Se `scheduleMode==="custom"` com data no passado: bloqueia upload e mostra alerta inline com `<AlertCircle>`.
- Helpers `getScheduleDate` continuam retornando ISO local; adicionar `isFutureSchedule(iso)` em `dateUtils`.

### 3. UX/Mobile
- Trocar todos `confirm()` por `AlertDialog` (shadcn) — testável e estilizado.
- Botões de ação no card: aumentar para `h-11 w-11` (44px) em mobile via `sm:h-9 sm:w-9`.
- Cabeçalho counters: trocar `flex` por `flex-wrap gap-x-3 gap-y-1`.
- Adicionar gradiente fade nas pontas do scroll horizontal das pills (mask-image).
- Drag-handle visual entre os botões up/down (apenas indicação; mantém arrows).
- Empty state com CTA "Cole ou arraste imagens aqui" mais proeminente.
- Toggle "compactar lista" — modo grid 3 colunas em ≥640px (acelera revisão de muitos banners).

### 4. Performance
- Remover `refetchInterval: 60_000` do `useAllBanners` (countdown já tem `setTick` local de 60s; query revalida no `onSuccess` das mutations).
- `moveBanner`: optimistic update via `qc.setQueryData` — atualiza ordem instantânea, reverte em erro.

### 5. Acessibilidade
- Pills com `role="tablist"` / `role="tab"` / `aria-selected`.
- `Switch` com `aria-label={\`Ativar banner de \${dateKey}\`}`.
- Botões icon-only com `aria-label` ("Mover para cima", "Excluir banner").

### 6. Testes (`src/pages/admin/__tests__/AdminBanners.test.tsx`)
- Mock `useAllBanners` retornando 3 banners com datas distintas → testa agrupamento por data.
- Teste: paste com `DataTransferItem` array de 2 imagens chama `mutateAsync` 2x.
- Teste: validação rejeita arquivo > 5MB (toast.error chamado).
- Teste: data custom no passado mostra `AlertCircle` e bloqueia upload.
- Teste: AlertDialog de exclusão aparece ao clicar trash, "Cancelar" não chama `mutate`.
- Manter testes existentes (categories pills, switch programacao tab, empty state).

### 7. Sugestões extras (não implementadas agora — confirmar antes)
- **Reordenar via drag-drop nativo** (HTML5 DnD ou `@dnd-kit/core` que já está no projeto).
- **Preview do banner em todos os breakpoints** (modal lateral mostrando cover/sm/lg).
- **Bulk select** com checkboxes para desativar/excluir vários de uma vez.
- **Histórico de uploads** (audit_logs já existe; bastaria filtrar entity='banners').
- **Compressão client-side** com `browser-image-compression` antes do upload (reduz custo de Storage).

## Arquivos afetados
- `src/pages/AdminBanners.tsx` (rewrite parcial — multi-upload, validações, AlertDialog, mobile)
- `src/hooks/useBanners.ts` (remover refetchInterval, optimistic moveBanner)
- `src/lib/dateUtils.ts` (adicionar `isFutureSchedule`)
- `src/pages/admin/__tests__/AdminBanners.test.tsx` (cobertura nova)

## Critérios de aceite
- Selecionar 5 imagens no input envia todas, mostra "5/5", incrementa sort_order corretamente.
- Colar 3 prints do clipboard envia os 3.
- Tentar agendar para `2024-01-01T00:00` mostra erro inline e desabilita botão.
- Em viewport 320px: nenhum overflow horizontal; todos os toques ≥44px.
- `bunx vitest run` passa com a nova suíte (mínimo 8 specs verdes para AdminBanners).
