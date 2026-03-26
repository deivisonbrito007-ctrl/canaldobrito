

## Problema: Jogos classificados com esporte errado

### Jogos encontrados com classificação errada no banco

| Jogo | competition | sport_type atual | Correto |
|------|------------|-----------------|---------|
| Los Angeles Dodgers x Arizona Diamondbacks | 21:30 \| ESPN 4 | football | **baseball** |
| ATP Tour (x2) | 14:00 \| ESPN 2, 20:00 \| ESPN 2 | football | **tennis** |

### Causa raiz

`detectSportType()` recebe **apenas o campo `competition`**, que frequentemente contém horário/canal (ex: `"21:30 | ESPN 4"`) em vez do nome do torneio. Os nomes dos times (Dodgers, Diamondbacks) e competição real (ATP Tour — que fica no `home_team`) nunca são analisados.

### Solução

#### 1. Expandir `detectSportType` para aceitar nomes dos times

**`src/lib/gameUtils.ts`** — adicionar parâmetro opcional `teamNames`:

```ts
export function detectSportType(competition: string, teamNames?: string): SportType {
  const c = `${competition} ${teamNames || ''}`.toLowerCase();
  // ... mesmas regras regex existentes
}
```

#### 2. Passar nomes dos times em todos os call sites

- **`src/components/admin/ProgramacaoTexto.tsx`** (3 ocorrências):
  - `detectSportType(g.competition)` → `detectSportType(g.competition, \`${g.home_team} ${g.away_team}\`)`

- **`src/components/admin/DailyGamesManager.tsx`** (1 ocorrência no AddGameForm):
  - `detectSportType(comp)` → `detectSportType(comp, \`${home} ${away}\`)`

#### 3. Corrigir jogos existentes no banco

Executar UPDATE para os 3 registros identificados:
- Dodgers vs Diamondbacks → `baseball`
- ATP Tour (2 registros) → `tennis`

#### 4. Atualizar testes

**`src/lib/gameUtils.test.ts`** — adicionar testes para detecção via nomes de times:

```ts
it("detects baseball from team names when competition is generic", () => {
  expect(detectSportType("21:30 | ESPN 4", "Los Angeles Dodgers Arizona Diamondbacks")).toBe("baseball");
});

it("detects tennis from team names when competition is generic", () => {
  expect(detectSportType("14:00 | ESPN 2", "ATP Tour")).toBe("tennis");
});
```

### Arquivos alterados
- `src/lib/gameUtils.ts` — parâmetro `teamNames`
- `src/components/admin/ProgramacaoTexto.tsx` — 3 call sites
- `src/components/admin/DailyGamesManager.tsx` — 1 call site
- `src/lib/gameUtils.test.ts` — novos testes
- Banco: UPDATE de 3 registros

