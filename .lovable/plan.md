## Diagnóstico (confirmado no código)

O print corresponde ao `DailyGamesManager` (lista "Jogos Publicados"), usado na tela de Programação/Banners do admin.

1. **Linha do jogo quebrada** — `src/components/admin/DailyGamesManager.tsx:498-632`: cada jogo é uma única linha `flex` horizontal com checkbox + bloco de texto + **6 controles** (select de esporte de 110px, varinha, switch, duplicar, editar, excluir). Isso soma ~250px fixos; em 384px o bloco de texto é comprimido e os controles ficam sobrepostos ao título/horário — exatamente o efeito do print.
2. **Barra de ações do dia empilhada feia** — `:393-417`: 6 botões *ghost* com `flex-wrap` viram uma coluna desalinhada ("Arquivar Dia / Limpar Dia / Re-classificar / Verificar duplicatas").
3. Textos em `text-[9px]/[10px]` (badges, canais) abaixo do mínimo legível no mobile.

## O que vou fazer

### 1. Reestruturar o card do jogo (mobile-first)
- No mobile: layout em **duas linhas** dentro de um card — topo com checkbox + título/badges + horário; base com uma faixa de ações separada por borda (`h-11` cada, ícones com `aria-label`).
- Select de esporte sai da faixa de ações no mobile e vira **badge clicável** (abre o mesmo Select) — libera ~110px.
- Ações secundárias (duplicar, re-classificar, excluir) vão para um **menu "⋯"**; ficam visíveis diretas no `sm:` para cima.
- `min-w-0` + `break-words` no bloco de texto; sem `truncate` agressivo em título de evento único.

### 2. Barra de ações do dia
- Data + "Adicionar" ficam sempre visíveis; **Arquivar / Limpar / Re-classificar / Verificar duplicatas** entram num `DropdownMenu` "Ações do dia" no mobile, e permanecem como botões no desktop.
- Barra de seleção em massa fica *sticky* no topo da lista, com contagem e botões `h-11`.

### 3. Sweep no restante do admin
Passagem por `AdminLayout`, `AdminDashboard`, `AdminBanners`, `AdminFilmes/Series/Novidades`, `AdminWhatsApp`, `AdminCanaisLogos`, `AdminAnalytics`, `AdminAudit`, `AdminConfiguracoes`, `ProgramacaoTexto` para:
- eliminar linhas de ação horizontais que estouram/sobrepõem (mesmo padrão do item 1);
- promover `text-[9px]/[10px]` para `text-[11px]` mínimo em textos informativos;
- garantir `min-h-11` em tudo clicável e `min-w-0` em containers de texto;
- verificar `Select`/`Popover`/`Dialog` acima do conteúdo (z-index) e `SelectTrigger` com largura fluida.

### 4. Melhorias de funcionalidade (baixo risco)
- **Filtro/busca por time ou competição** na lista de jogos (hoje só há filtro por esporte).
- **Contador de resultados** e estado vazio explícito quando o filtro não retorna nada (`AdminEmptyState`).
- **Toast com desfazer** ao alternar ativo/inativo e ao duplicar para amanhã.
- Confirmação de exclusão mantendo o nome do jogo no diálogo (hoje é genérica).

### 5. Validação
- Playwright em 320px / 384px / 768px nas rotas do admin: checar `scrollWidth === clientWidth`, medir todos os elementos clicáveis (≥44px) e detectar sobreposição de retângulos dentro dos cards de jogo.
- Rodar a suíte de testes existente (`DailyGamesManager.singleEvent`, `AdminBanners`, `AdminWhatsApp`, etc.) para garantir que nada regride.

## Detalhes técnicos
- Sem alteração de banco, hooks ou regras de negócio — apenas apresentação, mais o filtro de texto local e os toasts de desfazer (client-side, reaproveitando `updateGame`/`insertGames` já existentes).
- Componentes reutilizados: `DropdownMenu` (shadcn, já no projeto), `AdminEmptyState`, tokens semânticos do design system — nenhuma cor hardcoded.
- Convenções seguidas conforme `docs/admin-refactor.md`; documento atualizado no fim com o novo padrão de card de lista.

## Sugestões extras (fora do escopo, se quiser)
- `content-visibility: auto` nas listas longas do admin (dias com 40+ jogos) para acelerar o render no mobile.
- Ações em massa também para "arquivar" e "mover para outro dia".
