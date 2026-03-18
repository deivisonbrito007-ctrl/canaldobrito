

# Ajustar Painel do Cliente + BottomNav Funcional

## Problemas Identificados

1. **BottomNav não funciona** — os botões apenas trocam estado visual local, não navegam nem filtram conteúdo
2. **Seções importantes ausentes** — `NewsReleasesSection` (Novidades) e `DailyGamesSection` (Programação completa) não estão no Index, apenas `LiveNowSection` e `BannerSections`
3. **DailyBannerCarousel não está no Index** — o hero usa dados mock em vez dos banners reais do banco
4. **Aviso no console** — `motion.div` passando ref para function components em `WatchTodaySection` e `SectionHeader`
5. **CategoryPills não filtra nada** — apenas visual
6. **Sem footer com link oculto ao admin** — o `PublicFooter` foi removido quando o BottomNav foi adicionado, perdendo o acesso discreto ao `/login`

## Mudanças

### 1. BottomNav funcional (`src/components/public/BottomNav.tsx`)
- Receber props `activeTab` e `onTabChange` do Index
- Tabs mapeiam para seções/comportamentos reais:
  - **Início** → scroll para o topo, mostra tudo
  - **Buscar** → foco no campo de busca (futuro, por agora scroll top)
  - **Play (central)** → scroll para seção "Assista Hoje"
  - **Programação** → scroll para seção `DailyGamesSection` (programação completa)
  - **Perfil** → navegar para `/login` (acesso admin discreto)

### 2. Integrar seções faltantes no Index (`src/pages/Index.tsx`)
- Substituir `HeroBanner` (mock) por `DailyBannerCarousel` (dados reais do banco)
- Adicionar `NewsReleasesSection` após LiveNowSection
- Adicionar `DailyGamesSection` (programação completa) após WatchTodaySection
- Manter `BannerSections` no final
- Adicionar IDs nas seções para scroll via BottomNav (`id="programacao"`, `id="assista"`)
- Adicionar `PublicFooter` antes do BottomNav (manter link oculto ao admin)

### 3. Corrigir warnings de ref (`src/components/public/WatchTodaySection.tsx`)
- Converter `ContentCard` e `SectionHeader` para usar `forwardRef` ou remover ref do `motion.div` wrapper

### 4. CategoryPills com filtro real (`src/components/public/CategoryPills.tsx`)
- Receber `onFilter` callback do Index
- Filtro controla visibilidade de seções (ex: "Esportes" mostra apenas LiveNow + DailyGames, "Filmes" mostra apenas WatchToday filtrado)

### 5. Navbar com logo real (`src/components/public/AppNavbar.tsx`)
- Usar a imagem `logo_brito_solutions_sem_fundo.png` em vez do ícone ▶ genérico

## Arquivos Editados

| Arquivo | Ação |
|---------|------|
| `src/pages/Index.tsx` | Integrar seções, IDs, estado de tab/filtro |
| `src/components/public/BottomNav.tsx` | Props + scroll funcional |
| `src/components/public/AppNavbar.tsx` | Logo real |
| `src/components/public/WatchTodaySection.tsx` | Fix ref warning |
| `src/components/public/CategoryPills.tsx` | Filtro funcional |

