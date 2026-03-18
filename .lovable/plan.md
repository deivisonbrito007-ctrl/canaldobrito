

# Plano: Sistema Completo "Brito Solutions - Programação do Dia"

## Resumo

Reconstruir o sistema inteiro mantendo a infraestrutura existente (auth, banners) e adicionando: jogos do dia com badge AO VIVO, filmes e séries via TMDB, painel admin com sub-rotas, configurações, e página pública redesenhada.

---

## 1. Migrações SQL

### Tabela `daily_banner`
Nova tabela simplificada para banner do dia (substitui uso atual da tabela `banners` para o hero):
- `id`, `image_url`, `date` (unique), `active`, `created_at`

### Tabela `games` (recriar esquema)
Dropar colunas legadas (api_source, external_id, sport, etc.) e simplificar:
- `id`, `date` (date), `time` (time), `home_team`, `away_team`, `home_logo`, `away_logo`, `competition`, `channel`, `active`, `created_at`

### Tabela `featured_movies`
- `id`, `tmdb_id` (int unique), `title`, `poster_url`, `overview`, `rating`, `year`, `genre`, `added_by` (uuid nullable), `active`, `created_at`

### Tabela `featured_series`
- Mesma estrutura de `featured_movies`

### Tabela `settings`
- `id`, `key` (text unique), `value` (text), `updated_at`
- Inserir defaults: `whatsapp` = `5511940759046`, `tmdb_api_key` = vazio

### RLS
- Leitura pública em todas as tabelas de conteúdo
- CRUD admin via `has_role()` para todas

---

## 2. Estrutura de Arquivos

```text
src/
├── pages/
│   ├── Index.tsx              (página pública redesenhada)
│   ├── Login.tsx              (manter)
│   ├── Admin.tsx              (layout com sidebar/tabs)
│   ├── admin/
│   │   ├── AdminProgramacao.tsx  (banner do dia + jogos CRUD)
│   │   ├── AdminFilmes.tsx       (busca TMDB + grid)
│   │   ├── AdminSeries.tsx       (busca TMDB + grid)
│   │   └── AdminConfiguracoes.tsx (settings form)
│   └── NotFound.tsx
├── components/
│   ├── public/
│   │   ├── PublicHeader.tsx
│   │   ├── HeroBanner.tsx
│   │   ├── GamesSection.tsx
│   │   ├── GameCard.tsx        (escudos, badge competição, AO VIVO)
│   │   ├── MovieCard.tsx
│   │   ├── SeriesCard.tsx
│   │   ├── PublicFooter.tsx
│   │   └── WhatsAppShareButton.tsx
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── GameForm.tsx
│   │   ├── GamesList.tsx
│   │   ├── TMDBSearchGrid.tsx
│   │   └── SettingsForm.tsx
│   └── ui/ (manter)
├── hooks/
│   ├── useGames.ts
│   ├── useMovies.ts
│   ├── useSeries.ts
│   ├── useSettings.ts
│   ├── useDailyBanner.ts
│   └── useBanners.ts (remover ou adaptar)
```

---

## 3. Página Pública (`/`)

- **PublicHeader**: Logo + data atual (sticky, dark)
- **HeroBanner**: Busca `daily_banner` do dia, exibe imagem hero full-width com aspect-ratio 16:9
- **GamesSection**: Busca `games` WHERE `date = today` AND `active = true`, ordena por `time`. Contador. Estado vazio elegante
- **GameCard**: Layout com escudos lado a lado, nomes dos times, badge de competição colorido (Brasileirão=verde, Champions=azul, Copa do Brasil=amarelo, Libertadores=verde escuro), horário em verde grande, canal. Badge "AO VIVO" pulsante se horário atual está entre `time` e `time + 2h`
- **Filmes em Destaque**: Grid horizontal scrollável de `featured_movies` ativos com poster, título, rating
- **Séries em Destaque**: Mesmo padrão
- **PublicFooter**: WhatsApp (11) 94075-9046, botão compartilhar
- **WhatsAppShareButton**: Abre wa.me com mensagem formatada incluindo URL atual

---

## 4. Painel Admin (`/admin/*`)

### Layout
- Sidebar lateral (desktop) / bottom tabs (mobile) com 4 seções: Programação, Filmes, Séries, Configurações
- Rotas: `/admin/programacao`, `/admin/filmes`, `/admin/series`, `/admin/configuracoes`
- `/admin` redireciona para `/admin/programacao`

### Programação (`/admin/programacao`)
- **Banner do dia**: Upload de imagem, preview, ativar/desativar, vinculado à data de hoje
- **Jogos**: Formulário (horário, time casa + escudo URL, time visitante + escudo URL, competição select, canal, toggle ativo). Lista com editar/excluir/duplicar/ativar. Botão "Limpar programação do dia" (remove jogos do dia + desativa banner)

### Filmes (`/admin/filmes`)
- Campo de busca que consulta TMDB via edge function
- Grid de resultados com poster, título, ano, sinopse no hover
- Botão "Adicionar" salva em `featured_movies`
- Lista dos filmes adicionados com toggle ativo e remover
- Aba "Lançamentos" que puxa `/movie/now_playing`

### Séries (`/admin/series`)
- Mesmo padrão de filmes, usando endpoint `/search/tv` e `/tv/popular`

### Configurações (`/admin/configuracoes`)
- Form para: WhatsApp, TMDB API Key
- Salva na tabela `settings`

---

## 5. Edge Function: TMDB Proxy

Criar `supabase/functions/tmdb-proxy/index.ts`:
- Recebe `action` (search_movie, search_tv, now_playing, popular_tv) e `query`
- Busca a `tmdb_api_key` da tabela `settings`
- Faz proxy para API do TMDB
- Retorna resultados formatados

Isso evita expor a chave TMDB no frontend.

---

## 6. Identidade Visual

- Fundo: `#0a0a0a` (ajustar CSS vars)
- Cards: `#1a1a1a`
- Cor principal: `#22c55e` (substituir azul atual por verde)
- Hover com brilho verde
- Manter fontes Inter + Space Grotesk

---

## 7. Componentes de UX

- Skeleton loading em todas as seções
- Lazy load de imagens (`loading="lazy"`)
- Fallback para imagens quebradas (placeholder)
- Mobile-first com grid responsivo
- Animações com framer-motion

---

## Ordem de Implementação

1. Migração SQL (todas as tabelas + RLS)
2. Atualizar CSS vars (tema verde)
3. Hooks de dados (useGames, useMovies, useSeries, useSettings, useDailyBanner)
4. Edge function TMDB proxy
5. Componentes públicos (Header, HeroBanner, GameCard, MovieCard, SeriesCard, Footer)
6. Página pública Index.tsx
7. Componentes admin (Layout, Sidebar, Forms, Lists, TMDBSearch)
8. Páginas admin (Programacao, Filmes, Series, Configuracoes)
9. Atualizar rotas no App.tsx
10. Limpar arquivos legados (BannerCarousel antigo, InfoSection, ShareFAB)

