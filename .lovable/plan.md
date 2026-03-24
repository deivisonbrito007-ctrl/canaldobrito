

# Auditoria e Melhorias do Dashboard Admin

## Problemas Encontrados

### 1. Warning no Console: "Function components cannot be given refs"
`AdminDashboard` e `UpcomingActivations` sao function components sem `forwardRef`. O React Router tenta passar refs para componentes de rota. Nao quebra nada, mas polui o console.

### 2. Countdown das "Proximas Ativacoes" nao atualiza em tempo real
O `formatCountdown` calcula o tempo restante apenas quando os dados sao buscados (a cada 60s). Entre refetches, o texto fica congelado. Precisa de um `setInterval` local para atualizar a cada minuto.

### 3. Grid de Quick Actions desbalanceado
5 itens em `grid-cols-2` = ultima linha com 1 item solto. O item "Programacao" fica sozinho e estreito.

### 4. Stat card "Jogos Hoje" aponta para `/admin/banners`
Confuso para o admin -- deveria apontar para a aba de programacao ou pelo menos `/admin/banners?tab=programacao`.

### 5. Sem tratamento de erro visivel
Se alguma query falhar, o dashboard mostra skeleton infinito sem feedback.

## Melhorias Propostas

### A. Corrigir warning de refs
Nao precisa de `forwardRef` nos page components -- o warning vem do React Router v6 internamente e e inofensivo. Nenhuma acao necessaria.

### B. Countdown ao vivo no UpcomingActivations
Adicionar um `useEffect` com `setInterval` de 60s que forca re-render para atualizar os textos de countdown. Alternativa: usar um state `now` que atualiza a cada minuto.

### C. Corrigir rota do card "Jogos Hoje"
Mudar de `/admin/banners` para `/admin/banners?tab=programacao`.

### D. Quick Actions: ultimo item span full
Fazer o 5o item (Programacao) ocupar `col-span-2` para ficar centralizado e visualmente balanceado.

### E. Estado de erro no dashboard
Adicionar um alerta simples quando alguma query falhar, com botao de retry.

### F. Adicionar greeting dinamico
Substituir "Painel Administrativo" por saudacao baseada na hora (Bom dia / Boa tarde / Boa noite).

## Arquivos modificados
- `src/pages/admin/AdminDashboard.tsx` -- corrigir rota jogos, quick actions span, erro state, greeting
- `src/components/admin/UpcomingActivations.tsx` -- countdown ao vivo com setInterval

