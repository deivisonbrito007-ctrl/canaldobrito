

## Melhorar Dashboard Admin com Graficos de Conteudo Ativo

### O que sera adicionado

Um novo componente `ContentCharts` com dois graficos usando Recharts (ja disponivel via `chart.tsx`):

1. **Grafico de barras** — Conteudo ativo vs inativo por categoria (Banners, Filmes, Series, Novidades, Jogos), com barras empilhadas verde/cinza
2. **Grafico de rosca (donut)** — Distribuicao percentual do conteudo ativo entre categorias, usando as cores ja definidas nos `statCards`

### Alteracoes

**1. Novo componente `src/components/admin/ContentCharts.tsx`**

- Recebe `totals` e `actives` como props (os mesmos Records ja calculados no dashboard)
- Recebe `isLoading` para mostrar skeleton enquanto carrega
- Grafico de barras horizontal empilhado: barra verde = ativos, barra cinza = inativos
- Grafico de rosca: fatias coloridas por categoria (emerald, blue, purple, amber, red)
- Usa `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` do `chart.tsx`
- Layout: lado a lado em desktop (`grid-cols-2`), empilhado em mobile (`grid-cols-1`)
- Estilo glass-panel consistente com o resto do dashboard

**2. Editar `src/pages/admin/AdminDashboard.tsx`**

- Importar `ContentCharts`
- Inserir entre o grid de stats e `UpcomingActivations`
- Passar `totals`, `actives`, `isLoading` como props

### Arquivos modificados
- `src/components/admin/ContentCharts.tsx` — novo
- `src/pages/admin/AdminDashboard.tsx` — importar e posicionar o componente

