

# Fix: Carrossel de Categorias — Corte Visual e Melhorias

## Problema Identificado

O marquee usa `overflow-hidden` no container, o que corta os itens nas bordas esquerda e direita. Alem disso, o `px-4` na section pai adiciona padding que nao se aplica ao conteudo do marquee internamente, criando um efeito de corte abrupto.

## Correcoes

### `src/components/public/CategoryIconsCarousel.tsx`

1. **Remover padding horizontal da section** que envolve o marquee (manter apenas no bloco de texto acima)
2. **Adicionar mascara de gradiente** (CSS mask) nas bordas do container para criar um fade suave em vez de corte abrupto — efeito profissional de "conteudo continua"
3. **Triplicar os itens** em vez de duplicar para evitar gaps visiveis em telas largas

### `src/index.css`

4. **Adicionar classe `.marquee-mask`** com `mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent)` para o fade nas bordas

## Resultado

- Sem corte abrupto nas bordas
- Fade suave indica que ha mais conteudo
- Animacao fluida sem gaps em qualquer largura de tela

