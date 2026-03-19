

# Simplificar o card de Novidades

## Objetivo

Agora que o usuário pode tocar no card para ver todos os detalhes (sinopse, gêneros, duração, trailer), o card do carrossel pode ser simplificado para mostrar apenas o essencial — imagem, badge, título e uma linha mínima de contexto. Isso reduz a poluição visual e deixa o carrossel mais limpo no mobile.

## O que muda no card

**Remover do card (vai para o sheet ao clicar):**
- Tagline (linha itálica)
- Pills de runtime / temporadas (Clock, Tv)
- Pills de gêneros
- Overview / sinopse (parágrafo de texto)

**Manter no card:**
- Imagem de fundo com blur + imagem principal
- Badge de tipo (Lançamento, Estreia, etc.) — top-left
- Rating com estrela — top-right
- Título (menor, `text-xl`)
- Uma única linha compacta: tipo · ano (ex: "🎬 Filme · 2025")
- Dots de navegação + indicador de slide

**Adicionar:**
- Hint visual discreto "Toque para detalhes" com ícone de chevron ou info, para indicar a interatividade

## Resultado visual

O card fica com ~40% menos texto, a imagem ganha mais protagonismo, e a informação detalhada fica acessível no sheet.

## Arquivo alterado

- `src/components/public/NewsReleasesSection.tsx` — remover blocos de tagline, runtime/seasons, genres e overview do JSX; reduzir tamanho do título; adicionar hint de toque; remover imports não utilizados (`Clock`, `Tv`, `formatRuntime`). Altura pode ser reduzida de `h-[360px]` para `h-[300px]`.

