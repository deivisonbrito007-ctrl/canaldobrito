

# Melhorar Poster do Card Novidades no Mobile

## Problema
O poster está com `h-[180px]` fixo no mobile e `object-cover`, cortando rostos e partes importantes da imagem.

## Melhorias propostas

### 1. Poster mais alto no mobile
Aumentar de `h-[180px]` para `h-[260px]` — mostra mais da imagem sem cortar.

### 2. Usar `object-top` no mobile
Muitos posters têm o conteúdo importante no topo (rostos, títulos). Trocar `object-cover` por `object-cover object-top` garante que a parte superior da imagem sempre aparece.

### 3. Gradient mais longo e suave
Aumentar o gradient de fade de `h-16` para `h-24` para uma transição mais cinematográfica entre poster e conteúdo.

### 4. Sobreposição do conteúdo sobre o poster
Em vez de empilhar poster + conteúdo separadamente, posicionar o conteúdo (badge, título, descrição, botões) sobre a parte inferior do poster com gradient overlay. Isso cria um visual estilo Netflix/streaming premium e aproveita melhor o espaço vertical.

## Arquivo alterado
- `src/components/public/NovidadesCard.tsx` — layout mobile: poster `h-[300px]` com conteúdo sobreposto via `absolute bottom-0` + gradient forte, resultando em um card mais cinematográfico sem cortar a imagem.

