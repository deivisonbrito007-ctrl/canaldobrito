

# Melhorias — Banners por Categoria e Programação por Texto

## Problemas atuais

**Banners por Categoria:**
- O campo "Agendar para" fica misturado com o upload, sem separação visual clara
- Sem indicação de contagem por status (agendados vs ativos vs inativos)
- Cards de banner não mostram a categoria visualmente

**Programação por Texto:**
- O formulário de entrada, toggle de agendamento, textarea e botões ficam todos empilhados sem hierarquia visual
- Preview dos jogos usa grid genérico sem agrupamento por data
- Não há resumo visual claro do que será publicado vs agendado
- Botões de ação no final ficam perdidos

## Melhorias propostas

### 1. Reestruturar seção de Banners por Categoria

**Reorganizar o header do painel:**
- Separar zona de upload (PasteZone + botão Upload) da zona de agendamento
- Agendamento fica em um bloco destacado com borda amber, similar ao toggle de meia-noite da programação
- Adicionar contadores separados: "X ativos · Y agendados · Z inativos"

**Melhorar cards de banner:**
- Mostrar data/hora de agendamento formatada em português de forma mais legível
- Adicionar badge de countdown simples ("Publica em 3h" ou "Publica amanhã")

### 2. Reestruturar Programação por Texto

**Separar em 3 etapas visuais claras com numeração:**
- **Etapa 1** — Configuração: data padrão + toggle agendamento meia-noite (lado a lado em desktop)
- **Etapa 2** — Texto: textarea com placeholder + botões Processar/Limpar/Exemplo
- **Etapa 3** — Preview: aparece só após processar, com jogos agrupados por data

**Melhorar Preview:**
- Agrupar jogos por data com header de data separado (ex: "19/03/2026 — 5 jogos")
- Barra de resumo fixa no topo do preview: "Total: 8 | Selecionados: 6 | Modo: Agendado 00:00"
- Botões de ação (Publicar/Republicar) dentro de uma barra sticky no bottom do preview
- Botão "Selecionar todos" / "Desmarcar todos"

### 3. Melhorar DailyGamesManager

- Adicionar badge de status para jogos agendados (publish_at no futuro)
- Mostrar contagem de agendados separadamente

## Arquivos a editar

| Arquivo | Mudanças |
|---------|----------|
| `AdminBanners.tsx` | Reestruturar header de categorias, separar upload de agendamento, melhorar contadores e badges |
| `ProgramacaoTexto.tsx` | Layout em 3 etapas, agrupar preview por data, barra de resumo, selecionar/desmarcar todos, sticky actions |
| `DailyGamesManager.tsx` | Badge de agendado nos jogos com publish_at |

