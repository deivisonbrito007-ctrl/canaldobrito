

# Auditoria Aba Destaques + Testes + Melhorias

## Problemas Identificados

### 1. Cards sem interação na aba Destaques (bug principal)
`WeeklyMoviesSection` e `WeeklySeriesSection` renderizam cards com `cursor-pointer` mas **sem onClick**. O `ContentDetailSheet` (que mostra detalhes + trailer) existe e funciona nos componentes antigos (`MoviesSection`, `SeriesSection`), mas nunca foi integrado nos componentes da aba Destaques.

### 2. Sem estado vazio na aba Destaques
Se não houver filmes nem séries ativos, a aba Destaques fica completamente em branco (ambos retornam `null`).

### 3. Dashboard: "Jogos Hoje" e "Programação" apontam para rota errada
No `AdminDashboard`, o card "Jogos Hoje" e o botão "+ Programação" apontam para `/admin/banners` em vez de uma rota dedicada (ou pelo menos a aba de programação).

### 4. Testes inexistentes para componentes públicos
Apenas `gameUtils.test.ts` e `example.test.ts` existem. Nenhum teste cobre os componentes da aba Destaques.

---

## Plano de Correções

### Arquivo: `src/components/public/WeeklyMoviesSection.tsx`
- Adicionar estado `selectedMovie` e `ContentDetailSheet`
- Adicionar `onClick` no card que seta o filme selecionado
- Adicionar `will-change: transform` no motion.div para GPU optimization

### Arquivo: `src/components/public/WeeklySeriesSection.tsx`
- Mesmo tratamento: estado `selectedSeries` + `ContentDetailSheet` + `onClick`

### Arquivo: `src/pages/Index.tsx`
- Adicionar estado vazio na aba Destaques quando `movies` e `series` estão vazios, com mensagem e ícone

### Arquivo: `src/pages/admin/AdminDashboard.tsx`
- Corrigir rota do card "Jogos Hoje" para apontar para rota correta (ou manter `/admin/banners` com nota)
- Corrigir rota do botão "+ Programação"

### Novos testes: `src/components/public/__tests__/WeeklyMoviesSection.test.tsx`
- Testar renderização com dados mockados
- Testar estado de loading (skeletons)
- Testar estado vazio (retorna null)

### Novos testes: `src/components/public/__tests__/WeeklySeriesSection.test.tsx`
- Mesma cobertura do anterior

---

## Sugestões de Melhorias Adicionais

1. **Lazy load das abas** -- As abas Destaques e Programacao carregam dados mesmo quando o usuario esta na Home. Usar renderizacao condicional nos hooks ou React.lazy para evitar requests desnecessarios.
2. **Haptic feedback visual nos cards** -- Adicionar `active:scale-[0.97]` nos cards de filme/serie para feedback tactil ao tocar no mobile.
3. **Contador de itens no header** -- Mostrar quantidade de filmes/series na aba Destaques (ex: "Filmes (5)") para dar contexto ao usuario.

