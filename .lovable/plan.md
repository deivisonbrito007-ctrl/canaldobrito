

# Auditoria Completa: Fluxo Novidades

## Resultado da Auditoria

Analisei todos os arquivos do fluxo: `useNewsReleases.ts`, `AdminNovidades.tsx`, `NewsReleasesSection.tsx`, `useTMDB.ts`, `AdminDashboard.tsx`, e os testes existentes.

### Bugs Encontrados

1. **Carousel index out of bounds**: Se o admin desativa um item enquanto o carousel roda, `current` pode apontar para um index que não existe mais, causando crash (`item` undefined).

2. **Dots com overlap**: Os botões dos dots usam `-m-4` (margem negativa), fazendo com que se sobreponham e sejam difíceis de clicar.

3. **Imagens de baixa qualidade**: O carousel usa imagens `w300` do TMDB (300px largura) para um container de 360-420px de altura. Deveria usar `w780` ou `original`.

4. **Sem reordenação no admin**: Não há como reordenar os itens de novidades no painel admin. O `display_order` é atribuído na adição mas nunca pode ser alterado.

5. **`useUpdateNewsRelease` muito restritivo**: O tipo só aceita `active` e `badge_type`, mas não `display_order` ou outros campos.

### Sugestões de Melhoria

- Adicionar contador de slide atual (ex: "2/6") no carousel
- Melhorar feedback de loading nos botões do admin (spinner ao deletar/toggle)

## Plano de Correção

### 1. Fix crash de index out of bounds (`NewsReleasesSection.tsx`)
- Adicionar guard: `const safeIndex = Math.min(current, total - 1)`
- Reset `current` para 0 quando `items` mudam

### 2. Fix dots overlap (`NewsReleasesSection.tsx`)
- Remover `-m-4` dos botões dos dots e usar padding correto para touch target

### 3. Upgrade qualidade de imagem
- `AdminNovidades.tsx`: Mudar `TMDB_IMG` de `w300` para `w780` na hora de salvar no banco
- `NewsReleasesSection.tsx`: Sem mudança necessária (já usa a URL salva)

### 4. Ampliar tipo do `useUpdateNewsRelease` (`useNewsReleases.ts`)
- Permitir atualizar `display_order`, `title`, `overview` além de `active` e `badge_type`

### 5. Adicionar reordenação no admin (`AdminNovidades.tsx`)
- Botões de seta (cima/baixo) em cada item para reordenar via `display_order`

### 6. Rodar testes existentes
- Executar `gameUtils.test.ts` para confirmar que os 14 testes passam

## Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `src/components/public/NewsReleasesSection.tsx` | Fix index, fix dots, adicionar indicador de slide |
| `src/hooks/useNewsReleases.ts` | Ampliar tipo do update mutation |
| `src/pages/admin/AdminNovidades.tsx` | Upgrade imagem w780, botões de reordenação |

