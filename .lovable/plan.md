

# Auditoria da Aba Series no Admin

## Bugs e Gaps Encontrados

### 1. Sem `useUpdateSeries` — impossivel atualizar metadados (GAP CRITICO)
O hook `useSeries.ts` nao tem mutation de update. Series adicionadas antes da correcao de generos ficam com `genre: null` para sempre. AdminFilmes ja tem `useUpdateMovie` + batch update + refresh individual, mas AdminSeries nao.

**Correcao**: Criar `useUpdateSeries` no `useSeries.ts` (mesmo padrao do `useUpdateMovie`).

### 2. Sem botao de batch update nem refresh individual
AdminFilmes tem botao "Atualizar X sem genero" com Progress bar e icone RefreshCw por item. AdminSeries nao tem nenhum dos dois.

**Correcao**: Adicionar batch update + refresh individual ao AdminSeries, usando `tv_details` em vez de `movie_details`.

### 3. Sem label "sem genero" para series sem metadados
AdminFilmes mostra `sem genero` em amarelo para filmes sem genre. AdminSeries nao mostra nada — o campo simplesmente nao aparece.

**Correcao**: Adicionar o mesmo label amarelo italico.

### 4. `useAllSeries` sem `refetchInterval`
Diferente de `useAllBanners` e `useAllDailyGames` (que ja tem `refetchInterval: 60_000`), o hook de series nao tem refetch automatico.

**Correcao**: Adicionar `refetchInterval: 60_000`.

## Arquivos modificados
- `src/hooks/useSeries.ts` — adicionar `useUpdateSeries` mutation + `refetchInterval`
- `src/pages/admin/AdminSeries.tsx` — batch update, refresh individual, label "sem genero", Progress bar

