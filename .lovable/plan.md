

# Corrigir trailer e melhorar visualização no ContentDetailSheet

## Problemas identificados

1. **Trailer nao carrega para itens subsequentes**: Bug no `ContentDetailSheet` -- `handleOpen` chama `setTriedTrailer(false)` e logo em seguida `fetchTrailer()`, mas como o setState e assincrono, `fetchTrailer` ainda ve `triedTrailer === true` e retorna sem buscar. Isso faz com que so o primeiro item aberto carregue o trailer.

2. **Trailer cortado no mobile**: Em tela de 384px, o iframe fica dentro de `px-5` (40px de padding), resultando em ~344px de largura e ~194px de altura para o video. Com poster + texto + trailer, o conteudo pode ficar apertado e o usuario precisa rolar bastante.

3. **Imagens em baixa resolucao**: As imagens do `news_releases` usam `w300` do TMDB, que fica pixelada no poster do sheet (w-28 = 112px em tela 3.75x DPR = 420px fisicos).

## Mudancas

### `src/components/public/ContentDetailSheet.tsx`
- **Corrigir bug do trailer**: Refatorar `fetchTrailer` para nao depender do state `triedTrailer` como guard. Usar `useEffect` com `open` e `item?.tmdb_id` como dependencias para disparar a busca automaticamente quando o sheet abre com um novo item.
- **Melhorar layout mobile do trailer**: Reduzir padding lateral para `px-4`, dar mais espaco ao video.
- **Poster responsivo**: Usar `w-24` no mobile (mais compacto) para deixar mais espaco para titulo/metadados.
- **Overview com line-clamp**: Limitar a sinopse a 4 linhas com `line-clamp-4` para evitar que empurre o trailer para fora da tela, com opcao de expandir.

### `src/components/public/NewsReleasesSection.tsx`
- Sem mudancas necessarias; o mapeamento de dados esta correto.

## Resultado esperado
- Trailer carrega corretamente para todos os itens (nao so o primeiro)
- Video nao fica cortado no mobile
- Experiencia mais fluida ao abrir detalhes

