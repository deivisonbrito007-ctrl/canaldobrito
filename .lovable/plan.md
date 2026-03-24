

# Auditoria da Pagina Publica — Cards de Novidades, Filmes e Series

## Resultado da Auditoria

A pagina publica esta funcionando corretamente no geral. Os metadados fluem do banco para a UI sem bugs criticos.

### Fluxo verificado (OK)
- **NovidadesCard** (home tab): Exibe generos via `MetadataRow` (ate 2 generos), ano, tipo de conteudo. Passa `genres` para o detail sheet corretamente.
- **WeeklyMoviesSection** (aba Destaques): Exibe pill de genero (primeiro genero), rating com estrela, ano. Passa dados para detail sheet.
- **WeeklySeriesSection** (aba Destaques): Idem ao de filmes.
- **ContentDetailSheet**: Recebe e exibe rating, ano e primeiro genero corretamente.

### Issues Encontrados

#### 1. `NewsReleasesSection.tsx` e codigo morto (CLEANUP)
O componente nao e importado em nenhum lugar do projeto. O `NovidadesCard` faz a mesma funcao e e o que realmente aparece na Index. O arquivo `NewsReleasesSection.tsx` so ocupa espaco.

**Correcao**: Remover o arquivo.

#### 2. ContentDetailSheet so mostra 1 genero — NovidadesCard mostra 2 (INCONSISTENCIA)
O `MetadataRow` no card exibe `genres.split(",").slice(0, 2)`, mas o `ContentDetailSheet` so mostra `genre.split(",")[0]`. Ao abrir os detalhes, o usuario ve menos informacao que no card.

**Correcao**: Mostrar ate 2-3 generos no detail sheet, cada um como pill separada.

#### 3. NewsReleasesSection nao exibe generos no card overlay (MENOR — codigo morto)
Irrelevante pois o componente nao e usado, mas se fosse reativado, so mostra tipo e ano, sem generos.

## Arquivos modificados
- `src/components/public/NewsReleasesSection.tsx` — remover arquivo
- `src/components/public/ContentDetailSheet.tsx` — exibir ate 3 generos como pills separadas em vez de apenas 1

