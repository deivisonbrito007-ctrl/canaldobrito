## Objetivo

Padronizar todos os cards de jogos do portal (Ao Vivo + Próximo Evento) seguindo o mesmo padrão visual já aplicado na aba Programação: identidade por esporte (faixa colorida + emoji + label), badges de canal grandes com nome completo, e a seção "▶ Onde assistir".

## Problemas detectados

1. **`LivePageContent.tsx` → `LiveGameCard`**: usa um esquema de cores próprio (`SPORT_ACCENT`), badges `size="sm"`, máximo de 2 canais com `+N`, sem label "Onde assistir", e ainda exibe "VS" e "Sem TV" — inconsistente com Programação.
2. **`LivePageContent.tsx` → `UpcomingCard`**: mostra apenas 1 canal pequeno, sem label.
3. **`NextGameHero.tsx`**: mostra os canais sem o cabeçalho "▶ Onde assistir" e usa badges em tamanho default sem padronizar com o GameCard.
4. Cores por esporte vivem em dois lugares (`SPORT_ACCENT` em LivePageContent e `GameCardSportTheme.ts` em schedule) — fonte de verdade duplicada.

## Plano de implementação

### 1. Promover o tema de esporte a módulo compartilhado
- Mover `src/components/public/schedule/GameCardSportTheme.ts` para `src/components/public/shared/sportTheme.ts` (mantendo um re-export no caminho antigo para não quebrar imports).
- Garantir que `getSportTheme`, `isHighlightCompetition` e tipos sejam reutilizáveis.

### 2. Criar um card unificado `LiveGameCard` baseado no `GameCard`
- Reescrever `LiveGameCard` dentro de `LivePageContent.tsx` (ou extrair para `src/components/public/LiveGameCard.tsx`) reaproveitando o layout do `schedule/GameCard`:
  - Faixa superior com gradiente do esporte + emoji + label do esporte + competição.
  - Watermark grande do emoji no canto inferior direito (opacity 0.05).
  - Pill "Ao vivo" (com `elapsed`) substituindo o badge atual.
  - Times com `TimePill` no centro (mantendo "vs" pequeno como na Programação) ou layout single-event para esportes não adversariais.
  - Bloco "▶ Onde assistir" com `ChannelBadge` em tamanho default (nomes completos), exibindo até 3 canais + `+N` quando exceder.
  - Remover as abreviações antigas e o badge "Sem TV" → usar o mesmo "Sem transmissão confirmada" do GameCard.

### 3. Atualizar `UpcomingCard` (Começam em breve)
- Manter o formato compacto (lista vertical), mas:
  - Trocar o canal único pequeno por uma linha "▶ Onde assistir" com até 2 `ChannelBadge` em `size="sm"` e `+N` quando exceder.
  - Garantir nome completo (sem `short`).
  - Adicionar borda lateral colorida com a cor do esporte (`theme.color`) para reforçar a identidade.

### 4. Corrigir `NextGameHero`
- Acima da lista de canais, adicionar o cabeçalho:
  ```tsx
  <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/55">
    ▶ Onde assistir
  </span>
  ```
- Aumentar o limite de 4 → mostrar até 3 canais + `+N`, mantendo `ChannelBadge` no tamanho default (nomes completos).
- Quando não houver canais, manter a pill "Sem transmissão confirmada" com o mesmo estilo do GameCard.
- Aplicar a faixa de cor do esporte no topo (substituir o gradiente fixo `from-primary` pela cor do `getSportTheme(sportType)`) para coerência visual com os outros cards.

### 5. Testes
- Atualizar `src/components/public/__tests__/` (e criar `LiveGameCard.test.tsx` se extraído) cobrindo:
  - Renderização do label "Onde assistir" no hero e no card ao vivo.
  - Exibição de nomes completos de canais.
  - Layout single-event vs adversarial.
- Rodar `bunx vitest run` e garantir que toda a suíte continua passando.

## Sugestões adicionais (opcionais — peço aprovação antes de aplicar)

1. **Compartilhar `SportIdentityStrip` como subcomponente** reutilizável para qualquer futuro card (ex.: detalhes de jogo, busca).
2. **Pulse "começou agora"** (item 5 da lista anterior): jogos que entraram em live nos últimos 5 minutos ganham um glow verde extra no card Ao Vivo.
3. **Resumo dos canais no header da seção "Acontecendo agora"** mostrando os 3 canais com mais jogos no momento (chip clicável que filtra).
4. **Empty state contextual por filtro**: ao filtrar "Basquete" e não ter jogos, sugerir o próximo basquete via `NextGameHero` reduzido.

## Arquivos afetados

- `src/components/public/LivePageContent.tsx` (reescrita do `LiveGameCard` e `UpcomingCard`)
- `src/components/public/NextGameHero.tsx` (label "Onde assistir" + tema do esporte)
- `src/components/public/schedule/GameCardSportTheme.ts` → `src/components/public/shared/sportTheme.ts` (mover + re-export)
- `src/components/public/schedule/GameCard.tsx` (atualizar import)
- Novos/atualizados testes em `src/components/public/__tests__/`
