

## Problema: conflito entre scroll horizontal dos jogos e swipe de abas

O swipe horizontal do `motion.div` no `Index.tsx` (drag="x") conflita com o carrossel horizontal dos jogos ao vivo. O guard `data-horizontal-scroll` existe mas nem sempre funciona bem em touch — usuários leigos acabam trocando de aba sem querer ao tentar ver mais jogos.

## Solução: layout vertical empilhado (sem carrossel horizontal)

Eliminar completamente o carrossel horizontal na seção Ao Vivo. Todos os jogos ficam em **grid vertical**, sempre visíveis, sem necessidade de scroll lateral. Isso resolve o conflito de gestos e garante que qualquer usuário veja todos os jogos imediatamente.

### Alterações em `src/components/public/LiveNowHero.tsx`

1. **Remover o carrossel horizontal** — eliminar o branch `matches.length > 4` que usa `overflow-x-auto` + `data-horizontal-scroll`
2. **Usar grid vertical sempre** — `grid grid-cols-1 sm:grid-cols-2 gap-2` para todas as quantidades de jogos
3. **Remover `min-w-[280px]` e `shrink-0`** do MatchCard — não precisa mais de largura mínima fixa pois o card ocupa 100% da coluna do grid
4. **Compactar os cards** — reduzir padding para que mais jogos caibam na tela sem scroll excessivo:
   - Reduzir padding interno de `px-3 pt-2.5 pb-1.5` para `px-2.5 pt-2 pb-1`
   - Reduzir o footer de `px-3 py-2` para `px-2.5 py-1.5`
5. **Adicionar "mostrar mais"** — se houver mais de 6 jogos, mostrar os 6 primeiros e um botão "Ver todos os X jogos" que expande a lista (estado local `expanded`). Isso evita que a seção fique gigante quando há muitos jogos simultâneos.

### Resultado esperado
- Zero conflito de gestos — não há mais scroll horizontal na seção
- Todos os jogos visíveis sem gesto especial
- Usuários leigos veem tudo com scroll vertical natural
- Seção não fica excessivamente longa graças ao "mostrar mais"

