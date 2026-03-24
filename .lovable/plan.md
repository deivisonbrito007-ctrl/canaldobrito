

# Auditoria do Dashboard Admin

## Estado Atual
O Dashboard esta funcional e bem estruturado. A auditoria revelou issues menores, sem bugs criticos.

## Issues Encontrados

### 1. Stat cards com 5 colunas em desktop -- "Jogos Hoje" fica apertado (UX)
O grid usa `grid-cols-2 sm:grid-cols-5`, mas em telas ~640px os 5 cards ficam muito estreitos. O numero grande (`text-2xl`) e cortado.

**Correcao**: Mudar para `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` para melhor distribuicao em telas medias.

### 2. Quick Actions sem acao de Config e WhatsApp
O dashboard tem atalhos para Banner, Filme, Serie, Novidade e Programacao, mas faltam Config e WhatsApp -- que sao abas do admin.

**Correcao**: Adicionar WhatsApp e Config como quick actions.

### 3. Sem "ultima atualizacao" no dashboard
O admin nao sabe quando os dados foram carregados pela ultima vez. Util para debugging.

**Correcao**: Adicionar timestamp "Atualizado as HH:MM" discreto no topo, com botao de refresh manual.

### 4. UpcomingActivations nao mostra items de filmes/series/novidades agendados
O componente so busca `banners` e `daily_games` com `publish_at`. Se no futuro outras tabelas tiverem agendamento, ficam de fora. Nao e um bug, mas uma limitacao a documentar.

### 5. Sem testes para AdminDashboard
Nenhum teste unitario existe.

**Correcao**: Criar testes basicos verificando render dos stat cards, greeting, e estado de loading.

## Melhorias de UI Propostas

### 6. Saude do conteudo -- itens sem genero
Adicionar um alerta discreto no dashboard mostrando quantos filmes/series/novidades estao sem genero, com link direto para a aba correspondente. Isso da visibilidade ao admin sobre conteudo incompleto.

### 7. Stat cards com hover effect
Adicionar `hover:scale-[1.02] hover:border-opacity-40` para feedback visual ao passar o mouse.

## Arquivos modificados
- `src/pages/admin/AdminDashboard.tsx` -- grid responsivo, quick actions extras, timestamp refresh, alerta de conteudo incompleto, hover nos cards
- `src/pages/admin/__tests__/AdminDashboard.test.tsx` -- testes basicos de render

