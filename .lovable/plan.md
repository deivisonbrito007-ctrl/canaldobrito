

# Criar aba "Destaques" no BottomNav para Filmes e Séries

## O que muda

- Adicionar nova aba **"Destaques"** no BottomNav (entre Início e Programação) com ícone `Star` ou `Film`
- Remover `WeeklyMoviesSection` e `WeeklySeriesSection` da home
- Renderizar ambas as seções dentro da nova aba dedicada

## Arquivos modificados

### 1. `src/components/public/BottomNav.tsx`
- Adicionar item `{ id: "highlights", label: "Destaques", icon: Star }` no array `navItems`
- Importar ícone `Star` do lucide-react

### 2. `src/pages/Index.tsx`
- Adicionar condição `activeTab === "highlights"` no `<main>` que renderiza uma view dedicada com header "Destaque da Semana" + `<WeeklyMoviesSection />` + `<WeeklySeriesSection />`
- Remover as linhas 83-89 (WeeklyMoviesSection e WeeklySeriesSection) do conteúdo da home
- Adicionar scroll to top no `handleTabChange` para a aba "highlights"

### Sugestão
- Adicionar transição animada (fade) ao trocar entre abas para uma experiência mais fluida

