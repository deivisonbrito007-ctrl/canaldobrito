## Objetivo
Adicionar uma faixa de jogos ao vivo no topo da página pública `/agenda`, sem alterar a lista agrupada por esporte (que continua sendo o conteúdo principal pra print/share).

## Onde
Arquivo: `src/pages/AgendaPublica.tsx`

Posição: logo abaixo do header (título + navegação de data) e **acima** das chips de esporte e da lista agrupada.

## Quando aparece
Só renderiza se **todas** as condições forem verdadeiras:
1. A data visualizada (`?date=`) é **hoje** em America/Sao_Paulo
2. Existe ao menos 1 jogo com `isGameCurrentlyLive(game) === true`

Nos demais casos (data passada/futura, ou hoje sem lives) o componente não ocupa espaço algum.

## Layout da faixa

```text
┌─────────────────────────────────────────┐
│ 🔴 AO VIVO AGORA · 3                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Flamengo │ │ Lakers   │ │ GP Mônaco│ →
│ │   VS     │ │   VS     │ │  Volta   │
│ │ Palmeiras│ │ Celtics  │ │  42/78   │
│ │ ⏱ 67'    │ │ ⏱ Q3 8:21│ │ 🏎       │
│ │ 📺 SporTV│ │ 📺 ESPN  │ │ 📺 BAND  │
│ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────┘
```

- **Header da faixa:** ponto vermelho pulsante + "AO VIVO AGORA" (Bebas Neue) + contador `· N`
- **Cards:** ~70% da largura visível (≈2.2 cards aparecem por vez no mobile), `scroll-snap-x mandatory`, sem botões de seta — só swipe horizontal natural
- **Conteúdo do card:** time/evento, ícone do esporte, "minuto/round" calculado em tempo real, badge do canal
- **Borda:** `border-destructive/40` com leve glow vermelho pra destacar do resto da página
- **Tap no card:** rola suave até o jogo correspondente na lista agrupada abaixo (usa `id={\`game-${id}\`}`)

## Comportamento
- Re-renderiza a cada 30s pra atualizar o minuto e remover jogos que terminaram (igual à lógica de `isGameCurrentlyLive` existente)
- `prefers-reduced-motion`: remove o pulsar do ponto vermelho
- Acessibilidade: `aria-label="Jogos ao vivo agora"`, cards com `role="button"`

## Observações
- A regra global do projeto é "evitar swipe horizontal pra navegação entre seções"; aqui o swipe é **dentro de uma faixa isolada de conteúdo**, padrão aceito (igual aos carrosséis de Novidades/Sugestões já existentes na home).
- Zero alteração na lista agrupada por esporte abaixo — o print/share continua idêntico.
- Sem mudanças de schema ou backend.

## Detalhes técnicos
- Novo componente: `src/components/agenda/LiveNowStrip.tsx` (props: `games`, `onJumpTo(id)`)
- Em `AgendaPublica.tsx`: filtrar `liveGames = games.filter(isGameCurrentlyLive)` e renderizar `<LiveNowStrip>` condicionalmente quando `isToday && liveGames.length > 0`
- Reaproveitar `detectSportType`, `isGameCurrentlyLive`, `formatLiveMinute` (se existir; senão derivar de `start_time`)
- IDs nas linhas da lista existente pra ancorar o scroll
