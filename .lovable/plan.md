

## Plano: Melhorias pendentes + análise do jogo Iraque x Bolívia

### Situação do jogo Iraque x Bolívia

O jogo **Iraque x Bolívia** está cadastrado com `date: 2026-03-31` e `game_time: 00:00`. Como agora é **01/04 ~00:19 (São Paulo)**, o jogo terminou há mais de 22 horas e **não deve aparecer como ao vivo** — isso é o comportamento correto.

Se o problema foi que **ontem à meia-noite** ele não apareceu como ao vivo, isso já foi corrigido pelo fix de **timestamps absolutos** aplicado nesta sessão. O `LiveNowHero` busca jogos do dia atual via `useAllDailyGames(today)` e usa `isGameCurrentlyLive` com timestamps absolutos, então jogos às 00:00 agora são detectados corretamente.

**Nenhuma alteração de código necessária** para este ponto.

### Melhorias pendentes do plano anterior

Há duas melhorias identificadas anteriormente que ainda não foram implementadas:

#### 1. Atualizar parser com emojis dos novos esportes

**Arquivo**: `src/components/admin/ProgramacaoTexto.tsx`

- Adicionar ao `detectSportFromEmoji`:
  - `🏉` → rugby
  - `🏄` → surf
  - `🚴` → cycling
  - `⛳` → golf
  - `🏊` → swimming
  - Separar `🥊` para distinguir boxing de MMA (usar `detectSportType` como fallback)