

# Causa Raiz: Jogos Apagados pela Edge Function

## O que aconteceu

A Edge Function `activate-scheduled` executa a cada minuto via pg_cron e contem esta logica na linha 46-49:

```typescript
// Cleanup: remove games from past dates
const { data: deletedGames, error: cleanupError } = await supabase
  .from("daily_games")
  .delete()
  .lt("date", new Date().toISOString().split("T")[0])
  .select("id");
```

O problema e duplo:

1. **Fuso horario**: O servidor roda em UTC. O Brasil esta em UTC-3. As 21h no Brasil, o servidor ja considera que e o dia seguinte (00:00 UTC). Nesse momento, a funcao deleta todos os jogos do dia que ainda esta em andamento no Brasil.

2. **Delecao automatica agressiva**: A funcao apaga PERMANENTEMENTE todos os jogos de datas passadas. Nao ha soft-delete nem periodo de retencao. Se o admin inseriu jogos para hoje e o cron roda apos meia-noite UTC, os jogos somem.

## Correcoes

### 1. Usar fuso horario brasileiro na comparacao
Trocar `new Date().toISOString().split("T")[0]` por uma data calculada em UTC-3 (America/Sao_Paulo), garantindo que a limpeza so acontece quando o dia realmente acabou no Brasil.

### 2. Adicionar margem de seguranca de 2 dias
Em vez de deletar `date < hoje`, deletar `date < hoje - 2 dias`. Isso garante que jogos de ontem (que podem ter terminado de madrugada) sobrevivem. Jogos de 3+ dias atras sao limpos automaticamente.

### 3. Log detalhado antes de deletar
Adicionar log com a lista de IDs e datas que serao deletados, facilitando debug futuro.

## Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/activate-scheduled/index.ts` | Corrigir timezone para America/Sao_Paulo, adicionar margem de 2 dias, melhorar logs |

## Detalhe tecnico

```text
Antes (UTC):
  21:00 BRT = 00:00 UTC (dia seguinte)
  → deleta jogos de "hoje" no Brasil

Depois (BRT com margem):
  Calcula data em America/Sao_Paulo
  Subtrai 2 dias da data atual
  → so deleta jogos de 3+ dias atras
```

