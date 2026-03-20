

# Correção do Parser para Esportes Individuais (Tênis, F1, MMA)

## Problema

O sistema força **todos** os esportes no formato "Time A x Time B", mas esportes individuais/de evento (tênis, F1, MMA) não têm dois times adversários. A IA gera saída como `ATP e WTA x ?` porque o prompt obriga o formato com `x`, e o parser (linha 54) **só reconhece linhas com ` x `** — ignorando qualquer evento que não encaixe nesse padrão.

## Causa Raiz

1. **Prompt da IA** (`read-schedule-image/index.ts`): Instrui a usar "Time A x Time B" para tudo, sem alternativa para eventos individuais
2. **Parser** (`ProgramacaoTexto.tsx` linha 54): Rejeita qualquer linha sem ` x `, impossibilitando eventos sem adversário
3. **Sem validação pós-parse**: Não há limpeza de placeholders como `?` nem detecção de erros comuns

## Correções

### 1. Atualizar o Prompt da IA (edge function)
**`supabase/functions/read-schedule-image/index.ts`**

Adicionar ao prompt um formato alternativo para esportes de evento/individual:

```
Para esportes SEM adversário direto (Fórmula 1, MMA card, Tênis torneio):
Nome do Evento
🏎️ Competição (detalhe) / ⏰ HHhMM
📺 Canal1

Exemplo tênis: ATP Masters 1000
🎾 Tênis (Indian Wells) / ⏰ 20h00
📺 ESPN 2

Exemplo F1: GP da Arábia Saudita
🏎️ Fórmula 1 (Classificação) / ⏰ 13h00
📺 Band, BandSports
```

E instruir: "NÃO use 'x ?' para esportes sem adversário. Use apenas o nome do evento."

### 2. Atualizar o Parser para aceitar eventos sem ` x `
**`src/components/admin/ProgramacaoTexto.tsx`** — função `parseScheduleText`

Atualmente a linha 54 (`if (!/\sx\s/i.test(line))`) descarta linhas sem ` x `. Modificar para:

- Se a linha contém ` x `, parse normal (dois times)
- **Se a próxima linha contém emoji de esporte** (🎾, 🏎️, 🥊, 🏀, 🏐, 🏆) + horário, tratar a linha atual como **nome do evento** com `home_team = linha`, `away_team = ""`
- Isso permite tanto o formato legado quanto o novo

### 3. Limpeza de placeholders e validação
**`src/components/admin/ProgramacaoTexto.tsx`**

Após o parse, adicionar limpeza:
- Remover `?` de `away_team` (substituir por `""`)
- Se `home_team` contém ` x ?` no final, limpar para apenas o nome
- Detectar padrões como "ATP e WTA" e manter como nome de evento único

### 4. Limpar emojis de esporte da competition line no parser
O parser atual (linha 72-83) só reconhece 🏆. Expandir para reconhecer 🎾, 🏎️, 🥊, 🏀, 🏐 como marcadores válidos de linha de competição, e removê-los do campo `competition` final.

## Arquivos Modificados
- `supabase/functions/read-schedule-image/index.ts` — prompt atualizado com formato para esportes individuais
- `src/components/admin/ProgramacaoTexto.tsx` — parser expandido + validação pós-parse

