

## Adicionar novos esportes: Rugby, Surf, Ciclismo, Boxe, Natação, Golf

### Escopo

Expandir o sistema de detecção para suportar **6 novos esportes**: rugby, surf, ciclismo, boxe, natação e golf. O campo `sport_type` no banco já é `string`, então **não precisa de migração**.

### Alterações em `src/lib/gameUtils.ts`

**1. Expandir o tipo `SportType`:**
```ts
export type SportType = 'football' | 'basketball' | 'tennis' | 'f1' | 'mma' 
  | 'volleyball' | 'hockey' | 'baseball' | 'rugby' | 'surf' | 'cycling' 
  | 'boxing' | 'swimming' | 'golf';
```

**2. Adicionar durações:**
| Esporte | Duração | Justificativa |
|---------|---------|---------------|
| rugby | 100min | 80 + intervalo |
| surf | 240min | etapas longas |
| cycling | 300min | etapas de Tour ~5h |
| boxing | 90min | card completo |
| swimming | 180min | sessão de provas |
| golf | 300min | rodada completa |

**3. Adicionar emojis e labels:**
| Sport | Emoji | Label |
|-------|-------|-------|
| rugby | 🏉 | Rugby |
| surf | 🏄 | Surf |
| cycling | 🚴 | Ciclismo |
| boxing | 🥊 | Boxe |
| swimming | 🏊 | Natação |
| golf | ⛳ | Golf |

**4. Adicionar ao `NON_ADVERSARIAL`:** surf, cycling, swimming, golf

**5. Adicionar regexes em `detectSportType`:**
- **rugby**: `\b(rugby|sevens|svns|world rugby|super rugby)\b`
- **surf**: `\b(wsl|surf|pipeline|tahiti pro)\b`
- **cycling**: `\b(tour de france|giro|vuelta|ciclismo|cycling|paris.roubaix|uci)\b`
- **boxing**: `\b(box[e]?|wbc|wba|wbo|ibf)\b` (separar de MMA que já usa 🥊)
- **swimming**: `\b(nata[çc][aã]o|swimming|fina|world aquatics)\b`
- **golf**: `\b(golf|golfe|pga|masters|ryder cup|the open)\b`

**Nota sobre boxe vs MMA:** Boxe usará 🥊 mas será tipo `boxing` separado de `mma`. O regex de MMA já cobre `ufc|bellator|pfl|mma`, e boxe cobrirá `box[e]?|wbc|wba|wbo|ibf`.

### Alterações em `src/lib/gameUtils.test.ts`

Adicionar testes para cada novo esporte na seção `detectSportType`.

### Arquivos alterados
- `src/lib/gameUtils.ts` — tipo, durações, emojis, labels, regexes
- `src/lib/gameUtils.test.ts` — novos testes de detecção

