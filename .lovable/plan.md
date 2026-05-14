## Objetivo

1. Mostrar o **minuto decorrido** dos jogos AO VIVO na página pública `/agenda` (igual ao app: `45'`, `78'`, etc.).
2. Fazer o carrossel **"Em Breve" ficar fixo** independente do filtro selecionado (igual ao card AO VIVO, que já é persistente).
3. Pequenas melhorias de coerência visual.

---

## Mudanças

### 1. `LiveHeroCard.tsx` — minuto ao vivo
- Importar `getLiveMinute` de `@/lib/gameUtils`.
- Calcular `elapsed = getLiveMinute(game.game_time, game.date, sport)` no slide ativo.
- No badge "AO VIVO" passar a exibir `AO VIVO · 45'` quando `elapsed !== null`.
- Tick de 30s já existe na página; o componente re-renderiza naturalmente (o `tick` do pai já força refresh).

### 2. `GamePremiumCard.tsx` — minuto nos cards das listas por esporte
- Já calcula `live` via `isGameCurrentlyLive`. Adicionar `getLiveMinute` para mostrar `45'` no rótulo embaixo do horário, em vez de só "AO VIVO".
- Formato proposto:
  - Ao vivo → linha com `AO VIVO` + chip vermelho `45'` (tabular-nums) abaixo do horário.
  - Demais estados (Em breve / Encerrado / countdown) ficam como estão.

### 3. `HighlightsCarousel` ("Em Breve") — sempre visível
- Em `AgendaPublica.tsx`, remover a condição `filter === "all"` para renderizar o carrossel.
- Mostrar o "Em Breve" sempre que houver `highlights.length > 0`, em qualquer filtro (inclusive `live` e por esporte).
- Quando o filtro for por esporte, **filtrar os highlights** pelo esporte ativo para manter coerência (ex.: filtro "Futebol" → carrossel só com próximos de futebol). Se filtro `live` ou `all` → mostra todos os highlights.
- Ajustar o subtítulo do carrossel: trocar "· próximos N" por "· nas próximas horas" para soar mais natural a leigos.

### 4. Sugestões extras (pequenas, mesma PR)
- **Reordenar seções**: AO VIVO → CTA Assine → **Em Breve** (logo abaixo do AO VIVO, antes dos filtros) para o usuário ver o que vem agora antes de filtrar. Mantém visibilidade mesmo quando ele troca filtro depois.
- **Tick mais rápido**: reduzir o `setInterval` de 30s → 20s no `AgendaPublica` para o minuto ao vivo atualizar de forma mais responsiva (ainda barato).
- **Acessibilidade**: `aria-label` dinâmico no badge AO VIVO incluindo o minuto (`aria-label={elapsed ? \`Ao vivo, ${elapsed} minutos\` : "Ao vivo"}`).

---

## Arquivos a alterar

- `src/components/agenda/public/LiveHeroCard.tsx`
- `src/components/agenda/public/GamePremiumCard.tsx`
- `src/components/agenda/public/HighlightsCarousel.tsx` (subtítulo)
- `src/pages/AgendaPublica.tsx` (ordem das seções, condição do carrossel, filtro por esporte nos highlights, tick 20s)

Sem mudanças em backend, schema ou lógica de negócio.
