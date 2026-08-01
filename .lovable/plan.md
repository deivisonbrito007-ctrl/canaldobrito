## Problema

No painel de programação (`src/components/admin/DailyGamesManager.tsx`), o formulário de edição inline (`InlineEditForm`) só expõe 6 campos: times, competição, horário, canais e esporte.

Ficam de fora campos que existem no jogo e que o hook de update já aceita (`sanitizeGame` em `useDailyGames.ts` permite todos eles):

- `competition_detail` (fase/rodada — hoje só é editável recolando o texto)
- `date` (não é possível mover um jogo para outro dia)
- `game_time` sem validação — aceita texto livre e pode gravar horário inválido
- `is_womens` (badge feminino)
- `is_live` / `status_short` / `elapsed_minutes`
- `publish_at` (agendamento de publicação — só editável no fluxo em massa)
- `active` (existe fora do form, mas não dentro dele)

Além disso: campos sem rótulo (só dá para adivinhar qual input é qual), alturas de 32px (abaixo do mínimo de 44px do padrão admin), sem `Salvar` desabilitado quando nada mudou e sem bloqueio de salvar com campos obrigatórios vazios.

## O que será feito

### 1. Formulário de edição completo
Reescrever `InlineEditForm` com todos os campos editáveis, cada um com rótulo `text-[11px] uppercase tracking-wider`:

- **Times**: casa / visitante (obrigatórios)
- **Competição** e **Detalhe da competição**
- **Data** (`type="date"`) e **Horário** (`type="time"`, validado)
- **Canais** (texto por vírgula, normalizado pelo mesmo helper `normalizeChannelsList` já usado na inserção — evita divergência entre inserir e editar)
- **Esporte** (select existente)
- **Switches**: Ativo, Ao vivo, Feminino
- **Agendar publicação** (`datetime-local`, opcional, com botão "limpar")

### 2. Validação e UX
- Bloquear `Salvar` se times ou horário estiverem vazios, com mensagem inline.
- `Salvar` desabilitado quando não houver alteração (comparação com o registro original).
- Enviar apenas os campos alterados no update.
- `Esc` cancela, `Ctrl/Cmd+Enter` salva.
- Toast de erro caso o update falhe (hoje a falha passa silenciosa).

### 3. Layout mobile
- Inputs e selects em `h-11`, botões `min-h-11`, grid 1 coluna no mobile e 2 no desktop.
- Card de edição ocupa a largura toda (hoje o `flex items-center` do card externo aperta o form) — o wrapper do card passa a usar `items-start` quando em modo edição.

### 4. Sugestões extras (incluídas)
- Mostrar o esporte sugerido pelo detector dentro do form, com botão "usar sugestão".
- Botão "Duplicar para amanhã" no card do jogo (reaproveita o form de inserção com a data +1) — pedido recorrente ao montar programação repetida.

## Detalhes técnicos

- Arquivo principal: `src/components/admin/DailyGamesManager.tsx` (apenas `InlineEditForm` + wrapper do card).
- `useUpdateDailyGame` já sanitiza e aceita todos os campos citados; nenhuma migration é necessária.
- `channels` passa a usar `normalizeChannelsList` importado de `src/hooks/useDailyGames.ts` em vez do `split(",")` local.
- Sem alteração de RLS, schema ou edge functions.
