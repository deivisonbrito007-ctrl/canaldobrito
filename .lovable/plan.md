## Objetivo

Simplificar o seletor de datas da aba **Programação** para mostrar apenas **Hoje** e **Amanhã**, e o botão "Amanhã" só fica disponível quando já existem jogos cadastrados para o dia seguinte. Isso evita o usuário navegar para dias vazios e deixa a navegação mais focada no que está realmente publicado.

## Comportamento proposto

- Em **Hoje**: mostrar botão "Amanhã →" à direita, **somente se** houver jogos para amanhã. Se não houver, o botão fica oculto (ou desabilitado com tooltip "Sem jogos ainda").
- Em **Amanhã**: mostrar botão "← Hoje" à esquerda para voltar.
- Remover os controles `‹ / ›` que avançam para qualquer data arbitrária e o atalho central que mostra `dd/MM`.
- Bloquear navegação via URL: se chegar `?date=` com data diferente de hoje/amanhã (ou amanhã sem jogos), redireciona para hoje (mantendo UTMs).
- Título dinâmico continua: "AGENDA DE HOJE" / "AGENDA DE AMANHÃ".

## Sugestões adicionais

1. **Badge de contagem no botão Amanhã**: ex.: `Amanhã · 8 jogos`. Reforça que vale a pena clicar.
2. **Pré-fetch leve**: ao montar a aba em "Hoje", buscar a contagem de amanhã via `useAllDailyGames(amanhã)` em background para decidir se exibe o botão sem flicker.
3. **Estado vazio em Amanhã**: caso o usuário esteja em amanhã e o admin remova todos os jogos, redirecionar de volta para hoje automaticamente.
4. **Acessibilidade**: `aria-label="Ver programação de amanhã (8 jogos)"`.

## Arquivos afetados

- `src/components/public/ProgramacaoTab.tsx`
  - Remover `goToDate` genérico baseado em `offsetDateStr(±1)` arbitrário.
  - Substituir o `<nav>` de 3 botões por um seletor binário Hoje/Amanhã.
  - Adicionar `useAllDailyGames(tomorrow)` (com `enabled: isToday`) para descobrir se há jogos amanhã.
  - Validar `date` recebido pela URL — só aceitar hoje ou amanhã.
- `src/lib/agendaRedirect.ts` (opcional)
  - Endurecer `isValidDateParam` para também rejeitar datas fora da janela hoje/amanhã ao redirecionar de `/agenda`.

## Fora de escopo

- Layout do `AgendaHeader` antigo (não é mais usado nesta tela).
- Qualquer mudança no admin / cadastro de jogos.
- Mudanças nas demais abas (Ao Vivo, Novidades, Sugestões).
