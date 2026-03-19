

# Auto-agendar banners para 00:00 do dia seguinte

## Problema
Atualmente o admin precisa selecionar manualmente a data/hora no campo `datetime-local` cada vez que quer agendar um banner. O usuario quer que ao fazer upload, o banner ja fique automaticamente agendado para as 00:00 do dia seguinte.

## Solucao

### Mudancas em `src/pages/admin/AdminBanners.tsx`

1. **Substituir o campo datetime-local por um sistema de "modo de agendamento"**:
   - Adicionar um toggle (Switch) "Agendar para amanha 00h" que, quando ativo, pre-preenche automaticamente o `scheduleDate` com `amanha 00:00` no fuso local
   - Manter o campo datetime-local visivel abaixo para quem quiser ajustar manualmente a data/hora
   - Quando o toggle e ativado, calcular automaticamente: `tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0)`

2. **Adicionar botoes rapidos de agendamento**:
   - "Amanha 00h" (default)
   - "Amanha 06h"
   - "Amanha 12h"
   - "Personalizado" (mostra o datetime-local)
   - Esses botoes preenchem o campo `scheduleDate` automaticamente

3. **Logica de upload permanece igual** — o campo `scheduleDate` ja controla se o banner vai como `active: false` com `publish_at`

### Mudancas em `src/lib/dateUtils.ts`

- Adicionar helper `getNextMidnight(): string` que retorna o proximo dia as 00:00 no formato compativel com `datetime-local` (`YYYY-MM-DDTHH:MM`)

## Resultado
- Upload com 1 clique ja agenda para amanha 00h automaticamente
- Opcoes rapidas para outros horarios comuns
- Campo manual ainda disponivel para datas customizadas

