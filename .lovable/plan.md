
## O que verifiquei

Há 2 problemas distintos no projeto agora:

1. **Erro fatal anterior: `doubled is not defined`**
   - No código atual de `CategoryIconsCarousel.tsx`, **não existe mais `doubled`**.
   - O arquivo já usa `const tripled = [...]` e renderiza `tripled.map(...)`.
   - Também não encontrei nenhuma ocorrência de `doubled` no `src/`.
   - Isso indica forte chance de **preview/HMR servindo bundle antigo** ou estado inconsistente do ambiente.

2. **Erros/warnings reais que ainda permanecem**
   - Os logs mostram:
     - `Function components cannot be given refs` em `ContentDetailSheet`
     - `Function components cannot be given refs` em `BannerCard`
   - O `vite.config.ts` **já está com `dedupe` de React**, então esse problema **não é** o caso clássico de React duplicado.
   - A causa mais provável é o uso de componentes funcionais simples em contextos onde alguma lib espera repassar `ref` (especialmente com `framer-motion` / composição de componentes).

## Plano de correção

### 1) Eliminar a causa do crash residual do carrossel
- Revisar o componente do carrossel para garantir que:
  - só exista `tripled`
  - não haja referência indireta antiga em helper/import exportado
- Fazer uma pequena refatoração defensiva:
  - renomear a lista renderizada para algo explícito como `carouselItems`
  - manter a declaração imediatamente acima do componente
- Objetivo: reduzir risco de preview ficar preso em símbolo antigo do HMR.

### 2) Corrigir os warnings de `ref` em `ContentDetailSheet`
- Ajustar `ContentDetailSheet` para ser compatível com componentes que tentam anexar `ref`.
- A abordagem mais segura será:
  - converter o componente para `React.forwardRef`, **ou**
  - remover a necessidade de receber `ref` na composição atual, mantendo `motion.div` apenas em elementos DOM.
- Isso deve eliminar o warning vindo de `NewsReleasesSection`.

### 3) Corrigir os warnings de `ref` em `BannerCard`
- Aplicar a mesma estratégia em `BannerCard`:
  - converter para `forwardRef`, **ou**
  - reorganizar para que `motion.div` envolva apenas um elemento DOM sem passar ref para o componente funcional.
- Isso resolve o warning disparado em `CategorySection`.

### 4) Revisar composição com Framer Motion
- Fazer uma checagem rápida nos componentes públicos que usam `motion` + componentes locais:
  - `BannerSections`
  - `NewsReleasesSection`
  - `ContentDetailSheet`
- Objetivo: garantir que nenhum componente funcional simples esteja sendo tratado como alvo de `ref`.

### 5) Validação após ajuste
- Confirmar que:
  - a home não fica em tela branca
  - o carrossel renderiza sem erro
  - os warnings de `ref` desaparecem do console
  - o marquee continua sem corte abrupto nas bordas

## Sugestões adicionais

Se quiser aproveitar a correção, eu recomendo também:
- simplificar o cabeçalho promocional dentro de `CategoryIconsCarousel` se ele estiver “pesando” visualmente
- desacelerar um pouco o marquee em desktop
- pausar automaticamente o marquee em hover e em foco por acessibilidade
- adicionar fallback visual caso o ambiente entre em estado inconsistente novamente

## Detalhes técnicos

- `vite.config.ts` já está correto para deduplicação de React, então **não vale insistir nessa linha**.
- O próximo passo certo é corrigir a compatibilidade de `ref` nos componentes compostos.
- O erro `doubled` parece ser **resíduo de bundle antigo**, mas vale blindar o componente com uma refatoração mínima para evitar nova inconsistência de HMR.
