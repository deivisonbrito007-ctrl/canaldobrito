## Objetivo

Substituir o botão verde pill atual no rodapé da aba **Programação** pelo mesmo CTA premium usado na aba **Novidades** (`cinema/PremiumCTA.tsx`), e elevar o acabamento desse componente para ficar mais profissional — aplicando a melhoria nas duas abas ao mesmo tempo (já que compartilham o mesmo componente).

## Mudanças

### 1. `src/components/public/cinema/PremiumCTA.tsx` — refinar o card

Manter a estrutura (título Bebas Neue + chips de categorias + botão pill verde), mas elevar o acabamento:

- **Borda e fundo:** dupla camada — `border-primary/20` + gradiente sutil `from-[#0d0f12] via-[#0a0b0e] to-[#0d0f12]`, com inner highlight (`shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`).
- **Glow:** trocar o blob inferior por um glow radial mais discreto (top-right) usando `bg-primary/10` + `blur-2xl`, para não competir com o conteúdo.
- **Cabeçalho:** adicionar um eyebrow pequeno acima do título — `PLANO PREMIUM · R$ 35/MÊS` em uppercase tracking wide, cor `text-primary/80`, fonte Syne.
- **Título:** `ASSISTA TUDO SEM LIMITES` — manter Bebas Neue, ajustar `text-[28px] sm:text-4xl`, `text-primary` apenas em "SEM LIMITES".
- **Subcopy:** uma linha curta em `text-foreground/65` font-body — "Esportes ao vivo, filmes e séries em um só lugar."
- **Chips de categorias:** trocar os emojis soltos por pills com `bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1 text-[11px]` — visual mais coeso, menos "infantil".
- **CTA:** botão pill `bg-primary text-primary-foreground`, `min-h-[52px]`, com micro-shimmer (igual ao da Programação atual — manter brilho diagonal repetindo a cada ~5s, respeitando `motion-reduce:hidden`). Texto: `ASSINAR AGORA` em Bebas Neue + `ArrowRight`.
- **Trust line (opcional, mas recomendado):** linha minúscula abaixo do botão `Pix · Sem fidelidade · Cancele quando quiser` em `text-[10.5px] text-foreground/50`.
- **Mobile-first:** padding `p-5 sm:p-7`, raio `rounded-3xl`, respeitar safe areas via `mx-4`.
- **Acessibilidade:** `aria-label` no Link, foco visível (`focus-visible:ring-2 ring-primary/60 ring-offset-2 ring-offset-background`).

### 2. `src/components/public/ProgramacaoTab.tsx` — usar o mesmo componente

- Remover o bloco `<Link to="/assinar">` atual (linhas 282–319) e o `<style>` do shimmer local (que vira responsabilidade do `PremiumCTA`).
- Importar e renderizar `<PremiumCTA />` no mesmo lugar (após o estado vazio).
- Trocar o destino para `/assinar?from=programacao-bottom` (passando uma prop opcional `from` no componente para rastrear a origem sem duplicar o componente). Default mantém `/assinar` para Novidades, ou padronizamos com query param por aba.

### 3. Manter consistência

- A aba **Ao Vivo** já tem seu próprio `PremiumCTA` interno em `LivePageContent.tsx` (formato horizontal compacto). **Não mexer** — escopo do pedido é só Programação + Novidades.

## Detalhes técnicos

- Arquivos editados: 2 (`cinema/PremiumCTA.tsx`, `ProgramacaoTab.tsx`).
- Sem mudanças de schema, rotas, tokens globais ou regras de negócio.
- Animação respeita `prefers-reduced-motion` (regra global do projeto).
- Tokens semânticos: usar `--primary`, `--foreground`, `--surface-2` já existentes; não adicionar cor nova.