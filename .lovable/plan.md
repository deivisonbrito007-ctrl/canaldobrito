# Plano: Restaurar carrossel destacado de Novidades no topo

Trazer de volta o **NovidadesCard** original (carrossel grande com auto-rotate, badges e trailer) para o topo da aba "Filmes e Séries", substituindo o `FeaturedCarousel` minimalista atual.

## 1. NovidadesPage.tsx

### Imports
- Remover `FeaturedCarousel`.
- Adicionar `import { NovidadesCard } from "@/components/public/NovidadesCard"`.

### Curadoria do hero
O `NovidadesCard` já consome `useActiveNewsReleases` internamente — passa a renderizar **todos os news_releases ativos** com auto-rotação. Como ele é o destaque oficial, **manter no topo sem deduplicação manual** (o `NovidadesCard` lida com sua própria curadoria via `display_order` e `badge_type`).

### Filtro adicional
- Adicionar filtro **"🎞️ Novas Temporadas"** (`nova_temporada`) ao array `FILTERS` e ao `stats`. Já existe `getBadgeLabel("nova_temporada")` no NovidadesCard.

### Estrutura final da página

```text
[Hero header + filtros]
       │
[NovidadesCard]   ← carrossel destacado original (auto-rotate)
       │
[Destaques da Semana]   ← WeeklyMovies + WeeklySeries (filter=all)
       │
[Explorar todos]   ← Grid/Lista com TODOS os news_releases filtrados
```

### Dedup
Como o NovidadesCard já mostra todos os items, manter o grid **sem dedup** quando `filter === "all"` para o usuário ainda conseguir explorar e filtrar a lista completa abaixo. Renomear cabeçalho para **"Catálogo"** (em vez de "Explorar") deixando claro que é a lista navegável completa.

### Quando o filtro está ativo
- Esconder o `NovidadesCard` (ele não aceita filtros) e mostrar apenas o grid filtrado + título do filtro.
- Esconder seções da Semana (mantém comportamento atual).

## 2. Limpeza

- Componente `src/components/public/novidades/FeaturedCarousel.tsx` fica órfão. Manter o arquivo (não deletar) caso o usuário queira voltar à versão minimalista no futuro.

## Arquivos tocados
- `src/components/public/NovidadesPage.tsx` (editar)
