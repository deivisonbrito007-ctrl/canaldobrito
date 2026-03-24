

# Auditoria da Aba Banners + Programacao no Admin

## Estado Atual

Codigo auditado: `AdminBanners.tsx`, `ProgramacaoTexto.tsx`, `DailyGamesManager.tsx`, hooks e testes. Console sem erros. Fluxo funcional no geral.

## Bugs Encontrados

### 1. `useAllDailyGames` sem `refetchInterval` (BUG)
O hook `useAllDailyGames` (usado pelo `DailyGamesManager`) nao tem `refetchInterval`, ao contrario do `useAllBanners` e `useDailyGames`. Jogos ativados pelo cron nao aparecem atualizados ate refresh manual.

**Correcao**: Adicionar `refetchInterval: 60_000` ao `useAllDailyGames`.

### 2. `DailyGamesManager` sem countdown ao vivo
O componente usa `formatCountdown` para jogos agendados mas nao tem `setInterval` para forcar re-render. O texto de countdown fica congelado.

**Correcao**: Adicionar o mesmo padrao de tick usado em `AdminBanners` e `UpcomingActivations`.

### 3. Teste do parser duplicado e desatualizado
`ProgramacaoTexto.test.tsx` reimplementa o parser inteiro em vez de importar do componente. A copia nao suporta Format B (esportes individuais sem " x "). Qualquer mudanca no parser real nao reflete nos testes.

**Correcao**: Exportar `parseScheduleText` do `ProgramacaoTexto.tsx` e importar no teste, removendo a copia. Adicionar teste para Format B (ex: "ATP e WTA" sem " x ").

### 4. `AddGameForm` nao define `sport_type` nem `status_short`
Ao adicionar jogo avulso, o payload nao inclui `sport_type` nem `status_short`, dependendo dos defaults do banco. Funciona por causa dos defaults SQL, mas e fragil.

**Correcao**: Adicionar `sport_type: detectSportType(comp)` e `status_short: "NS"` ao payload do `AddGameForm`.

## Melhorias Propostas

### 5. Contagem de jogos por esporte no `DailyGamesManager`
Mostrar mini-badges com contagem por esporte (ex: "⚽ 5 🏀 3 🎾 2") no header, dando visao rapida da composicao do dia.

### 6. Filtro por esporte no `DailyGamesManager`
Adicionar pills de filtro por `sport_type` para facilitar a gestao quando ha muitos jogos (como os 18 jogos do dia atual).

## Testes
- Rodar suite completa
- Adicionar teste para Format B no parser
- Adicionar teste para `DailyGamesManager` renderizacao basica

## Arquivos modificados
- `src/hooks/useDailyGames.ts` — adicionar `refetchInterval` ao `useAllDailyGames`
- `src/components/admin/DailyGamesManager.tsx` — countdown ao vivo, sport badges no header, filtro por esporte
- `src/components/admin/ProgramacaoTexto.tsx` — exportar `parseScheduleText`
- `src/components/admin/__tests__/ProgramacaoTexto.test.tsx` — importar parser real, adicionar teste Format B

