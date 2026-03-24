

# Auditoria da Aba Novidades no Admin

## Bugs Encontrados

### 1. Botao "Add" invisivel em mobile (BUG de UX)
Mesmo problema corrigido em AdminFilmes e AdminSeries: o botao usa `opacity-0 hover:opacity-100` (linha 146). Em mobile nao existe hover.

**Correcao**: Mudar para `opacity-100 sm:opacity-0 sm:hover:opacity-100`.

### 2. `useAllNewsReleases` sem `refetchInterval`
Todos os outros hooks admin ja tem `refetchInterval: 60_000` (banners, daily_games, movies, series). O hook de novidades nao tem, causando inconsistencia.

**Correcao**: Adicionar `refetchInterval: 60_000`.

### 3. Sem batch update / refresh individual para itens existentes
AdminFilmes e AdminSeries ja tem botao "Atualizar X sem genero" com Progress bar e icone RefreshCw por item. AdminNovidades nao tem -- itens antigos sem genero ficam desatualizados para sempre.

**Correcao**: Adicionar batch update + refresh individual, usando a funcao `fetchTMDBDetails` ja existente no componente.

### 4. Sem label "sem genero" para itens sem metadados
AdminFilmes e AdminSeries mostram `sem genero` em amarelo. AdminNovidades nao mostra nada.

**Correcao**: Adicionar label amarelo italico quando `genres` e null/vazio.

### 5. Contagem so mostra total, nao ativo/inativo
AdminFilmes e AdminSeries mostram "X ativos / Y". AdminNovidades mostra so o total.

**Correcao**: Mostrar "X ativos / Y" no badge.

### 6. `fetchTMDBDetails` duplicado
AdminNovidades define sua propria `fetchTMDBDetails` local (linhas 16-32) que faz a mesma coisa que `useTMDBSearch().fetchDetails`. Codigo duplicado.

**Correcao**: Usar `fetchDetails` do hook `useTMDB` em vez da funcao local.

### 7. `useUpdateNewsRelease` nao inclui `rating` nem `image_url`
O Partial Pick no mutation so aceita `active | badge_type | display_order | title | overview | genres | runtime | seasons | tagline`. Falta `rating` e `image_url`, impedindo refresh completo de metadados.

**Correcao**: Adicionar `rating` e `image_url` ao tipo do mutation.

## Arquivos modificados
- `src/hooks/useNewsReleases.ts` -- adicionar `refetchInterval`, expandir tipo do `useUpdateNewsRelease`
- `src/pages/admin/AdminNovidades.tsx` -- botao Add mobile, remover `fetchTMDBDetails` duplicado, batch update + refresh individual, label "sem genero", contagem ativo/inativo

