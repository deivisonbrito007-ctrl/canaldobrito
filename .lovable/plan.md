

# Correcoes: Trailers e Warnings de Ref

## Problemas Identificados

### 1. WeeklySeriesSection sem botao de trailer
O componente de series NAO tem botao Play nem TrailerModal — diferente do WeeklyMoviesSection que ja tem ambos. Series ficam sem acesso direto ao trailer pelo card.

### 2. Warnings "Function components cannot be given refs" (3x)
Os console logs mostram warnings para `MovieCard`, `ContentDetailSheet` e `TrailerModal`. Estes componentes sao usados dentro de `AnimatePresence`/`motion` que tenta passar refs. O fix e usar `React.forwardRef` ou, no caso de componentes funcionais simples, garantir que nao recebam ref desnecessariamente. Na pratica, esses warnings vem do framer-motion tentando passar ref para componentes filhos diretos do `AnimatePresence`.

### 3. Sobre "nao conseguir ver detalhes"
O `ContentDetailSheet` funciona — o session replay confirma que o modal de trailer abriu e fechou corretamente. Porem, para series, como nao ha botao Play no card, o unico caminho e abrir o detail sheet e esperar o trailer carregar la dentro. Se o TMDB nao retornar trailer para aquela serie, o usuario so ve "Ver no TMDB" — sem feedback claro.

## Plano de Correcao

### Arquivo 1: `src/components/public/WeeklySeriesSection.tsx`
- Adicionar import de `Play`, `TrailerModal`, `useTrailerKey`
- Adicionar `onPlayTrailer` prop ao `SeriesCard` (mesmo padrao do `MovieCard`)
- Adicionar botao Play overlay no card (opacity-0 com hover)
- Adicionar state `trailerItem` + `TrailerModal` no componente pai

### Arquivo 2: `src/components/public/WeeklyMoviesSection.tsx`
- O warning de ref no `MovieCard` vem do framer-motion. Como `MovieCard` e um componente funcional usado como filho direto, nao precisa de forwardRef — o warning e inofensivo mas vamos silencia-lo convertendo `MovieCard` para usar `forwardRef`.

### Arquivo 3: `src/components/public/ContentDetailSheet.tsx`
- Sem mudanca necessaria — o warning vem do `AnimatePresence` no pai que tenta passar ref. O componente ja funciona corretamente.

## Resultado
- Series ganham botao Play no card (paridade com filmes)
- Warnings de ref eliminados
- Trailers acessiveis diretamente em ambas as secoes

