

# Plano Consolidado: Implementação Completa

Este é o plano final unificado. O fluxo do admin leva menos de 2 minutos: colar texto → processar → conferir → publicar → subir banner.

## Migration: Tabela `daily_games`

```sql
CREATE TABLE public.daily_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  home_team text NOT NULL,
  away_team text NOT NULL,
  competition text NOT NULL DEFAULT '',
  competition_detail text DEFAULT '',
  game_time time NOT NULL,
  channels text[] DEFAULT '{}',
  is_live boolean NOT NULL DEFAULT false,
  is_womens boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read" ON public.daily_games FOR SELECT TO public USING (true);
CREATE POLICY "Admins insert" ON public.daily_games FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update" ON public.daily_games FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete" ON public.daily_games FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
```

## Arquivos a Criar/Editar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Criar | `src/hooks/useDailyGames.ts` | CRUD hook: query por data, insert batch, update, delete |
| Criar | `src/components/admin/ProgramacaoTexto.tsx` | Textarea + parser + preview + publicar |
| Criar | `src/components/admin/DailyGamesManager.tsx` | Lista jogos publicados, edição inline, adicionar avulso |
| Criar | `src/components/public/DailyGamesSection.tsx` | Seção pública: ao vivo + programação agrupada + filtros |
| Criar | `src/components/public/CategoryBar.tsx` | Barra sticky de navegação por seção |
| Criar | `src/components/public/ContentDetailSheet.tsx` | Bottom sheet com trailer YouTube para filmes/séries |
| Criar | `src/hooks/useGames.ts` | Hook para tabela `games` existente (se ainda necessário) |
| Editar | `src/pages/admin/AdminBanners.tsx` | Adicionar aba "📋 Programação" |
| Editar | `supabase/functions/tmdb-proxy/index.ts` | Adicionar `movie_videos` e `tv_videos` |
| Reescrever | `src/pages/Index.tsx` | Nova estrutura com todas as seções |
| Reescrever | `src/components/public/PublicHeader.tsx` | Header compacto glassmorphism |
| Reescrever | `src/components/public/DailyBannerCarousel.tsx` | Hero 60vh |
| Reescrever | `src/components/public/MoviesSection.tsx` | Grid 2col, onClick abre detail sheet |
| Reescrever | `src/components/public/SeriesSection.tsx` | Grid 2col, onClick abre detail sheet |
| Reescrever | `src/components/public/NewsReleasesSection.tsx` | Cards maiores, scroll snap |
| Reescrever | `src/components/public/PublicFooter.tsx` | Sem botão admin |
| Reescrever | `src/components/public/WhatsAppFab.tsx` | 48px, transparente ao scrollar |
| Editar | `src/index.css` | Animações: border-pulse-red, spin-slow, hide-scrollbar |

## Fluxo Admin (< 2 min/dia)

1. **Aba "📋 Programação"** no AdminBanners — terceiro toggle ao lado de "Banners do Dia" e "Por Categoria"
2. **ProgramacaoTexto**: Textarea grande → cola texto → clica "Processar Texto"
3. **Parser** detecta blocos: ` x ` (times), `🏆` (competição + horário), `📺` (canais), `📅` (data), `(F)` (feminino)
4. **Preview**: Grid de mini-cards com checkbox, contagem ("25 jogos detectados"), botão editar inline
5. **"Publicar Todos"**: Insere batch no `daily_games`, toast de sucesso
6. **DailyGamesManager** abaixo: lista jogos publicados, edição inline, excluir, toggle ativo, adicionar avulso, "Limpar e Republicar"
7. Banner de imagem continua no fluxo normal (aba "Banners do Dia")

## Página Pública — Estrutura Final

```
PublicHeader (sticky, glassmorphism, logo + data PT-BR)
DailyBannerCarousel (hero 60vh, overlay gradiente)
CategoryBar (sticky: Todos | ⚽ Esportes | 🎬 Filmes | 📺 Séries | 🔥 Novidades)
DailyGamesSection (id="esportes")
  ├─ "🔴 Ao Vivo" (condicional, borda pulse vermelha, confetti no primeiro)
  ├─ Filtro por canal (sticky pills)
  └─ Programação agrupada (Manhã/Noite/Madrugada)
NewsReleasesSection (id="novidades")
MoviesSection (id="filmes") → onClick → ContentDetailSheet com trailer
SeriesSection (id="series") → onClick → ContentDetailSheet com trailer
PublicFooter (sem admin, easter egg /login no ©)
WhatsAppFab (48px, fade ao scrollar)
```

## Animações nos Cards de Jogos

- Stagger entrada: `framer-motion` delay `index * 0.05`
- AO VIVO: `animate-border-pulse-live` (CSS keyframes vermelho)
- Tap expande card (mostra canais detalhados) via `AnimatePresence`
- Relógio girando lento nos ao vivo (`animate-spin-slow 3s`)
- Polling 60s para detectar transição próximo→ao vivo
- Confetti sutil (`canvas-confetti`) no primeiro jogo ao vivo do dia (uma vez via `useRef`)

## tmdb-proxy — Novos Cases

```typescript
case "movie_videos":
  url = `${BASE}/movie/${query}/videos?language=pt-BR&api_key=${apiKey}`;
  break;
case "tv_videos":
  url = `${BASE}/tv/${query}/videos?language=pt-BR&api_key=${apiKey}`;
  break;
```

