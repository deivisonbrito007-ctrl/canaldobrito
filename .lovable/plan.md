

## Problema: Jogo de meia-noite (00:00) nunca aparece como "Próximo evento"

### Causa raiz

A função `getMinutesUntilStart` compara apenas jogos do **mesmo dia** e calcula `diff = gameMinutes - nowMinutes`. Para um jogo às 00:00:

- Se é 23:00 do dia anterior: a data não bate (`gameDate !== today`), retorna `null`
- Se já é o dia do jogo: `diff = 0 - nowMinutes` = negativo, retorna `null`

Resultado: um jogo às 00:00 **nunca** pode aparecer como próximo evento.

O mesmo problema afeta `isGameCurrentlyLive` — um jogo às 00:00 no dia correto tem `nowMinutes >= 0` e `nowMinutes < duration`, o que funciona, mas só se o jogo for do dia certo.

### Solução

Refatorar `getMinutesUntilStart` e `isGameCurrentlyLive` para usar **timestamps absolutos** em vez de comparar minutos dentro do dia. Isso resolve jogos à meia-noite e também permite mostrar jogos do dia seguinte como próximos (ex: às 23:00 mostrar um jogo às 00:30 do dia seguinte).

### Alterações em `src/lib/gameUtils.ts`

1. Criar uma função auxiliar `getGameTimestamp(gameDate, gameTime)` que retorna um `Date` absoluto em São Paulo:
```ts
function getGameTimestamp(gameDate: string, gameTime: string): Date {
  const [h, m] = (gameTime || "00:00").split(":").map(Number);
  return new Date(`${gameDate}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00-03:00`);
}
```

2. Refatorar `getMinutesUntilStart`:
   - Remover a verificação de data (`gameDate !== getLocalDateString`)
   - Calcular diff em milissegundos entre `gameTimestamp` e `now`
   - Retornar minutos se positivo, `null` se negativo

3. Refatorar `isGameCurrentlyLive`:
   - Usar timestamps absolutos para determinar se `now` está entre início e início+duração

4. Refatorar `getElapsedMinutes`:
   - Mesma abordagem com timestamps absolutos

### Impacto em `NextGameHero.tsx`

A função `getMinutesUntilStart` passará a retornar minutos positivos para jogos futuros de **qualquer data**, não só hoje. O componente `NextGameHero` já filtra por `mins > 0`, então funcionará automaticamente.

Porém, como os dados do query filtram por data específica (`useDailyGames(date)`), jogos de amanhã só aparecerão se o componente que chama `NextGameHero` também buscar jogos do dia seguinte. Isso pode requerer uma pequena alteração no componente pai para buscar jogos de amanhã quando estiver perto da meia-noite.

### Verificação do `NextGameHero` pai

Preciso verificar como `NextGameHero` recebe os dados para confirmar se precisa de ajuste na query.

### Arquivos alterados
- `src/lib/gameUtils.ts` — refatorar 3 funções para usar timestamps absolutos
- Possivelmente o componente pai que alimenta `NextGameHero` — buscar jogos do dia seguinte

