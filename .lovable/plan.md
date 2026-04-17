

## Correção: Scroll travado no mobile + abertura de detalhes nos Destaques

### Diagnóstico (causa raíz)

**Problema 1 — Scroll vertical bloqueado nos carrosséis de Destaques (Filmes/Séries):**
Em `WeeklyMoviesSection.tsx` (linha 137) e `WeeklySeriesSection.tsx` (linha 139), o container do carrossel usa `style={{ touchAction: "pan-x" }}`. Isso **desabilita totalmente o scroll vertical** quando o dedo toca em qualquer poster — o navegador só permite gestos horizontais nesse elemento, então tentar rolar a página com o dedo em cima de um pôster simplesmente não funciona.

**Problema 2 — ContentDetailSheet (Bottom Sheet) prejudica o scroll interno:**
Em `ContentDetailSheet.tsx` (linhas 69-82), o mesmo elemento que tem `overflow-y-auto` (rolagem interna) também tem `drag="y"` do framer-motion + `touchAction: "pan-x"`. Isso cria conflito: o framer-motion intercepta gestos verticais para arrastar e fechar o sheet, e o `touchAction: pan-x` no scroll-container diz ao browser para não permitir scroll vertical → o usuário não consegue ler descrições longas nem visualizar trailers em sheets altos.

**Problema 3 — Abertura de detalhes inconsistente:**
Como o `touchAction: pan-x` já interfere com gestos, o tap às vezes é interpretado como início de pan-x e o `onClick` do card não dispara em alguns devices (especialmente Android). Além disso, `dragSnapToOrigin` no sheet pode capturar o primeiro toque como "início de drag" e cancelar o tap de itens dentro.

---

### Correções

**Arquivo 1 — `src/components/public/WeeklyMoviesSection.tsx` (linha 137)**
Remover `style={{ touchAction: "pan-x" }}`. Carrosséis com `overflow-x-auto` já permitem swipe horizontal nativo sem bloquear o scroll vertical da página. O browser decide a direção dominante.

**Arquivo 2 — `src/components/public/WeeklySeriesSection.tsx` (linha 139)**
Mesma correção: remover `style={{ touchAction: "pan-x" }}`.

**Arquivo 3 — `src/components/public/ContentDetailSheet.tsx` (linhas 69-82)**
Refatorar o sheet em **dois elementos**:
- Container externo (`motion.div`) só com `drag="y"` e a barra de "handle" (a alça) — sem `overflow`.
- Container interno (`<div>`) com `overflow-y-auto` e o conteúdo rolável.
- Mover o `drag="y"` para responder apenas quando o handle/topo do sheet for arrastado (via `dragControls` manual ou apenas no handle).
- Remover `touchAction: pan-x` do scroll-container interno; manter `touchAction: none` apenas no handle drag para evitar scroll-jacking.

Isso é o padrão usado por sheets do iOS/Android: a alça arrasta para fechar, o conteúdo rola normalmente.

**Arquivo 4 (sugestão de melhoria) — `src/index.css`**
Adicionar regra global para todos os carrosséis horizontais para garantir comportamento consistente sem ter que repetir em cada componente:
```css
[data-horizontal-scroll] {
  overscroll-behavior-x: contain; /* não cancela scroll vertical da página */
  -webkit-overflow-scrolling: touch;
}
```
Não usar `touch-action` aqui — deixar o browser decidir.

---

### Validação
- Rodar `vitest run` para garantir 0 regressões nos testes existentes (`WeeklyMoviesSection.test.tsx`, `WeeklySeriesSection.test.tsx`).
- Testes manuais do usuário no mobile: rolar a página com dedo sobre os pôsteres de Destaques, abrir um filme/série, rolar dentro do sheet de detalhes.

### Sugestões adicionais (opcional, não incluídas por padrão)
1. **Feedback tátil** ao tocar nos cards de Destaques (`navigator.vibrate(8)`) — confirma o tap.
2. **Aumentar área de toque** dos cards para `min-h-[44px]` no botão de play (já está em 44px ✓).
3. **Hint visual de swipe** no primeiro carrossel (chevron animado nas bordas) para iniciantes descobrirem o gesto horizontal.

