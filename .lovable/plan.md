## Mudanças solicitadas

1. **Remover sino de notificação** dos cards na aba Programação.
2. **Cards de canal mais profissionais e maiores** — sem abreviar nomes (sem "Param+", "Cazé", "Gplay", "Brito", "Apple", etc.).

## Plano

### 1. GameCard — remover lembrete (sino)
Em `src/components/public/schedule/GameCard.tsx`:
- Remover import de `Bell`, `BellOff`, `useState`, `useCallback`.
- Remover funções `getReminders`, `toggleReminder`.
- Remover bloco do botão de sino (tanto o do header quando há live/isSoon, quanto o absoluto do canto superior direito).
- Manter o badge de "AO VIVO" / "Começa em X" alinhado à esquerda (em vez de `justify-between`, virar `flex items-center`).

### 2. ChannelBadge — maior e sem abreviações
Em `src/components/public/ChannelBadge.tsx`:
- **Tamanhos aumentados** (size `md` é o usado nos cards):
  - `sm`: text 9px → **10px**, padding mais generoso, ícone 12px → **14px**.
  - `md`: text 10px → **11px**, padding `px-2.5 py-1.5`, ícone 14px → **16px**.
  - `lg`: text 11px → **12px**, ícone 16px → **20px**.
- **Sempre nome completo**: remover lógica `isMobile && config.short ? config.short : name` e parar de usar `short` no nome principal (mantém `short` no tipo só para não quebrar o map, mas não é mais usado para renderizar).
- **Canal do Brito**: mostrar "Canal do Brito" também em mobile (era "Brito").
- **Apple TV / Apple TV+ / Paramount+ / Cazé TV** etc. exibidos por extenso.
- `whitespace-nowrap` adicionado para evitar quebra estranha em palavras curtas como "Prime Video".

### 3. Ajuste de layout para acomodar badges maiores
Em `GameCard.tsx`:
- Container de canais: trocar `slice(0, 3)` para `slice(0, 2)` (badges agora maiores), e ajustar o "+N" para ficar visualmente equilibrado.
- Em telas ≥sm continua mostrando até 3.

### 4. Atualizar testes
- `GameCard.test.tsx`: remover testes do toggle de reminder + assertion de "+2" troca para "+3" (com 5 canais mostrando 2, sobram 3).
- `ChannelBadge.test.tsx` (existente, já com 1 falha pré-existente): verificar se passa após nome completo.

## Arquivos editados
- `src/components/public/schedule/GameCard.tsx`
- `src/components/public/ChannelBadge.tsx`
- `src/components/public/schedule/__tests__/GameCard.test.tsx`

## Sugestões adicionais (não implemento sem aprovar)

1. **Logo oficial em vez de favicon**: a maioria dos canais hoje usa favicon do Google (16-32px borrado quando esticado). Posso baixar SVGs/PNGs HD oficiais para os 10 mais comuns (ESPN, SporTV, Premiere, Globo, TNT, Cazé TV, DAZN, Disney+, Prime Video, Max) e colocar em `/public/channels/`. Os SVGs locais já têm prioridade no código.
2. **Variante "compacta vs completa"**: numa próxima iteração, badge em hover/click expande pro nome completo ainda maior.
3. **Linha dedicada "Onde assistir"**: separar canais do resto do card com label discreta tipo `▶ ASSISTIR EM:` para hierarquia mais clara.
4. **Ordenar canais**: priorizar Canal do Brito sempre primeiro, depois canais abertos (Globo/Band/Record), depois fechados, depois streaming.
5. **Tooltip em desktop** com info do canal ("Disponível na Sky/Claro/Vivo" etc.) — já temos infra de tooltip.
