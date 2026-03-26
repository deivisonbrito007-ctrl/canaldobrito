

## Correções e melhorias no sistema de agendamento

### Status atual
- O agendamento **funciona** -- a sanitização de surrogates/bandeiras está resolvida (3 camadas: cleanText, buildInsertPayload, hook).
- A Edge Function `activate-scheduled` roda corretamente a cada minuto, ativando jogos e banners no horário.
- O fluxo de Publicar/Agendar/Republicar funciona sem erros de dados.

### Problema restante: Warning de ref no AlertDialog

O console mostra: `Function components cannot be given refs`

**Causa:** `AlertDialogFooter` em `alert-dialog.tsx` (linha 51) e `AlertDialogHeader` (linha 46) sao function components simples (sem `forwardRef`). O Radix tenta passar ref a eles quando renderiza dentro do `AlertDialogContent`.

**Correção:** Converter `AlertDialogFooter` e `AlertDialogHeader` para usar `React.forwardRef`, igual aos outros componentes do mesmo arquivo.

### Arquivo modificado
- `src/components/ui/alert-dialog.tsx` -- converter `AlertDialogHeader` e `AlertDialogFooter` para `forwardRef`

### Resultado
- Warning do console eliminado
- Nenhuma mudança de comportamento ou visual

