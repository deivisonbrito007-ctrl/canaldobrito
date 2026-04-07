

## Correção: erro "dateBumped column not found" ao publicar jogos

### Diagnóstico

A correção na linha 563 do `ProgramacaoTexto.tsx` já existe — `dateBumped` é removido via desestruturação no `buildInsertPayload`. Porém, o erro persiste porque pode haver um cache do navegador com a versão antiga, OU porque o `sanitizeGame` no `useDailyGames.ts` faz `{ ...game }` e repassa campos desconhecidos para o Supabase.

### Solução: defesa em profundidade

Adicionar uma **whitelist de campos válidos** no `sanitizeGame` (ou diretamente antes do `.insert()`) para garantir que apenas colunas da tabela `daily_games` sejam enviadas ao banco — independente do que chegue do parser.

### Alterações

**Arquivo: `src/hooks/useDailyGames.ts`** (função `sanitizeGame`, ~linha 101)

Adicionar whitelist de colunas válidas e filtrar campos desconhecidos:

```typescript
const DAILY_GAMES_COLUMNS = new Set([
  "date", "home_team", "away_team", "competition", "competition_detail",
  "game_time", "channels", "is_live", "is_womens", "active", "archived",
  "status_short", "elapsed_minutes", "publish_at", "sport_type",
]);

function sanitizeGame(game: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(game)) {
    if (!DAILY_GAMES_COLUMNS.has(key)) continue; // strip unknown fields
    if (typeof value === "string" && ["home_team","away_team","competition","competition_detail"].includes(key)) {
      out[key] = sanitizeGameStr(value);
    } else {
      out[key] = value;
    }
  }
  if (Array.isArray(out.channels)) {
    out.channels = out.channels.map((c: any) => typeof c === "string" ? sanitizeGameStr(c) : c);
  }
  return out;
}
```

Isso garante que `dateBumped`, `selected`, `sport_type` (já tratado no buildInsertPayload) ou qualquer outro campo espúrio nunca chegue ao banco.

### Validação
- Rodar `vitest run` para confirmar 0 regressões.

