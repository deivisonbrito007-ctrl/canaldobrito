

# Auditoria Completa: Aba Novidades + Testes + Sugestoes

## Resultado da Auditoria

Analisei todo o fluxo da aba Novidades (public e admin): `NovidadesCard.tsx`, `useNewsReleases.ts`, `useTrailerAvailability.ts`, `useTrailerKey.ts`, `ContentDetailSheet.tsx`, `TrailerModal.tsx`, `AdminNovidades.tsx`, `HighlightsTab.tsx`, e `Index.tsx`.

### Problemas Encontrados

**1. Memory leak no timer do NovidadesCard**
Quando `total` muda de >1 para 1 (admin desativa itens), o `startTimer` continua rodando porque o cleanup do `useEffect` (linha 77) só limpa no unmount, mas `startTimer` recria o interval sem checar `total > 1`. Se `total === 1`, o interval roda desnecessariamente com modulo `(c + 1) % 1 = 0`.

**2. ContentDetailSheet nao recebe `backdrop_url` do NovidadesCard**
O `NovidadesCard` passa `poster_url: selectedItem.image_url` mas nunca envia `backdrop_url`. O `news_releases` nao tem coluna `backdrop_url`, entao o sheet nunca mostra o hero backdrop para novidades. Isso empobrece a experiencia visual.

**3. Sem testes unitarios para NovidadesCard**
Nenhum teste existe para o componente principal de Novidades. Outros componentes similares (`WeeklyMoviesSection`, `WeeklySeriesSection`, `BannerSections`) ja tem testes.

**4. `trailerCache` nao trata erros como cache miss**
Em `useTrailerAvailability` (linha 106), quando o `catch` dispara, o item nao e adicionado ao cache. Na proxima renderizacao, ele sera re-fetched infinitamente. Deveria cachear como `null` no catch.

### O que esta correto
- Swipe touch com threshold de 50px funciona bem
- `didSwipe` previne click apos swipe
- Auto-rotacao 5s com pause no touch/click
- Fallback PT→EN nos trailers
- Shared `trailerCache` entre availability e key hooks
- Loading/error states corretos
- Reorder funcional no admin
- Badge type editavel inline

---

## Plano de Correcao

### 1. `src/components/public/NovidadesCard.tsx` — Fix timer leak
- No `startTimer`, adicionar guard: se `total <= 1`, nao criar interval
- Corrigir para evitar interval desnecessario com item unico

### 2. `src/hooks/useTrailerAvailability.ts` — Cache errors
- No bloco `catch` (linha 106), adicionar `cache.set(tmdb_id, null)` para evitar re-fetch infinito

### 3. Criar `src/components/public/__tests__/NovidadesCard.test.tsx`
- Testar renderizacao com items mockados
- Testar estado vazio (retorna null)
- Testar estado loading (retorna null)
- Testar navegacao entre slides (next/prev)
- Testar badge labels para cada tipo

### 4. Rodar suite de testes completa
- Executar todos os 39+ testes existentes + novos

---

## Sugestoes de Melhorias

### UI/Dashboard
1. **Skeleton para NovidadesCard**: Quando `isLoading` e `true`, mostrar um skeleton em vez de `null`, evitando layout shift
2. **Contador de itens ativos no header**: Mostrar "3 de 6 ativos" no titulo da secao publica
3. **Prefetch de backdrop_url**: Adicionar coluna `backdrop_url` ao `news_releases` e buscar do TMDB no admin, para o detail sheet mostrar o hero visual

### Arquivos modificados
- `src/components/public/NovidadesCard.tsx` (timer fix + skeleton)
- `src/hooks/useTrailerAvailability.ts` (cache error)
- `src/components/public/__tests__/NovidadesCard.test.tsx` (novo)

