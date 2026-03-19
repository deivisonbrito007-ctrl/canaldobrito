

# Adicionar detalhes ao clicar na seção Novidades

## O que será feito

Ao tocar/clicar no card do carrossel de Novidades, o `ContentDetailSheet` abrirá mostrando poster, sinopse, metadados e trailer do YouTube — mesmo comportamento já implementado nas seções de Filmes e Séries da aba Destaques.

## Mudanças técnicas

### `src/components/public/NewsReleasesSection.tsx`
- Importar `ContentDetailSheet`
- Adicionar estado `selectedItem` para controlar qual item está selecionado
- Adicionar `onClick` na área do card do carrossel (região do conteúdo, não nos dots de navegação)
- Mapear os campos do `NewsRelease` para o formato esperado pelo `ContentDetailSheet` (`image_url` → `poster_url`, `genres` → `genre`)
- Renderizar `<ContentDetailSheet>` no final do componente

### Cuidados
- O swipe (touch) continua funcionando normalmente — o `onClick` só dispara se não houve swipe (o threshold de 50px já existe)
- Pausar o timer do carrossel enquanto o sheet estiver aberto, retomar ao fechar

