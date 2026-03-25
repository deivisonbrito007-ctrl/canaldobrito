

# Batch Update: Atualizar Todos (incluindo backdrops)

## Problema
O botao batch atual so atualiza filmes/series **sem genero** (`!m.genre`). Itens que ja tem genero mas nao tem `backdrop_url` ficam de fora.

## Correcao

### AdminFilmes.tsx e AdminSeries.tsx — mesma mudanca em ambos:

1. **Expandir filtro**: trocar `!m.genre` por `!m.genre || !m.backdrop_url` para incluir itens sem backdrop
2. **Adicionar botao "Atualizar Todos"** separado que forca update de TODOS os itens (ignora filtro)
3. **Atualizar contagem**: mostrar `missingDataCount` (sem genero OU sem backdrop) no botao existente, e adicionar botao "Atualizar Todos" que roda em todos

Na pratica, a abordagem mais simples: adicionar um segundo botao **"Atualizar Todos"** que itera sobre todos os filmes/series sem filtro, atualizando genero, rating, overview e backdrop de uma vez. O botao existente continua para itens incompletos.

### Arquivos modificados
- `src/pages/admin/AdminFilmes.tsx` — adicionar `handleBatchUpdateAll` + botao + contagem de missing backdrop
- `src/pages/admin/AdminSeries.tsx` — mesma mudanca

