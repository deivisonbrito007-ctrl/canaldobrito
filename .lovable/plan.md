# Aviso informativo na aba Ao Vivo

## Objetivo
Exibir o comunicado "Os canais e horários podem sofrer alterações de última hora sem aviso prévio. Agradecemos a compreensão!" na aba **Ao Vivo**, em formato informativo, sem poluir a UX.

## Sugestões de design (proposta escolhida em negrito)

**Banner âmbar dismissable abaixo do hero header**, logo após o card "Ao Vivo / Nº jogos agora" e antes da grid de jogos. Usa cor âmbar (warning) já presente no design system, ícone `Info`, botão de fechar `X` no canto. A escolha é lembrada em `localStorage` (`live-notice-dismissed-v1`) para não reaparecer toda visita — mas reaparece se mudarmos o `v1` futuramente.

Alternativas descartadas:
- Toast: some rápido demais; usuário pode perder.
- Marquee/ticker no topo: chama atenção mas atrapalha leitura em mobile.
- Modal: invasivo demais para um aviso recorrente.

## Implementação

Arquivo: `src/components/public/LivePageContent.tsx`

1. Importar `Info` e `X` de `lucide-react`.
2. Criar componente local `LiveNotice`:
   - Estado `dismissed` lendo `localStorage.getItem("live-notice-dismissed-v1") === "1"`.
   - Se dismissed, não renderiza.
   - Layout: card horizontal, mx-3, rounded-xl, `bg-amber-500/10 border border-amber-500/30`, padding compacto.
   - Ícone `Info` âmbar à esquerda, texto curto ao centro (font-body, text-[11px], leading-snug, text-amber-100/90), botão `X` (≥44px touch target via padding) à direita com `aria-label="Dispensar aviso"`.
   - Ao clicar X: animação de fade-out via framer-motion, depois `setItem` e `setDismissed(true)`.
   - Respeita `prefers-reduced-motion` (sem animação de entrada além de fade simples).
3. Renderizar `<LiveNotice />` dentro do return do `LivePageContent`, imediatamente após o `</section>` do hero (linha ~415) e antes do bloco `{isLoading && ...}`.

Texto exato:
> Os canais e horários podem sofrer alterações de última hora sem aviso prévio. Agradecemos a compreensão!

## Acessibilidade
- `role="status"` no card (info não-crítica).
- Botão X com `aria-label`.
- Cor âmbar com contraste ≥ 4.5:1 sobre fundo escuro (usar `text-amber-100/90`).
- Touch target do X ≥ 44px (p-2.5 + ícone h-4).
