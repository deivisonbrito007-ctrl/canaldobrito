

## Ajustar card "Jogos do Dia" com tabs Hoje / Amanhã

### O que muda

O card existente "⚽ Jogos do Dia" (linhas ~175-195) será ajustado para incluir **duas tabs**: **Hoje** e **Amanhã**. Sem criar card novo, sem tab "Completa" — cada dia é copiado separadamente.

### Alterações em `src/pages/admin/AdminWhatsApp.tsx`

1. **Calcular `tomorrowStr`** a partir de `todayStr` (adicionar 1 dia respeitando São Paulo timezone)
2. **Buscar jogos de amanhã** com `useDailyGames(tomorrowStr)`
3. **Extrair a lógica de montar texto** para uma função reutilizável `buildDayText(games, dateStr, dayLabel, siteUrl)` — usada para hoje e amanhã
4. **Substituir o card atual** por um card com `Tabs` (shadcn):
   - Tab **"Hoje (N)"** — mostra o texto de hoje com preview + Copiar + Enviar
   - Tab **"Amanhã (N)"** — mostra o texto de amanhã (se houver jogos) ou mensagem "Nenhum jogo agendado ainda"
   - Badge com contagem de jogos em cada tab
5. **Importar** `Tabs, TabsList, TabsTrigger, TabsContent` de `@/components/ui/tabs`
6. **Incluir dia da semana** no header do texto (ex: `📅 Quinta-feira, 27/03`)

### Sugestão extra

Adicionar `addDays` do `date-fns` para calcular a data de amanhã de forma limpa, já que `date-fns` já está no projeto.

