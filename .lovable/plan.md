

## Auditoria da Aba Programacao + Correcoes de Warnings + Sugestoes

### Problemas encontrados

1. **Warning: RecentActivity nao usa forwardRef** — Console mostra "Function components cannot be given refs" em `AdminDashboard` ao renderizar `RecentActivity`.

2. **Warning: ChartStyle nao usa forwardRef** — Console mostra o mesmo warning para `ChartStyle` dentro de `chart.tsx` (displayName "Chart").

3. **Fluxo ProgramacaoTexto** — Codigo esta correto apos as correcoes anteriores. O fluxo de parse, dedup visual, agendamento com validacao de data passada, AlertDialog de confirmacao e feedback real (inserted vs skipped) estao todos implementados. Nenhum bug logico restante.

### Alteracoes

**1. `src/components/admin/RecentActivity.tsx` — Converter para forwardRef**

Envolver o componente com `React.forwardRef` para eliminar o warning do console.

**2. `src/components/ui/chart.tsx` — Converter ChartStyle para forwardRef**

`ChartStyle` na linha 61 e uma funcao simples que recebe ref indiretamente. Converter para `forwardRef` ou simplesmente nao retornar um elemento que receba ref (o problema real e que `ChartContainer` renderiza `ChartStyle` como child direto). Na verdade, `ChartStyle` retorna `<style>` — o warning vem do Recharts/React tentando passar ref. A solucao e envolver com `forwardRef`.

**3. Rodar testes** — Executar a suite de testes para verificar regressoes.

### Sugestoes de melhoria adicionais

- **Dashboard**: Adicionar contagem de jogos agendados (com `publish_at` no futuro) no card de Jogos, alem dos ativos
- **ProgramacaoTexto**: Botao de "Copiar resumo" que gera texto formatado dos jogos selecionados para colar no WhatsApp

### Arquivos modificados
- `src/components/admin/RecentActivity.tsx` — forwardRef
- `src/components/ui/chart.tsx` — forwardRef no ChartStyle

