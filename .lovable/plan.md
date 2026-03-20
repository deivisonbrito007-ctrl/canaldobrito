

# Categorização por Esporte com Duração Exata

## Objetivo

Adicionar `sport_type` aos jogos para exibir o tempo exato de cada esporte na seção "Ao Vivo" — sem margem extra. O jogo sai do "Ao Vivo" exatamente quando o tempo regulamentar termina.

## Durações exatas (sem acréscimo)

| Tipo | Emoji | Duração exata | Justificativa |
|------|-------|---------------|---------------|
| football | ⚽ | 90 min | 2 tempos de 45min |
| basketball | 🏀 | 48 min | 4 quartos de 12min (NBA) |
| tennis | 🎾 | 180 min | Média de 3 sets |
| f1 | 🏎️ | 120 min | Corrida padrão ~2h |
| mma | 🥊 | 25 min | 5 rounds de 5min (card principal) |
| volleyball | 🏐 | 90 min | Média de 5 sets |

> **Nota:** Como não há paradas de relógio nem acréscimos no cálculo, o jogo desaparece do "Ao Vivo" no momento exato que o tempo regulamentar se esgota. Se quiser ajustar qualquer duração depois, basta mudar um número no mapa.

## Alterações

### 1. Migration — coluna `sport_type`
```sql
ALTER TABLE daily_games ADD COLUMN sport_type text NOT NULL DEFAULT 'football';
```

### 2. `src/lib/gameUtils.ts`
- Criar mapa `SPORT_DURATION` com as durações exatas acima
- `isGameCurrentlyLive(gameTime, gameDate, sportType)` — usa duração do mapa
- `getElapsedMinutes(gameTime, gameDate, sportType)` — idem
- Exportar mapa `SPORT_EMOJI` para uso nos componentes

### 3. `src/components/admin/ProgramacaoTexto.tsx`
- Adicionar função `detectSportType(competition)` com palavras-chave:
  - basketball: NBA, NBB, EuroLeague, WNBA
  - tennis: ATP, WTA, Roland Garros, Wimbledon, US Open, Australian Open
  - f1: Fórmula 1, F1, Grande Prêmio, GP
  - mma: UFC, Bellator, PFL
  - volleyball: Superliga, Liga das Nações Vôlei
  - football: default/fallback
- Incluir `sport_type` no objeto de jogo parseado e enviado ao banco

### 4. `src/hooks/useDailyGames.ts`
- Adicionar `sport_type: string` ao tipo `DailyGame`

### 5. `src/components/public/LiveNowSection.tsx`
- Passar `game.sport_type` para `isGameCurrentlyLive` e `getElapsedMinutes`
- Exibir emoji do esporte ao lado da competição
- Usar separador adequado (F1 não tem "VS")

### 6. `src/components/public/DailyGamesSection.tsx`
- Exibir emoji do esporte no card
- Adicionar filtro por esporte (pills) — só mostra esportes com jogos no dia

### 7. `supabase/functions/read-schedule-image/index.ts`
- Atualizar prompt para identificar tipo de esporte e incluir emoji correspondente

### 8. Atualizar testes em `src/lib/gameUtils.test.ts`
- Adicionar testes para durações por esporte

## Arquivos modificados
- `supabase/migrations/` — nova migration
- `src/lib/gameUtils.ts`
- `src/lib/gameUtils.test.ts`
- `src/components/admin/ProgramacaoTexto.tsx`
- `src/hooks/useDailyGames.ts`
- `src/components/public/LiveNowSection.tsx`
- `src/components/public/DailyGamesSection.tsx`
- `supabase/functions/read-schedule-image/index.ts`

