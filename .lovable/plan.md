

# Melhorar UX do Agendamento — Clareza na Data de Ativação

## Problema

O campo "Data padrão" serve para definir a data dos jogos (ex: 19/03). Quando o toggle "Agendar 00:00" está ativo, o sistema agenda para 00:00 **dessa mesma data**. Isso causa confusão:
- Se a data é hoje (19/03) e já passou da meia-noite, o agendamento fica no passado
- O admin não sabe se vai publicar "hoje à meia-noite" ou "amanhã à meia-noite"

## Solução

### 1. Mudar a lógica: "Agendar 00:00" sempre agenda para 00:00 do **dia seguinte à data selecionada**... NÃO. Na verdade o correto é: a data do jogo É a data do jogo. Se o admin coloca 20/03, os jogos são do dia 20/03 e o agendamento deveria ativar na meia-noite do dia 20/03.

**Proposta mais clara**: Tornar o label e o feedback explícitos sobre quando vai ativar.

### Mudanças em `src/components/admin/ProgramacaoTexto.tsx`

1. **Renomear o toggle** de "Agendar 00:00" para algo mais claro:
   - Label: **"Agendar publicação"**
   - Sublabel dinâmico: **"Ativa em {data selecionada} às 00:00"**
   - Se a data selecionada já passou, mostrar aviso em vermelho: **"⚠️ Data no passado — será ativado imediatamente"**

2. **Adicionar validação visual**:
   - Se `scheduleMidnight` está ativo e a data é hoje ou passada, mostrar badge de aviso
   - Se a data é futura, mostrar badge verde: "Publica em X dias"

3. **Ajustar o `buildInsertPayload`**: Se a data selecionada já passou (00:00 dessa data < agora), não definir `publish_at` — publicar imediatamente e avisar o admin com toast

4. **Melhorar o campo "Data padrão"**:
   - Renomear label para **"Data dos jogos"** (mais claro)
   - Adicionar sublabel: "Usado quando o texto não contém 📅 com data"

## Resumo de mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/ProgramacaoTexto.tsx` | Renomear labels, adicionar feedback visual dinâmico, validar data passada |

