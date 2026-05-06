## Plano: Corrigir matching TheSportsDB para jogos da programação

Diagnóstico confirmado rodando `tsdb-live-update` agora: a API V2 retorna 132 eventos ao vivo (chave Premium OK), mas só 7 jogos atualizaram e **0 auto-vínculos** novos. Causa: nomes manuais usam abreviações pt/es (`Ind.`, `Dep.`, `Univ.`, `B.`, `Ac.`, `M.`) e sufixos de país (`-URU`, `-EQU`), que jamais batem com os nomes completos da TSDB (`Independiente Santa Fe`, `Deportivo Tolima`, etc.) — a similaridade fica em ~0.5, abaixo do limiar 0.80.

### Mudanças

**1. `supabase/functions/tsdb-live-update/index.ts`** e **`supabase/functions/tsdb-match-game/index.ts`** — normalização compartilhada nova:
- **Dicionário de abreviações pt/es**: `ind→independiente`, `dep→deportivo`, `univ→universidad`, `ac→academia`, `bar→barcelona`, `b→bayern`, `m→montevideo`, `atl→atletico`, `psg→paris saint germain`, `man→manchester`, `int→internacional`, `u→universitario`, etc. — aplicado token-a-token antes de remover stop-words.
- **Strip de sufixos de país/região**: regex `-(URU|EQU|ARG|BRA|RJ|SP|...|W)` removido antes de normalizar.
- **Stop-words ampliadas**: `del`, `la`, `el`, `los`, `las`.

**2. Livescore V2 filtrado por esporte** (em `tsdb-live-update`):
- Trocar `/livescore/all` (132 misturados) por `/livescore/Soccer`, `/livescore/Basketball`, etc., chamados só para os esportes presentes no dia.
- Cache por esporte, evitando refetch.

**3. Suporte a eventos únicos** (tênis/MMA/F1/ciclismo/surf/golf):
- Quando `away_team` é vazio ou esporte está em `SINGLE_EVENT_SPORTS`, casar `home_team` contra `strEvent` (nome do torneio) em vez de `strHomeTeam vs strAwayTeam`.
- Resolve casos como `Italian Open`, `UFC 312`, `MotoGP Le Mans`.

**4. Limiar 0.80 → 0.65** (seguro graças aos itens 1+2: pool menor + nomes expandidos).

**5. Logs de debug por jogo não-linkado**:
```
[live] unmatched (5):
  - "Ind. Santa Fe vs Corinthians" → top "Independiente Santa Fe vs Corinthians" (0.71)
  - "B. de Munique vs PSG" → top "Bayern Munich vs Paris Saint-Germain" (0.78)
```
Isso permite expandir o dicionário de abreviações com base em dados reais, em poucos dias.

**6. Logs de auto-link bem-sucedidos** mostrando o score final, para auditoria.

### Não faremos agora
- Fallback API-Football: a TSDB Premium cobre Libertadores/Sudamericana via livescore V2; só vamos avaliar se ainda houver gaps após esses ajustes.
- Mapa de leagueId para `eventsnextleague.php`: complexidade alta, ganho marginal — fica para uma 2ª iteração se necessário.
- Contador "(N pendentes)" no botão admin: pequena melhoria de UX, posso adicionar depois se quiser.

### Como vou validar após aplicar
1. Deploy das duas functions.
2. Disparar `tsdb-live-update` manualmente.
3. Conferir nos logs:
   - quantos eventos por esporte chegaram do livescore,
   - quantos auto-links novos,
   - quais jogos ainda ficaram não-linkados e qual foi o melhor candidato (para você ajustar o nome no banner se preciso, ou eu adiciono mais abreviações).
4. Conferir no `/admin/banners` se Botafogo×Racing, Ind. Santa Fe×Corinthians e Bayern×PSG passam a mostrar placar/minuto.

### Arquivos
- `supabase/functions/tsdb-live-update/index.ts` (reescrita da normalização + livescore por esporte + logs)
- `supabase/functions/tsdb-match-game/index.ts` (mesma normalização + suporte a evento único + fallback livescore + limiar 0.65)
