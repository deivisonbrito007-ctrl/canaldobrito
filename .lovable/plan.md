## Gráfico diário de CTR e Conversão

Adicionar um gráfico de linha (recharts, já instalado) no `AdminAnalytics` mostrando **CTR** e **Conversão** por dia para a janela do Período A — e, quando "Comparar" estiver ligado, sobrepor as séries do Período B em cinza para identificar visualmente picos e quedas após cada campanha.

### O que entra na tela

Logo abaixo do card **Funil WhatsApp** (entre as linhas 371-373 do arquivo atual), um novo card "Tendência diária":

- **Eixo X**: dias do período (formato `dd/MM`)
- **Eixo Y esquerdo**: percentuais 0–100% (CTR e Conversão)
- **Linhas**:
  - `CTR (A)` — cor primária (`hsl(var(--primary))`), traço sólido
  - `Conversão (A)` — cor accent secundária, traço sólido
  - `CTR (B)` e `Conversão (B)` — cinza tracejado (só quando comparação ligada)
- **Tooltip**: mostra dia, CTR%, Conversão% e os números brutos (shares, landings, tab_views) daquele dia
- **Filtro de campanha**: dropdown opcional "Todas as campanhas" / cada `utm_campaign` específica, para isolar um único funil
- **ReferenceLine** vertical pontilhada nos dias em que houve `link_share` (mostra "quando você divulgou"), facilitando ver picos pós-campanha

```text
CTR/Conv % │
        100│
         75│  ╱╲ CTR
         50│ ╱  ╲___╱╲
         25│╱       ╲╱ Conv
          0└────────────────── dia
            12  13  14  15  16
                 ↑      ↑
                share  share
```

### Lógica nova (mesmo arquivo)

```ts
type DailyPoint = {
  day: string;       // 'YYYY-MM-DD'
  label: string;     // 'dd/MM'
  shares: number;
  landings: number;
  uniqueLanders: number;
  tabViews: number;
  ctr: number | null;        // null quando shares=0 (gap na linha)
  conversion: number | null; // null quando landings=0
};

function computeDaily(
  remote: RemoteEvent[],
  from: Date,
  to: Date,
  campaign?: string | null,
): DailyPoint[] { /* agrupa por YYYY-MM-DD em America/Sao_Paulo, mesma regra do computeFunnel */ }
```

- Reaproveita a mesma classificação de eventos do `computeFunnel` (link_share → shares; landing_with_utm → landings/uniqueLanders; tab_view com utm_campaign → tabViews).
- Usa `null` em dias sem denominador para o recharts criar lacuna em vez de cair a 0% (evita falsos vales).
- Datas alinhadas ao timezone `America/Sao_Paulo` (regra core do projeto).

### Marcadores de campanha

Para cada dia que teve ≥1 `link_share`, renderiza uma `ReferenceLine` vertical com label discreto (ícone `Send` em opacidade baixa). Isso responde diretamente "o que aconteceu depois que eu mandei o link?".

### Filtro de campanha

Select simples (componente `<select>` nativo estilizado, mantendo padrão minimalista do painel) acima do gráfico:
- "Todas as campanhas" (default) — soma global
- Lista de campanhas presentes em `funnelA` (ordenadas por shares+landings)

Quando uma campanha é selecionada, `computeDaily` é chamado filtrando `ev.utm_campaign === campaign` (e shares só para `share-<slug>` correspondente).

### Mobile-first

- Altura fixa do gráfico: `h-56` (~224px), confortável em telas 320–430px
- Touch targets ≥44px no select e nos atalhos do tooltip
- Sem animação pesada (respeita `prefers-reduced-motion`: passar `isAnimationActive={false}` quando aplicável)

### Arquivo único alterado

- `src/pages/admin/AdminAnalytics.tsx`
  - Adicionar import do `recharts` (`ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine`) e ícone `TrendingUp`
  - Adicionar `computeDaily` perto do `computeFunnel`
  - Adicionar estado `selectedCampaign`
  - Renderizar novo `<Card>` "Tendência diária" entre o card de Funil e o card "Por utm_campaign"

Sem mudanças de schema, sem novas dependências, sem alterações em `analytics.ts`.
