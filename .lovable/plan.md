

# Correcao de Bugs e Melhorias na Pagina /assinar

## Bugs Encontrados

### 1. Conflito CSS no botao CTA do pricing (linha 269)
O botao tem `className="block mt-4 w-full flex ..."` — `block` e `flex` sao conflitantes. O `block` sobrescreve o `flex`, quebrando o alinhamento do icone + texto. Corrigir para apenas `flex`.

### 2. Import nao utilizado
`Users` esta importado do Lucide (linha 3) mas nao e usado em nenhum lugar do componente. Remover para limpar o codigo.

### 3. Secao "COMECE AGORA" continua redundante com sticky CTA
A secao final repete badges de confianca que ja estao no card de pricing ("Sem fidelidade"). Simplificar ou diferenciar os textos.

## Melhorias Propostas

### 4. Carrossel: items de canal sem logo real
Os canais de TV usam emojis genericos (📺, ⚽, 💥) em vez de logos reais como os apps de streaming. Isso cria uma inconsistencia visual entre apps (com PNG) e canais (com emoji). **Sugestao**: manter os emojis por ora, mas aumentar levemente o tamanho para melhor visibilidade.

### 5. Hover no container do marquee ja duplicado no CSS
O CSS ja tem `.marquee-container:hover .marquee-track { animation-play-state: paused }` (linha 261), e o componente TAMBEM adiciona `onMouseEnter={pauseMarquee}` via JS. Isso e redundante — o hover CSS ja pausa. O JS so e necessario para o touch. Remover `onMouseEnter/Leave` para evitar conflito com o resume timer de 2s no desktop.

## Arquivo modificado
- `src/pages/Assinar.tsx` — corrigir bug do `block flex`, remover import nao usado, limpar handlers redundantes

