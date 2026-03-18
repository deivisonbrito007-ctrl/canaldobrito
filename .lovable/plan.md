

# Plano: Seção Unificada "Assista Hoje"

## Resumo

Substituir as duas seções separadas (Filmes em Destaque + Séries em Destaque) por uma única seção **"Assista Hoje"** que mistura filmes e séries num grid único, com badge de tipo (🎬 Filme / 📺 Série) no topo-esquerdo de cada card.

## Arquivos Afetados

### 1. Criar `src/components/public/WatchTodaySection.tsx`
- Novo componente que consome **ambos** `useActiveMovies` e `useActiveSeries`
- Unifica os resultados num array com campo `type: 'movie' | 'series'`
- Ordena por `created_at` desc (intercalando filmes e séries)
- Renderiza um único grid com cards idênticos aos atuais
- Cada card recebe um **badge no topo-esquerdo**:
  - Filme: fundo verde semi-transparente (`bg-emerald-500/80`), texto "🎬 Filme"
  - Série: fundo azul semi-transparente (`bg-blue-500/80`), texto "📺 Série"
- Badge: `rounded-lg`, `text-[10px]`, `backdrop-blur-sm`, `px-2 py-0.5`
- Header da seção: ícone Play, título "Assista Hoje", badge de contagem total
- Estados de loading e vazio unificados

### 2. Editar `src/pages/Index.tsx`
- Remover imports de `MoviesSection` e `SeriesSection`
- Importar e usar `WatchTodaySection` no lugar das duas seções
- Uma única `<div className="px-4 sm:px-6">` com o novo componente

### 3. Manter `MoviesSection.tsx` e `SeriesSection.tsx`
- Não deletar (podem ser usados no admin ou futuro), apenas removidos da home

## Detalhes do Card

O card é idêntico ao existente (poster 2:3, rating badge amber top-right, gradient overlay, título, ano, gênero, sinopse). A única adição é o badge de tipo no **top-left**, posicionado para não conflitar com o rating badge (top-right).

