

# Revisao e Melhorias da Pagina /assinar

## Problemas Identificados

1. **CTA "Assinar agora" dentro do card de preco usa `<a>` sem `display: block`** -- o `mt-4` nao funciona corretamente pois esta dentro de `space-y-3`
2. **Falta um CTA flutuante/fixo** -- usuario precisa rolar ate o final para converter; um botao sticky no rodape melhora conversao
3. **Carrossel marquee nao pausa no hover (desktop)** -- so tem `onTouchStart/End`, falta `onMouseEnter/Leave` para desktop
4. **Secao "Trust badges" fica solta entre "Informacoes importantes" e "Referral"** -- fluxo visual fragmentado
5. **Footer sem safe-area padding** -- pode ficar coberto em iPhones com barra inferior

## Melhorias Propostas

### 1. Adicionar CTA flutuante sticky no rodape
Botao fixo na parte inferior da tela que aparece apos o usuario rolar passando o card de preco. Usa `IntersectionObserver` para mostrar/esconder. Melhora taxa de conversao significativamente.

### 2. Adicionar hover pause no marquee (desktop)
Adicionar `onMouseEnter={pauseMarquee}` e `onMouseLeave={resumeMarquee}` no container do carrossel.

### 3. Mover Trust badges para dentro do card de preco
Integrar os badges "Sem fidelidade", "Suporte WhatsApp", "+5000 clientes" como sub-items dentro da secao de pricing, melhorando o fluxo visual.

### 4. Adicionar animacao de entrada nas secoes
Usar CSS `animation` simples (fade-in + slide-up) nas secoes conforme entram no viewport, dando mais vida a pagina.

### 5. Adicionar safe-area padding no footer
`pb-[env(safe-area-inset-bottom)]` para iPhones.

### 6. Adicionar badge "MAIS POPULAR" no card de preco
Destaque visual no topo do card de pricing.

## Arquivo modificado
- `src/pages/Assinar.tsx` -- todas as mudancas acima

