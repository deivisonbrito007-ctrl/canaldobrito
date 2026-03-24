

# Atualizar Filmes Existentes com Metadados do TMDB

## Problema
Filmes adicionados antes da correcao de generos tem o campo `genre` vazio no banco. Precisam ser atualizados com dados reais do TMDB.

## Solucao

### 1. Botao "Atualizar metadados" no AdminFilmes
Adicionar um botao no header da secao "Adicionados" que percorre todos os filmes com `genre` nulo, busca `movie_details` no TMDB para cada um, e faz update com genero, rating e overview atualizados.

### 2. Hook `useUpdateMovie` no useMovies.ts
Criar mutation que faz `supabase.update({ genre, rating, overview, poster_url }).eq("id", id)` para atualizar campos de um filme existente.

### 3. Botao individual de refresh por filme
Adicionar um icone de refresh ao lado do switch de cada filme na lista, permitindo atualizar metadados individualmente.

### 4. Logica de batch update
- Filtrar filmes onde `genre` e null ou vazio
- Para cada um, chamar `fetchDetails("movie_details", tmdb_id)`
- Atualizar com genero em texto, rating e overview
- Mostrar progresso ("Atualizando 3/5...")
- Toast final com contagem de atualizados

## Arquivos modificados
- `src/hooks/useMovies.ts` — adicionar `useUpdateMovie` mutation
- `src/pages/admin/AdminFilmes.tsx` — botao batch update + botao individual refresh, logica de progresso

