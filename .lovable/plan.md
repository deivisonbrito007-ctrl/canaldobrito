

## Auditoria e Correções da Aba Banners/Programação

### Problemas Identificados

1. **Erro de agendamento**: O `buildInsertPayload` verifica se a data é futura para agendar, mas se a data selecionada é hoje (meia-noite já passou), o agendamento é ignorado silenciosamente e publica imediatamente. Além disso, o toast de sucesso mostra `selected.length` em vez do número real inserido, e se houver duplicatas o `useInsertDailyGames` mostra toast de "duplicados ignorados" mas `handlePublish` ainda mostra "X jogos agendados" com o total, causando confusão.

2. **Warning de ref no Badge**: O componente `Badge` é uma função simples sem `forwardRef`. O Tooltip ou outro componente dentro de `ProgramacaoTexto` está tentando passar ref para ele.

3. **Ordem das abas**: Atualmente "Categorias" vem primeiro, mas o usuário quer "Programação" primeiro.

### Alterações

**1. `src/components/ui/badge.tsx` — Adicionar forwardRef**

Converter o Badge para usar `React.forwardRef` para eliminar o warning do console.

**2. `src/pages/admin/AdminBanners.tsx` — Trocar ordem das abas**

Inverter a ordem dos botões de seção: "Programação" primeiro, "Categorias" segundo. Também mudar o `initialTab` default para "programacao".

**3. `src/components/admin/ProgramacaoTexto.tsx` — Corrigir fluxo de agendamento**

- No `handlePublish`, usar o resultado real do `insertGames.mutateAsync` para mostrar quantos foram inseridos vs ignorados.
- Quando `scheduleMidnight` está ON mas a data é passada, mostrar aviso claro ANTES de publicar (já existe o label, mas reforçar no botão de ação).
- No botão de publicar, mostrar "Publicar imediatamente" quando a data é passada mesmo com agendamento ON, para evitar confusão.
- Adicionar validação: se `scheduleMidnight` está ON e TODAS as datas são passadas, mostrar `toast.warning` explicando que será publicado imediatamente.

### Arquivos modificados
- `src/components/ui/badge.tsx` — forwardRef
- `src/pages/admin/AdminBanners.tsx` — ordem das abas + default
- `src/components/admin/ProgramacaoTexto.tsx` — fix mensagens de agendamento e resultado real

