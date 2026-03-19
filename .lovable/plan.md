

# Auditoria Completa da Aba Programacao + Agendamento + Testes

## Auditoria do Fluxo

**Funcionando corretamente:**
- Parser de texto detecta jogos, datas, competicoes, horarios e canais
- Preview com selecao individual, edicao inline, agrupamento por data
- Publicar e Republicar (limpa + insere) funcionam
- Toggle "Agendar 00:00" define `active: false` e `publish_at` com data local convertida para UTC
- Edge Function `activate-scheduled` roda a cada minuto via pg_cron (confirmado: jobid 2, schedule `* * * * *`)
- Cron job esta registrado e executando sem erros (logs confirmam 0 erros)
- DailyGamesManager lista jogos por data com status agendado/ativo
- Nenhum jogo ou banner pendente de ativacao no momento (tabelas limpas)

**Problema encontrado no agendamento:**
- Linha 169 do ProgramacaoTexto: `new Date(\`${g.date}T00:00:00\`).toISOString()` — quando `g.date` e uma data **futura** (ex: amanha), o `new Date("2026-03-20T00:00:00")` e interpretado como **UTC 00:00**, nao local. Em fuso UTC-3 (Brasil), isso significa que o `publish_at` sera `2026-03-20T00:00:00.000Z` que corresponde a `19/03 21:00 local` — os jogos serao ativados **3 horas antes** da meia-noite local
- **Correcao**: usar o construtor com componentes locais: `new Date(year, month-1, day, 0, 0, 0).toISOString()` para garantir que 00:00 local seja convertido corretamente para UTC

## Plano de Execucao

### 1. Corrigir timezone no agendamento (ProgramacaoTexto.tsx)
- Linha 169: substituir `new Date(\`${g.date}T00:00:00\`)` por construcao com componentes de data local para garantir que `publish_at` represente exatamente meia-noite no fuso do admin

### 2. Testes unitarios

**`src/components/admin/__tests__/ProgramacaoTexto.test.tsx`** (novo):
- Testar parser: deteccao de jogos, datas, competicoes, horarios, canais
- Testar parser com multiplas datas
- Testar caso vazio (sem "x")
- Testar deteccao de feminino `(F)`

**`src/lib/dateUtils.test.ts`** (atualizar):
- Adicionar teste para `getScheduleDate` se nao existir

### 3. Rodar suite completa de testes

### 4. Melhorias UI sugeridas
- **Dashboard**: link "Programacao" no quick actions aponta para `/admin/banners` generico — mudar para incluir state ou query param indicando aba programacao
- **DailyGamesManager**: mostrar countdown para jogos agendados (reutilizar `formatCountdown` de dateUtils)
- **ProgramacaoTexto**: ao ativar "Agendar 00:00", mostrar a data/hora exata em que sera ativado (ex: "Ativa em 20/03/2026 00:00") como feedback visual

## Resumo de mudancas

| Arquivo | Mudanca |
|---------|---------|
| `src/components/admin/ProgramacaoTexto.tsx` | Corrigir timezone do publish_at (bug critico) |
| `src/components/admin/__tests__/ProgramacaoTexto.test.tsx` | Novo - testes do parser |
| `src/lib/dateUtils.test.ts` | Verificar cobertura existente |
| Rodar suite completa | Validar todos os testes |

## Detalhes tecnicos

O bug de timezone e o mais critico. Atualmente:
```text
Admin no Brasil (UTC-3) agenda para 20/03 00:00
-> new Date("2026-03-20T00:00:00") = UTC 00:00
-> Convertido para local = 19/03 21:00
-> Edge Function ativa 3h antes do esperado
```

Correcao:
```text
const [y, m, d] = g.date.split("-").map(Number);
new Date(y, m - 1, d, 0, 0, 0).toISOString()
-> Constroi meia-noite LOCAL
-> toISOString() converte para UTC corretamente (ex: 2026-03-20T03:00:00Z para UTC-3)
-> Edge Function ativa exatamente a meia-noite local
```

