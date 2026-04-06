

## Auditoria da Aba Início + Testes + Sugestões de Melhoria

### Status dos Testes
Todos os **121 testes passam** (13 arquivos de teste, 0 falhas).

### Auditoria do Fluxo da Aba Início

Analisei todos os componentes renderizados na aba Início:

| Componente | Status | Observação |
|---|---|---|
| AppNavbar | OK | Live badge funcional, CTA "Assine já" presente |
| Hero | OK | Stats (ao vivo, hoje, canais) com tick de 60s |
| CategoryIconsCarousel | OK | Marquee infinito com pause no touch |
| LiveNowHero | OK | Grid vertical, expand/collapse, link "Ver todos" |
| NovidadesCard | OK | Carousel com swipe, trailer, detail sheet |
| PromoStrip | OK | CTA para /assinar |
| BannerSections | OK | Lazy loaded, categorias filtradas |
| PublicFooter | OK | Login secreto via long-press |
| BottomNav | OK | 3 abas com indicador ativo |
| PullToRefresh | OK | Haptic feedback, invalidação de queries |

### Problemas Encontrados

**1. CategoryIconsCarousel sem ação nos itens**
Os chips de categoria (Futebol, Basquete, etc.) são puramente decorativos (`cursor-default`). Clicar neles não faz nada. Seria mais útil que filtrassem ou navegassem para a aba correspondente.

**2. Hero mostra "Bem-vindo de volta" para todos**
O texto "Bem-vindo de volta" aparece mesmo para visitantes novos. Não há distinção entre primeiro acesso e retorno.

**3. Seção "Ao Vivo" some completamente quando não há jogos**
Quando `totalLive === 0`, `LiveNowHero` retorna `null`. Isso causa um salto visual — o usuário não sabe que existe uma seção de jogos ao vivo. Melhor mostrar um empty state compacto.

---

### Plano de Melhorias

#### Passo 1 — Empty state para "Ao Vivo" na Home
Quando não há jogos ao vivo, mostrar um card compacto com texto "Nenhum jogo ao vivo agora" e link para a aba Programação, em vez de esconder a seção completamente.

**Arquivo:** `src/components/public/LiveNowHero.tsx`
- Substituir `if (!isLoading && totalLive === 0) return null;` por um card minimalista com ícone de TV e botão "Ver programação".

#### Passo 2 — Tornar CategoryIconsCarousel interativo
Clicar em "Futebol", "Basquete", etc. navega para a aba Programação com o filtro de esporte pré-selecionado. "Filmes" e "Séries" navegam para a aba Destaques.

**Arquivo:** `src/components/public/CategoryIconsCarousel.tsx`
- Adicionar `onClick` a cada chip que dispara `nav-tab-change` com payload incluindo filtro de esporte.

#### Passo 3 — Ajustar texto do Hero
Trocar "Bem-vindo de volta" por "Ao vivo agora" quando há jogos ao vivo, mantendo "Bem-vindo" como fallback genérico (sem "de volta").

**Arquivo:** `src/components/public/Hero.tsx`

#### Passo 4 — Rodar testes
Executar `vitest run` para confirmar 0 regressões.

---

### Detalhes técnicos

- O `CategoryIconsCarousel` usará `window.dispatchEvent(new CustomEvent("nav-tab-change", { detail: tabId }))` para navegar, mantendo consistência com o padrão existente no `BottomNav`.
- O empty state do `LiveNowHero` será um `<section>` com altura fixa (~80px) para evitar layout shift.
- As alterações não afetam testes existentes pois nenhum teste cobre `CategoryIconsCarousel` ou o estado vazio do `LiveNowHero`.

