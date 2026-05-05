## Breakdown de CTR/Conversão por aba (tab)

Adicionar um novo card no `AdminAnalytics` mostrando o funil **por aba** (Ao Vivo, Programação, Filmes, Séries, Novidades, Sugestões, esportes específicos), respondendo "qual aba converte melhor após o share?".

### Onde

Logo abaixo do card "Tendência diária" (e antes de "Por utm_campaign"), em `src/pages/admin/AdminAnalytics.tsx`.

### Lógica nova

```ts
interface TabFunnelRow {
  tab: string;
  shares: number;
  landings: number;
  uniqueLanders: number;
  tabViews: number;
  ctr: number;        // landings ÷ shares
  conversion: number; // tab_views ÷ landings
}

function computeFunnelByTab(remote: RemoteEvent[]): TabFunnelRow[] {
  // shares     → chave: ev.props.tab_slug ?? ev.tab
  // landings   → chave: ev.props.tab_slug ?? ev.props.landing_tab ?? ev.tab
  // tab_views  → chave: ev.tab
}
```

Reaproveita o mesmo modelo de eventos já usado por `computeFunnel`, só troca a dimensão de agrupamento de `utm_campaign` para `tab`. Isso casa naturalmente porque no `analytics.ts` o `tab_slug` já é gravado em `link_share`, `landing_with_utm` e os `tab_view` rotulam a aba.

### UI do card

Tabela compacta (mesmo padrão visual do funil de campanha):

| Aba | Shares | Landings | CTR | Tab views | Conv. |
|---|---|---|---|---|---|
| programacao | 12 | 38 | 316% | 92 | 242% |
| filmes | 8 | 19 | 237% | 41 | 215% |

- Ordenado por `shares + landings` desc
- CTR e Conversão em verde primário
- Quando "Comparar" estiver ligado, mostra delta vs período B usando o mesmo componente `<Delta>` já existente
- Linha de barra horizontal sutil sob cada aba (proporção de tab_views) reaproveitando o estilo do card "Por tab_view" já presente, para leitura rápida

### Mobile

- `overflow-x-auto` na tabela
- Texto `text-xs` e `font-mono` em valores numéricos
- Touch targets não aplicáveis (read-only)

### Arquivo único

- `src/pages/admin/AdminAnalytics.tsx`
  - Adicionar `interface TabFunnelRow` e `computeFunnelByTab` perto de `computeFunnel` (após linha 253)
  - Adicionar `tabFunnelA` e `tabFunnelB` via `useMemo`
  - Renderizar novo `<Card>` "Funil por aba" entre o card "Tendência diária" e "Por utm_campaign"

Sem mudanças de schema, sem novas dependências.
