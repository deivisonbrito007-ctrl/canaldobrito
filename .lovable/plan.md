

## Problema: Parser não reconhece formato multi-linha

### Formato esperado pelo parser atual (3 linhas)
```
Flamengo x Palmeiras
🏆 Brasileirão (oitavas) / ⏰ 19h00
📺 Sportv
```

### Formato enviado pelo usuário (5 linhas)
```
China x Curaçao
🏆 FIFA Series 2026
📍 Fase de grupos
⏰ 03:00
📺 DAZN
```

O parser consome exatamente 3 linhas por jogo (team, comp+time, channels). Quando competição, detalhe, horário e canal estão em linhas separadas, ele perde dados ou pula jogos.

### Solução

Refatorar `parseScheduleText` em `src/lib/gameUtils.ts` → `src/components/admin/ProgramacaoTexto.tsx` para usar uma abordagem de **coleta multi-linha**:

#### 1. `src/components/admin/ProgramacaoTexto.tsx` — Refatorar `parseScheduleText`

Em vez de consumir exatamente 3 linhas, após detectar a linha de times (ou evento), **coletar todas as linhas seguintes** que sejam de metadados (🏆, 📍, ⏰, 📺) até encontrar a próxima linha de times, data, ou seção:

```
Ao encontrar linha de times:
  - Avançar e coletar linhas enquanto começarem com 🏆, 📍, ⏰, 📺
  - Extrair competition de 🏆
  - Extrair competition_detail de 📍
  - Extrair game_time de ⏰
  - Extrair channels de 📺
  - Manter compatibilidade com formato antigo (tudo numa linha com /)
```

Também ignorar linhas de "cabeçalho de seção" como `FUTEBOL`, `BASQUETE`, `FIFA Series 2026`, `Amistosos Internacionais`, `NBA`, etc. — linhas soltas sem emoji de metadado que antecedem jogos.

#### 2. Adicionar detecção de linhas de cabeçalho de seção

Linhas como `FUTEBOL`, `NBA`, `TÊNIS`, `Brasileirão Feminino`, `Copa Argentina` são títulos de seção e devem ser ignoradas. Detectar por:
- Texto todo em maiúsculas sem emoji de metadado
- Texto que não contém " x " e cuja próxima linha NÃO é uma linha de metadado (🏆/📍/⏰/📺)

#### 3. Atualizar testes

Adicionar teste em `ProgramacaoTexto.test.tsx` para o formato multi-linha de 5 linhas, garantindo que competition, detail, time e channels sejam extraídos corretamente.

### Arquivos alterados
- `src/components/admin/ProgramacaoTexto.tsx` — refatorar `parseScheduleText`, `isCompetitionLine`, `parseCompAndTime`
- `src/components/public/__tests__/` ou `src/components/admin/__tests__/ProgramacaoTexto.test.tsx` — novos testes

### Compatibilidade
- O formato antigo de 3 linhas (com `/` separando competição e horário) continua funcionando
- O novo formato de 5 linhas é suportado coletando linhas de metadado individualmente

