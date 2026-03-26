

## Corrigir formatação do texto de jogos na aba WhatsApp

### Problemas identificados

1. **Data usa UTC em vez de São Paulo** — `new Date().toISOString().split("T")[0]` pode mostrar data errada à noite no Brasil (após 21h BRT = 00h UTC do dia seguinte). Deve usar `getLocalDateString()`.

2. **Formatação dos jogos desorganizada** — O texto gerado no `gamesText` do `AdminWhatsApp.tsx` tem problemas:
   - Espaçamento duplo (`\n\n`) entre cada jogo — fica muito espaçado no WhatsApp
   - Emoji `🏆` aparece no header principal E em cada linha de competição (redundante)
   - Não inclui `competition_detail` (fase do campeonato)
   - Formato inconsistente com o "Copiar resumo" do `ProgramacaoTexto.tsx`

3. **Formato de hora pode vir com segundos** — `game_time.slice(0, 5)` funciona, mas o formato do `generateWhatsAppSummary` usa o `game_time` direto sem tratar.

### Correção

**Arquivo:** `src/pages/admin/AdminWhatsApp.tsx`

1. Importar `getLocalDateString` de `@/lib/gameUtils` e usar no lugar de `toISOString().split("T")[0]`

2. Reescrever o `gamesText` para ficar igual ao `generateWhatsAppSummary` do `ProgramacaoTexto`:
   - Header de esporte com emoji + label em bold (`*FUTEBOL*`)
   - Cada jogo: `HH:MM — Time A x Time B` em uma linha
   - Detalhes: `🏆 Competição · detalhe | 📺 Canais` na linha seguinte
   - Uma linha em branco entre jogos (não duas)
   - Jogos ordenados por horário dentro de cada esporte

3. Incluir `competition_detail` quando disponível

### Resultado esperado
- Texto copiado fica limpo e bem organizado para colar no WhatsApp
- Data correta mesmo à noite no fuso de São Paulo
- Formato consistente entre "Copiar resumo" da Programação e a aba WhatsApp

