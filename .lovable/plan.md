

# Plano Atualizado: Correção de Fuso Horário

## Diagnóstico

Os jogos estão corretamente gravados com `date = 2026-03-25`. O sistema está funcionando como esperado: às 23:24 horário de SP (02:24 UTC), `getLocalDateString()` retorna `2026-03-24`, então os jogos de 25/03 só aparecerão a partir da meia-noite SP. **Não é necessária migração de dados.**

## Problemas Reais a Corrigir

### 1. `ProgramacaoTexto.tsx` — Timezone do agendamento
- `buildInsertPayload` usa `new Date(y, m-1, d)` que cria meia-noite no fuso do **browser** (UTC no sandbox), não de SP
- Corrigir para usar offset explícito: `new Date(\`${date}T00:00:00-03:00\`)`
- `isDateInPast` também usa timezone do browser; corrigir para comparar com `getLocalDateString()`

### 2. `src/lib/gameUtils.ts` — Helper de meia-noite SP
- Adicionar `export function midnightInSaoPaulo(dateStr: string): Date` que retorna meia-noite de uma data em SP timezone (offset -03:00)
- Reutilizável no agendamento e em futuras comparações

### Arquivos modificados
- `src/lib/gameUtils.ts` (adicionar helper)
- `src/components/admin/ProgramacaoTexto.tsx` (corrigir timezone no agendamento)

### O que NÃO fazer
- ~~Migration para alterar datas existentes~~ — os dados estão corretos como `2026-03-25`
- A página pública mostrará os jogos automaticamente quando o relógio SP atingir meia-noite (00:00 de 25/03)

