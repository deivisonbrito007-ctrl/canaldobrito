

## Adicionar Contagem de Jogos Agendados no Card de Jogos

### O que sera feito

No card "Jogos Hoje" do dashboard, adicionar uma linha extra mostrando quantos jogos estao agendados (`publish_at` no futuro e `active = false`). Ex: "2 agendados" abaixo de "X ativos".

### Alteracoes

**1. `src/pages/admin/AdminDashboard.tsx`**

- Calcular `scheduledGames` a partir de `todayGames` filtrando por `publish_at` futuro e `active === false`
- Criar um dict `scheduled` similar a `actives`, com valor apenas para `jogos`
- No render do stat card, quando `card.key === "jogos"` e `scheduled > 0`, renderizar uma linha extra `<p className="text-[9px] text-amber-400/70">N agendado(s)</p>` entre "X ativos" e a barra de progresso

Nenhum arquivo novo. Apenas uma adição pontual no `AdminDashboard.tsx`.

