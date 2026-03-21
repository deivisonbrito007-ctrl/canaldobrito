

# Corrigir Imagem Cortada no Card Novidades

## Problema
Mesmo com `h-[300px]` e `object-cover object-top`, a imagem continua sendo cortada porque `object-cover` **sempre** recorta para preencher o container.

## Solução: Trocar para `object-contain` no mobile

Em vez de forçar a imagem a preencher e cortar, usar `object-contain` que mostra a imagem **inteira** sem cortar nada. O fundo escuro do card preenche o espaço restante naturalmente.

### Mudanças em `NovidadesCard.tsx`

1. **Imagem mobile**: trocar `object-cover object-top` por `object-contain object-top` — mostra o poster inteiro
2. **Fundo da área do poster**: adicionar `bg-surface` para que o espaço ao redor da imagem fique com a cor do card (sem buracos)
3. **Ajustar altura**: usar `h-[280px]` — suficiente para mostrar o poster sem desperdiçar espaço vertical
4. **Manter desktop**: `sm:object-contain sm:object-center` continua igual

### Resultado esperado
- Mobile: poster aparece **inteiro** (sem corte), centralizado no topo, com fundo escuro nas laterais
- Desktop: sem mudança

