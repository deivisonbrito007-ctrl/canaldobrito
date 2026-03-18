

# Plano: Redesign Completo do Painel Admin

## Resumo

Transformar o painel admin com visual glassmorphism dark premium, dashboard com stats, header profissional, navegação colorida por aba, e micro-interações. Manter toda lógica existente, apenas redesenhar componentes.

## Arquivos Afetados

| Ação | Arquivo |
|------|---------|
| Reescrever | `src/pages/AdminLayout.tsx` — Header PRO, dashboard stats, navegação colorida |
| Reescrever | `src/pages/admin/AdminBanners.tsx` — Visual glassmorphism, badges, estados vazios premium |
| Reescrever | `src/pages/admin/AdminFilmes.tsx` — Cards premium, rating colorido, busca redesenhada |
| Reescrever | `src/pages/admin/AdminSeries.tsx` — Mesmo padrão dos filmes |
| Reescrever | `src/pages/admin/AdminNovidades.tsx` — Feed visual, badges coloridos |
| Reescrever | `src/pages/admin/AdminConfiguracoes.tsx` — Cards por seção, inputs flutuantes |
| Editar | `src/index.css` — Scrollbar personalizada, novas utilidades glass/glow |
| Editar | `src/App.tsx` — Rota /admin redireciona para /admin/dashboard |
| Criar | `src/pages/admin/AdminDashboard.tsx` — Página inicial com stats e ações rápidas |

## 1. AdminLayout.tsx — Header + Nav Premium

**Header redesenhado:**
- Logo maior + badge "PRO" verde ao lado
- Breadcrumb dinâmico (Admin > NomeDaAba)
- Botão "Ver Site" com borda verde e ícone ExternalLink
- Avatar do usuário com dropdown (email + logout)
- Background: `bg-[#0a0a0f]/95 backdrop-blur-xl`

**Navegação por abas:**
- 6 abas: Dashboard, Banners, Filmes, Séries, Novidades, Config
- Cada aba com cor própria: Dashboard (branco), Banners (verde), Filmes (azul), Séries (roxo), Novidades (amber), Config (cinza)
- Aba ativa: fundo gradiente da cor + borda inferior 3px + glow sutil
- Badge de contagem em cada aba (fetched via hooks existentes)
- Ícones maiores (h-5 w-5)

**Body:**
- Fundo gradiente: `bg-gradient-to-b from-[#0a0a0f] to-[#0d1117]`
- Container com max-w-7xl centralizado

## 2. AdminDashboard.tsx — Nova página inicial

**Linha de stats (5 cards):**
- Data atual (formatada PT-BR com date-fns: "Quarta, 18 de Março de 2026")
- Banners ativos (verde, ícone Image)
- Filmes cadastrados (azul, ícone Film)
- Séries cadastradas (roxo, ícone Clapperboard)
- Novidades (amber, ícone Sparkles)

Cada card:
- `bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.06]`
- Ícone grande colorido à esquerda
- Número grande + label pequeno
- Animação fade-in staggered
- Contador animado de 0 ao valor real (useEffect + requestAnimationFrame)

**Botões de ação rápida:**
- 4 botões grandes: "+ Novo Banner" (verde), "+ Novo Filme" (azul), "+ Nova Série" (roxo), "+ Nova Novidade" (amber)
- Cada botão navega para a aba correspondente
- Hover com glow da cor respectiva

Dados obtidos via hooks existentes: `useAllBanners`, `useAllMovies`, `useAllSeries`, `useAllNewsReleases`.

## 3. Todas as Abas Admin — Glass Cards

Padrão visual unificado para todos os cards:
- Background: `rgba(255,255,255,0.03)` → `bg-white/[0.03]`
- Backdrop: `backdrop-blur-[20px]`
- Borda: `border border-white/[0.06]`
- Hover: `hover:border-white/[0.12] hover:bg-white/[0.05]`
- Transição: `transition-all duration-300`

**AdminBanners:** Manter lógica, aplicar glass cards, badges ATIVO/INATIVO mais visíveis, categorias como pills coloridas.

**AdminFilmes / AdminSeries:** Manter lógica TMDB, redesenhar cards de resultado com rating colorido (verde >7, amarelo >5, vermelho <5), busca com input maior.

**AdminNovidades:** Manter lógica, badges maiores e mais coloridos.

**AdminConfiguracoes:** Organizar em cards por seção (Identidade, API, Sobre), inputs com styling glass.

## 4. index.css — Novas utilidades

```css
/* Scrollbar escura personalizada */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

.glass-panel {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.06);
}
```

## 5. App.tsx — Rota Dashboard

- Adicionar rota `/admin/dashboard` com `AdminDashboard`
- Redirecionar `/admin` index para `/admin/dashboard`

## Escopo NÃO Incluído (para manter viável)

- Framer Motion (evitar nova dependência pesada — usar CSS animations)
- Drag and drop para reordenar
- Rich text editor
- Confirmação modal customizada (mantém `confirm()` por ora)
- Notificações com sino (sem backend para isso)
- Contador animado complexo — usar transição CSS simples

## Resultado

Painel admin com visual glassmorphism premium, dashboard com métricas, navegação colorida por seção, scrollbar escura, e transições suaves — tudo usando Tailwind + CSS animations sem dependências extras.

