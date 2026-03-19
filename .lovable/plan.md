

# Corrigir trailer cortado, sobreposicao do BottomNav e fallback de videos

## Problemas identificados (via screenshots)

1. **Trailer cortado pelo BottomNav**: O sheet usa `z-50` e `pb-8` (32px), mas o BottomNav tambem e `z-50` fixo no bottom. O conteudo do sheet fica atras da nav bar. Precisa de padding inferior maior e z-index superior.

2. **Alguns itens nao mostram trailer**: A API TMDB retorna videos com `language=pt-BR`, o que limita os resultados. Para series como Virgin River, pode nao haver trailer em pt-BR. Precisa fazer fallback para busca sem idioma quando a busca em pt-BR nao retorna resultados.

3. **Sobreposicao visual**: O sheet e o BottomNav competem no mesmo z-index, causando o corte visual.

## Mudancas

### `src/components/public/ContentDetailSheet.tsx`
- Aumentar z-index do backdrop e sheet para `z-[60]` (acima do BottomNav z-50)
- Aumentar padding inferior para `pb-24` para garantir que o trailer nao fique atras da nav bar
- Melhorar logica de busca de trailer: se a busca em pt-BR nao retornar videos do YouTube, fazer segunda busca sem idioma (remover `language=pt-BR` ou usar `en-US`) para capturar trailers em ingles

### `supabase/functions/tmdb-proxy/index.ts`
- Adicionar nova action `tv_videos_en` e `movie_videos_en` que busca videos sem filtro de idioma (ou com `en-US`), para ser usado como fallback quando pt-BR nao retorna resultados

## Resultado esperado
- Trailer visivel por completo sem corte pelo BottomNav
- Mais itens exibindo trailer (fallback para ingles quando nao ha video em pt-BR)
- Sheet aparece acima de todos os elementos da interface

