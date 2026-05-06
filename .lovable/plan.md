## Objetivo
Garantir que **jogos com data + horário + times + esporte idênticos nunca mais sejam inseridos em duplicidade**, mesmo sob:
- duplo-clique no botão Publicar (race condition),
- variações invisíveis no texto colado (espaço duplo, NBSP `\u00A0`, maiúscula/minúscula, acento),
- dois admins publicando ao mesmo tempo.

Eventos com horários diferentes (ex.: Italian Open 06:00 e 10:00) **continuam tratados como entradas independentes** — você confirmou que está correto.

## O que muda

### 1. Constraint UNIQUE no banco (barreira definitiva)
Migration nova:
```sql
CREATE UNIQUE INDEX daily_games_unique_event
  ON public.daily_games (
    date,
    lower(btrim(home_team)),
    lower(btrim(coalesce(away_team, ''))),
    game_time,
    sport_type
  )
  WHERE archived = false;
```
A partir daí, mesmo se o app falhar, o Postgres rejeita.

### 2. Normalizar a chave de dedup — `src/lib/dedup.ts`
Hoje compara `toLowerCase().trim()` apenas. Adicionar:
- `normalize("NFKC")` (resolve acentos compostos vs combinados),
- substituir NBSP (`\u00A0`) por espaço normal,
- colapsar múltiplos espaços (`/\s+/g → " "`),
- incluir `sport_type` na chave (casa com o índice do banco).

### 3. Tratar erro `23505` com elegância — `src/hooks/useDailyGames.ts`
Já existe parcialmente. Reforçar: quando o índice rejeitar, contar como `skipped` (não como erro fatal) e seguir o batch.

### 4. Bloqueio anti double-click — `src/components/admin/ProgramacaoTexto.tsx`
Guarda explícita: `if (insertGames.isPending) return;` no handler + `disabled={insertGames.isPending}` no botão (já parcial, reforçar).

### 5. Botão "Verificar duplicatas" — `src/components/admin/DailyGamesManager.tsx`
Roda `GROUP BY (date, lower(trim(home_team)), lower(trim(away_team)), game_time, sport_type) HAVING count > 1`, mostra preview num `AlertDialog` com IDs e `created_at`, e oferece "Manter o mais antigo, deletar os demais". Auto-cura para qualquer caso futuro.

### 6. Testes
- `src/lib/__tests__/dedup.test.ts` (novo): "Botafogo " vs "Botafogo", `"Sao\u00A0Paulo"` vs `"Sao Paulo"`, maiúsculas → mesma chave.
- `src/hooks/__tests__/useDailyGames.test.ts`: simular Supabase retornando `code: "23505"` → mutation resolve sem throw, contadores corretos.

## Arquivos
- Migration nova (UNIQUE INDEX)
- `src/lib/dedup.ts`
- `src/hooks/useDailyGames.ts`
- `src/components/admin/ProgramacaoTexto.tsx`
- `src/components/admin/DailyGamesManager.tsx`
- 2 arquivos de teste

## Critérios de aceite
- Tentar inserir o mesmo jogo 2x via UI → segundo é silenciosamente ignorado, toast informa "1 já existente".
- Colar texto com `"Botafogo"` e `"Botafogo "` (com espaço) → entra apenas 1.
- Duplo-clique rápido em Publicar → não cria nada duplicado (`isPending` bloqueia + índice no DB rejeita).
- Botão "Verificar duplicatas" lista 0 itens depois da limpeza.
- `bunx vitest run` verde.
