

# Auditoria e Melhorias do Painel Admin

## Resultado da Auditoria

Analisei todos os 7 modulos admin: Dashboard, Banners, Filmes, Series, Novidades, WhatsApp e Configuracoes.

### Problemas Encontrados

**1. Dashboard sem indicador de conteudo total do site**
O dashboard mostra contagens individuais mas nao tem um resumo visual do total de conteudo ativo vs inativo (ratio de saude geral). Falta uma barra de progresso ou indicador percentual.

**2. Dashboard sem indicador de banners expirados**
Banners com `expires_at` no passado continuam contados como "ativos" nos stats. Nao ha alerta para banners expirados que precisam ser removidos.

**3. Quick Actions sem feedback visual de destino**
Os botoes de acoes rapidas todos dizem "+ Label" mas nao indicam se a secao correspondente tem itens pendentes ou alertas.

**4. Falta "Atividade Recente" no dashboard**
Nao ha visibilidade sobre o que foi adicionado/modificado recentemente. O admin precisa entrar em cada secao para saber o que mudou.

**5. Falta busca global no admin**
Nao existe forma de buscar conteudo (filmes, series, novidades) sem entrar em cada secao individualmente.

**6. Stats cards sem indicador de tendencia**
Os cards mostram total e ativos mas nao indicam se houve mudanca recente (ex: "+2 esta semana").

---

## Plano de Melhorias (4 areas)

### 1. Barra de Saude do Conteudo no Dashboard
- Adicionar uma barra de progresso mostrando `% de conteudo ativo` (total ativos / total geral)
- Cores: verde (>80%), amarelo (50-80%), vermelho (<50%)
- Posicionar entre o card de data e o grid de stats

### 2. Alerta de Banners Expirados
- No `missingGenre` useMemo, adicionar verificacao de banners com `expires_at` no passado que ainda estao `active`
- Mostrar alerta ambar linkando para `/admin/banners`

### 3. Atividade Recente no Dashboard
- Criar secao "Atividade Recente" que mostra os ultimos 5 itens adicionados (qualquer tipo: banner, filme, serie, novidade)
- Ordenar por `created_at` descendente, mostrar tipo + titulo + data relativa ("ha 2h")
- Usar dados ja carregados (banners, movies, series, news) — sem query extra

### 4. Resumo Visual nos Stats Cards
- Adicionar mini indicador nos stats cards mostrando ratio ativo/total como micro barra de progresso abaixo do numero
- Ajuda a visualizar rapidamente quais secoes precisam de atencao

### Arquivos modificados
- `src/pages/admin/AdminDashboard.tsx` (saude do conteudo, banners expirados, atividade recente, micro barras)

### Detalhes tecnicos
- Tudo derivado dos dados ja carregados via React Query (sem queries adicionais)
- Atividade recente: merge de arrays com `created_at`, sort descrescente, slice(0, 5)
- Banners expirados: `banners.filter(b => b.active && b.expires_at && new Date(b.expires_at) < new Date())`
- Micro barra: div com `width: ${(actives/total)*100}%` e cores condicionais

