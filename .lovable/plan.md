

# Correções da Aba Programação Mobile

## Problemas Identificados

1. **Badges de competição muito truncados**: "CAMPEONATO B...", "CONFERENCE LE..." — o `max-w-[130px]` é muito agressivo, perde informação útil
2. **Nomes de times truncando**: "Águia de Mara..." — o layout flex não distribui espaço suficiente para nomes longos; o horário central ocupa muito espaço relativo
3. **Padding do ScheduleTab pode ser melhorado**: O `px-3 pt-3` deixa pouco respiro no topo

## Correções

### 1. Aumentar largura máxima dos badges de competição
- **`DailyGamesSection.tsx` linha 165**: Mudar `max-w-[130px]` para `max-w-[160px]` no mobile e `max-w-[200px]` no sm+, para mostrar mais texto (ex: "CAMPEONATO BRASILEIRO" em vez de "CAMPEONATO B...")

### 2. Melhorar distribuição de espaço nos nomes dos times
- **`DailyGamesSection.tsx` linhas 226-236**: Reduzir o padding do bloco central de horário (`px-3` → `px-2.5`) e garantir que os nomes dos times tenham `min-w-0` com `flex-1` corretos para truncar graciosamente sem cortar o card

### 3. Ajustar padding do ScheduleTab
- **`ScheduleTab.tsx`**: Mudar para `px-3 pt-4 pb-3` para melhor respiro visual no topo

### 4. Sugestão: Mostrar nome completo da competição no detail line
- Já existe `competition_detail` que mostra "quarta fase" etc. — manter como está, funciona bem

## Arquivos
- `src/components/public/DailyGamesSection.tsx` — badges maiores, layout de times otimizado
- `src/components/public/ScheduleTab.tsx` — ajuste de padding

