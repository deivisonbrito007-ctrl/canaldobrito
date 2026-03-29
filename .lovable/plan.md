

## Problema: Categorias dos eventos erradas

### Causa raiz

O parser **descarta** os cabeçalhos de seção como "BASQUETE", "TÊNIS", "VÔLEI", "NBA" sem extrair informação de esporte deles. Quando os jogos abaixo usam `🏆` (genérico) na competição, o `detectSportType` pode não ter dados suficientes para classificar corretamente — por exemplo, jogos de NBA com competição "NBA" já funcionam, mas jogos de tênis com competição "ATP Challenger" dentro de uma seção "TÊNIS" dependem apenas do regex.

A solução é **rastrear o cabeçalho de seção atual** como contexto de esporte e usá-lo como fallback adicional.

### Correções

#### 1. Capturar sport do cabeçalho de seção (`ProgramacaoTexto.tsx`)

No `parseScheduleText`, quando um `isSectionHeader` é detectado, extrair o esporte do texto do cabeçalho e armazená-lo em uma variável `currentSectionSport`:

```
let currentSectionSport: SportType | null = null;

// Dentro do loop, quando isSectionHeader:
if (isSectionHeader(line, nextLine)) {
  currentSectionSport = detectSportType(line, "");
  i++;
  continue;
}
```

Assim, "BASQUETE" → `basketball`, "TÊNIS" → `tennis`, "VÔLEI" → `volleyball`, "FUTEBOL" → `football`, etc.

#### 2. Usar `currentSectionSport` como fallback final

Na montagem do jogo, a prioridade ficaria:

```
1. Emoji específico (🎾, 🏀, etc.) — se NÃO for 🏆/football
2. detectSportType(competition, teamNames)
3. currentSectionSport (do cabeçalho da seção)
4. 'football' (default)
```

Código:
```ts
const autoSport = detectSportType(meta.competition || "", `${home_team} ${away_team}`);
const finalSport = 
  (meta.sport_type && meta.sport_type !== 'football') ? meta.sport_type
  : (autoSport !== 'football') ? autoSport
  : currentSectionSport || 'football';
```

#### 3. Adicionar keywords em `detectSportType` (`gameUtils.ts`)

Reforçar com termos comuns em pt-BR:
- Basquete: adicionar `basquete` (sem acento) — já existe
- Tênis: adicionar `challenger`, `open` (com cuidado para não pegar "Copa Open")  
- Vôlei: adicionar `v[oô]lei` — já existe

Verificar: adicionar `\bopen\b` ao regex de tênis quando combinado com "atp" ou "wta" (já coberto pelo regex existente).

### Resultado esperado

| Cabeçalho de seção | Jogo | Detecção |
|---|---|---|
| BASQUETE | Clippers x Pacers, NBA | `basketball` ✅ |
| VÔLEI | Vôlei Renata x Cruzeiro, Superliga | `volleyball` ✅ |
| TÊNIS | LA Open, ATP Challenger | `tennis` ✅ |
| FUTEBOL | China x Curaçao, FIFA Series | `football` ✅ |

### Arquivos alterados
- `src/components/admin/ProgramacaoTexto.tsx` — rastrear `currentSectionSport` e usar como fallback
- `src/lib/gameUtils.ts` — (se necessário) adicionar keywords extras ao `detectSportType`

