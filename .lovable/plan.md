

# Auditoria da Aba Filmes no Admin

## Bugs Encontrados

### 1. Genero nunca e salvo (BUG)
Na `handleAdd` (linha 37), `genre` e sempre `null`. O TMDB retorna `genre_ids` (array de numeros), nao texto. A aba Series tem o mesmo bug. O campo `genre` no banco fica vazio, e os cards publicos nunca mostram a pill de genero.

**Correcao**: Fazer uma chamada `movie_details` ao TMDB apos selecionar o filme para buscar os generos em texto. Alternativa mais simples: criar um mapa local dos IDs de genero mais comuns do TMDB e converter `genre_ids` para texto na hora do `handleAdd`.

### 2. Botao "Add" invisivel em mobile (BUG de UX)
O botao `<Plus> Add` nos resultados de busca usa `opacity-0 hover:opacity-100` (linha 92). Em mobile nao existe hover -- o botao so aparece com `active:opacity-100`, que e um flash imperceptivel. O usuario nao consegue adicionar filmes no celular facilmente.

**Correcao**: Tornar o botao sempre visivel em mobile (`opacity-100 sm:opacity-0 sm:hover:opacity-100`) ou adicionar um overlay tap-friendly.

### 3. Resultados de busca persistem ao trocar de aba
Se o admin busca "Matrix", os resultados aparecem. Se clica em "Em cartaz", os resultados de "Em cartaz" substituem. Mas se volta para "Buscar", os resultados de "Em cartaz" continuam exibidos (o hook `useTMDBSearch` compartilha o estado `results`). Confuso.

**Correcao**: Limpar resultados ao trocar de aba com `setResults([])`.

### 4. Sem tratamento de erro na busca TMDB
Se a Edge Function falhar (ex: chave TMDB nao configurada), o `useTMDBSearch` faz `console.error` e seta `results` como `[]`. O admin nao recebe feedback visual -- parece que nao encontrou nada.

**Correcao**: Adicionar um toast de erro no `catch` do `useTMDBSearch`, ou retornar um estado `error` do hook e exibi-lo na UI.

### 5. Sem testes unitarios para AdminFilmes
Nenhum teste existe para a pagina de filmes no admin. A aba Series tambem nao tem.

## Melhorias Propostas

### 6. Buscar genero real via TMDB details
Ao adicionar o filme, fazer uma chamada extra `movie_details` para buscar `genres[].name` e salvar como texto separado por virgula. Isso popula a pill de genero nos cards publicos.

### 7. Contagem ativo/inativo no header
Mostrar "3 ativos / 5 total" no badge de contagem, dando visibilidade rapida.

### 8. Busca com debounce
Adicionar debounce de 500ms no input de busca para evitar chamadas excessivas a API ao digitar.

## Arquivos modificados
- `src/pages/admin/AdminFilmes.tsx` -- botao Add visivel em mobile, limpar resultados ao trocar aba, contagem ativo/inativo, buscar genero via details
- `src/pages/admin/AdminSeries.tsx` -- mesmas correcoes (botao mobile, limpar resultados, genero)
- `src/hooks/useTMDB.ts` -- adicionar estado `error` e toast, expor `setResults`
- `src/components/public/__tests__/AdminFilmes.test.tsx` -- testes basicos (render, estado vazio, lista de filmes)

