

## Problema

O jogo **Santos Laguna x América-MEX** (00:00) está com `date: 2026-04-04` mas deveria ser `2026-04-05`. Jogos com horário 00:00 são ambíguos — na prática, quase sempre pertencem ao **dia seguinte** (madrugada). O sistema já tem um dialog de confirmação, mas ele não corrige automaticamente a data.

---

## Plano

### 1. Corrigir o jogo no banco (imediato)
- `UPDATE daily_games SET date = '2026-04-05' WHERE id = '58dee08e-...'`

### 2. Auto-bump de data para jogos 00:00 no parser
**Arquivo**: `src/components/admin/ProgramacaoTexto.tsx`

Na função `parseScheduleText`, após detectar que `game_time === "00:00"`, verificar se a data do jogo é a mesma que foi colada/selecionada. Se sim, **automaticamente avançar a data em +1 dia** — pois jogos de meia-noite pertencem à madrugada do dia seguinte.

Lógica:
```
Se game_time === "00:00" E a data veio do cabeçalho 📅 ou do fallback:
  → date = dia seguinte
```

### 3. Melhorar o warning visual no preview
**Arquivo**: `src/components/admin/ProgramacaoTexto.tsx`

Atualizar `getGameWarnings` para deixar mais claro:
- Warning atual: `"⏰ Horário 00:00 — verifique se a data está correta"`
- Novo: `"⏰ Horário 00:00 — data avançada para [dd/mm] (madrugada). Corrija se necessário."`

### 4. Melhorar o dialog de confirmação
Atualizar o texto do dialog `midnightConfirmOpen` para informar que as datas foram auto-ajustadas e permitir que o admin reverta se necessário.

---

## Detalhes técnicos

- O auto-bump só se aplica quando `game_time === "00:00"`. Jogos com horários como `00:30` também serão incluídos (qualquer horário entre 00:00 e ~04:59 provavelmente pertence ao dia seguinte).
- A lógica será: se `game_time < "05:00"`, avançar a data em +1 dia quando a data veio de um cabeçalho `📅 Dia XX/XX` (pois o cabeçalho indica o dia da programação, e jogos de madrugada são do dia seguinte).
- Não se aplica quando a data é digitada manualmente pelo admin no date picker (fallback) — nesse caso o admin já escolheu a data conscientemente.
- Adicionar flag `dateBumped: true` ao `ParsedGame` para exibir indicador visual no preview.

