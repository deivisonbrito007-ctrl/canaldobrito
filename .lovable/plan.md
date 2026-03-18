

# Mover Programação para aba exclusiva no BottomNav

## O que muda

Atualmente a `DailyGamesSection` (programação de jogos) aparece inline na home quando o filtro "sports" está ativo. O objetivo é removê-la do scroll da home e exibi-la **somente** quando o usuário toca na aba "Programação" no BottomNav.

## Plano

### 1. Index.tsx — Renderização condicional por aba

- Remover a `DailyGamesSection` do conteúdo principal da home (linhas 84-88)
- Remover o scroll-to do `handleTabChange` para "schedule" (linha 30-31)
- Quando `activeTab === "schedule"`, trocar o conteúdo do `<main>` inteiro por uma view dedicada de Programação (título "Programação" + `<DailyGamesSection />` em tela cheia)
- Quando `activeTab === "home"` (ou qualquer outro), mostrar o conteúdo normal da home

### 2. Visual da aba Programação

- Header simples: título "Programação" com ícone CalendarDays
- `<DailyGamesSection />` renderizado abaixo, ocupando toda a área
- Mesmos ambient blobs e grain overlay do fundo

### Sugestão extra
- Na aba "Buscar" (search), futuramente podemos adicionar uma barra de busca real em vez de só scroll pro topo

### Arquivos modificados
- `src/pages/Index.tsx` — lógica condicional de aba + remover DailyGames da home

