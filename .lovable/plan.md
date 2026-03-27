

## Problema: Todos os jogos são classificados como futebol

### Causa raiz

Em `collectMetadata` (linha 181), `detectSportFromEmoji` retorna `'football'` para `🏆` — que é o emoji usado em **todos** os jogos do texto. Resultado: NBA, vôlei, tênis → tudo vira futebol.

A função `detectSportType(competition, teamNames)` que sabe identificar NBA, ATP, Superliga etc. **nunca é chamada** durante o parsing.

### Solução

Após coletar os metadados e montar o jogo, usar `detectSportType` como fallback inteligente:

**`src/components/admin/ProgramacaoTexto.tsx`** — na montagem do jogo (linha ~317-326):

```
// Determine sport: use detectSportType with all available info
const autoSport = detectSportType(
  meta.competition, 
  `${home_team} ${away_team}`
);

// Only trust emoji-based detection if it's NOT generic football
// (since 🏆 always returns football which is unhelpful)
const finalSport = (meta.sport_type && meta.sport_type !== 'football') 
  ? meta.sport_type 
  : autoSport;

games.push(cleanupGame({
  ...
  sport_type: finalSport,
}));
```

Mesma lógica no bloco do formato antigo (linha ~301-315).

### Resultado esperado

| Jogo | competition | Detecção |
|------|-----------|----------|
| Clippers x Pacers | NBA | `basketball` ✅ |
| Vôlei Renata x Cruzeiro | Superliga Masculina | `volleyball` ✅ |
| LA Open / Miami Open | ATP Challenger / ATP-WTA 1000 | `tennis` ✅ |
| China x Curaçao | FIFA Series 2026 | `football` ✅ |

### Arquivos alterados
- `src/components/admin/ProgramacaoTexto.tsx` — lógica de sport_type no `parseScheduleText`

### Extras
- Adicionar "Superliga" ao regex de volleyball em `detectSportType` no `gameUtils.ts` (já existe parcialmente, validar)
- Adicionar "FIFA" ao regex de football para reforçar

