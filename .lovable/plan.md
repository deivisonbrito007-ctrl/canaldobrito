

## Corrigir visualização mobile da seção "Ao Vivo"

### Bug encontrado

**Linha 303**: o grid de eventos usa `events.map()` em vez de `visibleEvents.map()`. Isso faz com que TODOS os eventos apareçam mesmo quando o limite de 6 deveria estar ativo, ignorando o botão "mostrar mais".

### Problemas de layout no mobile (320px-430px)

1. **Header transborda** — o cabeçalho tem `whitespace-nowrap` no título "Ao Vivo Agora", mais o badge de contagem, mais o relógio, mais o botão "Ver todos →", tudo na mesma linha. Em telas de 320px isso estoura.

2. **Padding excessivo** — `mx-4` (16px cada lado) + `p-4` interno consome 64px de largura, sobrando apenas ~256px para conteúdo em telas de 320px.

3. **Card de partida com layout "Time VS Time" lado a lado** — em 320px com nomes longos (ex: "Bósnia e Herzegovina"), mesmo com `line-clamp-2` o espaço fica apertado. O badge VS no meio consome espaço.

### Correções

**Arquivo: `src/components/public/LiveNowHero.tsx`**

1. **Corrigir bug**: linha 303, trocar `events.map` por `visibleEvents.map`

2. **Header responsivo**: quebrar em duas linhas no mobile
   - Linha 1: bolinha + "Ao Vivo" + badge de contagem
   - Linha 2: relógio + "Ver todos →"
   - Usar `flex-wrap` ou separar em dois `div`s com `justify-between`

3. **Reduzir padding no mobile**: trocar `mx-4` por `mx-3` e `p-4` por `p-3` para ganhar 8px extras

4. **Card de partida — layout empilhado no mobile**: em vez de "Time VS Time" lado a lado, empilhar verticalmente:
   - Time da casa (linha inteira)
   - "VS" centralizado (linha separada, menor)
   - Time visitante (linha inteira)
   - Isso garante que nomes longos nunca sejam cortados

5. **Reduzir gap no grid**: de `gap-2` para `gap-1.5` no mobile para caber mais cards

### Resultado esperado
- Todos os jogos/eventos respeitam o limite de 6 (bug corrigido)
- Header não transborda em telas pequenas
- Nomes longos de times sempre visíveis
- Layout confortável em 320px-430px

