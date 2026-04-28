## Causa raiz do erro de hoje (28/04)

Os logs do Postgres mostram **3 falhas seguidas** com:

```
duplicate key value violates unique constraint "uq_daily_games_match"
SQLSTATE 23505
```

A tabela `daily_games` tem um índice único em `(date, lower(home_team), lower(away_team), game_time)`. O hook `useInsertDailyGames` hoje só checa duplicatas **contra o banco** (`fetchExistingGameKeys`), mas **não verifica duplicatas dentro do próprio lote** que está sendo inserido. Resultado: quando o texto colado tem o mesmo jogo listado duas vezes (ex.: aparece em duas seções, ou o parser captura linhas repetidas), o INSERT em massa do PostgREST aborta tudo com 23505 e o usuário vê só "Erro ao publicar" sem entender o motivo.

Confirmei também que **a tabela está vazia** para 28/04 agora — ou seja, nada foi inserido nas 3 tentativas. O erro abortou a transação inteira.

## O que vou corrigir

### 1. `src/hooks/useDailyGames.ts` — `useInsertDailyGames`
- Antes de checar contra o banco, **deduplicar o array `games` por `gameKey()` dentro do próprio lote** (mantém a primeira ocorrência).
- Tratar explicitamente o erro `23505`: em vez de jogar exceção genérica, identificar quais linhas conflitam (consultar quais chaves já existem após o erro) e mostrar um toast claro: `"X jogo(s) já existiam e foram ignorados, Y inseridos"`.
- Como rede de segurança extra: usar `.upsert(..., { onConflict: 'date,home_team,away_team,game_time', ignoreDuplicates: true })` se viável — porém o índice é em `lower(trim(...))`, que `onConflict` do PostgREST não suporta. Então a estratégia continua sendo dedup no cliente + tratamento gracioso do 23505.

### 2. `src/components/admin/ProgramacaoTexto.tsx`
- No `handleProcess`, após gerar `games` do parser, marcar com badge **"duplicado no texto"** quando `gameKey()` aparece mais de uma vez no próprio texto colado, e auto-desmarcar as cópias subsequentes (mantém a primeira selecionada).
- Mostrar toast amarelo: `"N duplicata(s) interna(s) detectada(s) no texto colado"`.

### 3. Mensagem de erro amigável
- Capturar `error.code === '23505'` no `executePublish` e mostrar: *"Alguns jogos já existem com data/horário/times idênticos. Eles foram ignorados."* em vez de mensagem técnica.

## Por que isso evita reincidência

- **Dedup intra-lote**: mata a causa imediata (mesmo lote com chave repetida).
- **Dedup visual no preview**: o admin vê antes de clicar publicar.
- **Tratamento de 23505**: mesmo se uma corrida acontecer (ex: dois admins publicando ao mesmo tempo), o usuário recebe feedback claro em vez de erro cru.

## Validação

- Rodar `bunx vitest run src/hooks/__tests__/useDailyGames.test.ts` e `src/components/admin/__tests__/ProgramacaoTexto.test.tsx` (já existem).
- Adicionar caso de teste novo: `useInsertDailyGames` recebendo array com 2 jogos idênticos → insere 1, reporta 1 skipped.
- `bunx tsc --noEmit` deve continuar 0 erros.

## Arquivos alterados

- `src/hooks/useDailyGames.ts` (dedup intra-lote + handler 23505)
- `src/components/admin/ProgramacaoTexto.tsx` (badge "duplicado no texto" + toast melhorado)
- `src/hooks/__tests__/useDailyGames.test.ts` (novo caso)

Sem mudanças de schema, sem migrations.
