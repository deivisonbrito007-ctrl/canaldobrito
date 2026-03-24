

# Trailers do YouTube nos Cards de Novidades e Filmes

## Situacao Atual
O `ContentDetailSheet` ja busca trailers via TMDB proxy (pt-BR com fallback EN) e exibe um iframe do YouTube. Porem, o usuario so ve o trailer depois de abrir o detail sheet. Nao ha indicacao visual nos cards de que um trailer esta disponivel.

## Solucao

### 1. Hook `useTrailerKey` reutilizavel
Extrair a logica de fetch de trailer do `ContentDetailSheet` para um hook dedicado `src/hooks/useTrailerKey.ts`. Recebe `tmdb_id` e `content_type`, retorna `{ trailerKey, loading }`. Usa cache em memoria (Map) para evitar chamadas repetidas ao mesmo `tmdb_id`.

### 2. Botao Play nos cards de Filmes (`WeeklyMoviesSection`)
Adicionar um icone de Play semi-transparente sobre o poster de cada `MovieCard`. Ao clicar no Play, abre um modal leve com o iframe do YouTube (em vez de abrir o detail sheet completo). Clicar fora do Play continua abrindo o detail sheet normalmente.

O trailer so e buscado sob demanda (ao clicar no Play), nao em batch, para evitar dezenas de chamadas simultaneas ao TMDB.

### 3. Botao Play no card de Novidades (`NovidadesCard`)
Adicionar um botao "▶ Trailer" discreto abaixo do titulo/metadata. Ao clicar, abre o mesmo modal de trailer. O clique no card continua abrindo o detail sheet.

### 4. Modal de Trailer (`TrailerModal`)
Componente simples: backdrop escuro + iframe do YouTube centralizado em aspect-video. Fecha ao clicar no backdrop ou no X. Reutilizado por ambos os cards.

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/hooks/useTrailerKey.ts` | Criar — hook com fetch + cache |
| `src/components/public/TrailerModal.tsx` | Criar — modal leve com iframe YouTube |
| `src/components/public/WeeklyMoviesSection.tsx` | Adicionar botao Play no MovieCard |
| `src/components/public/NovidadesCard.tsx` | Adicionar botao Trailer |
| `src/components/public/ContentDetailSheet.tsx` | Refatorar para usar `useTrailerKey` |

