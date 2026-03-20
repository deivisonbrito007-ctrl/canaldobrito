

# Ajuste do Card de Tênis (Esportes sem Adversário)

## Problema

O card de "ATP e WTA" mostra o layout "Time A **VS** Time B" com o lado direito vazio, porque o tênis não está na lista de esportes não-adversariais (`NON_ADVERSARIAL`). Mesmo com `away_team` vazio após a correção no banco, o card ainda renderiza o "VS" e espaço vazio.

## Correção

### 1. Usar layout de evento quando `away_team` está vazio
- **`DailyGamesSection.tsx`** (linha ~212): Mudar a condição de `isNonAdversarial(sportType)` para `isNonAdversarial(sportType) || !game.away_team` — assim qualquer jogo sem adversário usa o layout centralizado, independente do esporte.

### 2. Adicionar tênis à lista de esportes não-adversariais (opcional/recomendado)
- **`gameUtils.ts`**: Adicionar `'tennis'` ao array `NON_ADVERSARIAL`, pois torneios de tênis (ATP, WTA) são eventos, não confrontos diretos no contexto de grade de programação TV.

### Sugestão: Mostrar `competition_detail` mais proeminente no layout de evento
- No layout de evento (sem adversário), exibir o `competition_detail` (ex: "Indian Wells") como subtítulo abaixo do nome do evento, com fonte levemente maior que os 10px atuais, para dar mais contexto.

## Arquivos
- `src/components/public/DailyGamesSection.tsx` — condição do layout
- `src/lib/gameUtils.ts` — adicionar tennis ao NON_ADVERSARIAL

