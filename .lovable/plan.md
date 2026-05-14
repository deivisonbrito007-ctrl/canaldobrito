
# Redesign Premium — /agenda

Substitui completamente a `AgendaPublica.tsx` por uma experiência mobile-first estilo OneFootball/SofaScore, otimizada para tráfego do WhatsApp Status. Mantém o sistema 100% manual e a paleta da marca (`#07080a` / `#00ff87`), apenas elevando densidade visual, hierarquia e micro-animações.

## Estrutura da nova página (de cima pra baixo)

```text
┌─────────────────────────────────────┐
│ HEADER COMPACTO (sticky, blur)      │
│ logo • QUARTA-FEIRA · 25 JOGOS HOJE │
│                       ‹  HOJE  ›    │
├─────────────────────────────────────┤
│ CARD AO VIVO (hero, glow vermelho)  │
│ 🔴 AO VIVO AGORA                    │
│ Flamengo  ×  Palmeiras              │
│ 🏆 Brasileirão  📺 SporTV           │
│ [paginação se houver mais de 1]     │
├─────────────────────────────────────┤
│ CTA ASSINE JÁ (gradient verde)      │
├─────────────────────────────────────┤
│ FILTROS HORIZONTAIS (scroll-x)      │
│ Todos · Ao Vivo · ⚽ · 🏀 · 🎾 · 🥊  │
├─────────────────────────────────────┤
│ 🔥 IMPERDÍVEIS DE HOJE (carrossel)  │
│ cards horizontais estilo Netflix    │
├─────────────────────────────────────┤
│ AGRUPAMENTOS POR ESPORTE            │
│ ⚽ FUTEBOL · 12 jogos                │
│  ┌─ card moderno ──────────────┐    │
│  │ 16:00  Time A × Time B       │    │
│  │ 🏆 Comp · 📺 Canal           │    │
│  └──────────────────────────────┘    │
│ 🏀 BASQUETE · 4 jogos                │
│ ...                                  │
├─────────────────────────────────────┤
│ Footer minimal + canaldobrito.site  │
└─────────────────────────────────────┘
│ SHARE BAR FIXA (mantida)            │
│ Copiar · WhatsApp · Mais            │
└─────────────────────────────────────┘
```

## Decisões aplicadas a partir das respostas

- **Substitui** a `/agenda` atual (mesma rota/links do WhatsApp continuam válidos).
- Card AO VIVO **sem placar/minuto/audiência** — usa só times, campeonato, canal e badge AO VIVO pulsante.
- Sem bottom-nav, sem favoritos, sem busca, sem lembretes — versão **enxuta**. Share bar atual continua.
- Seção **"🔥 Imperdíveis de Hoje"**: curadoria automática por palavras-chave em `competition` (Brasileirão, Champions, Libertadores, NBA, UFC, Fórmula 1, etc.) + qualquer jogo ao vivo. Sem mudança de schema.

## Componentização

Toda a tela vira `AgendaPublica.tsx` enxuta + componentes novos em `src/components/agenda/public/`:

- `AgendaHeader.tsx` — header sticky com blur, logo, dia/contagem e navegador de dias compacto.
- `LiveHeroCard.tsx` — card grande com glow vermelho, badge pulsante, swipe entre múltiplos jogos ao vivo (só horizontal **dentro do card**, não na página, respeitando a memória de não-swipe global).
- `SportFilterBar.tsx` — chips arredondados em scroll-x, com estado ativo neon (verde) e contagem por chip.
- `HighlightsCarousel.tsx` — "Imperdíveis de Hoje", scroll-x com snap, cards 280px com gradient + canal.
- `SportSection.tsx` — agrupamento por esporte com header tipográfico Bebas Neue grande.
- `GamePremiumCard.tsx` — card unificado de jogo (horário destaque, times, competição, `ChannelBadge`, status).
- `EmptyDayState.tsx` — estado vazio elegante (emoji + CTA "ver amanhã").
- `AgendaSkeleton.tsx` — shimmer (respeitando memória global).

Reaproveita: `ChannelBadge`, `useAllDailyGames`, `gameUtils` (`detectSportType`, `isGameCurrentlyLive`, `SPORT_EMOJI`, `SPORT_LABEL`, `midnightInSaoPaulo`), `whatsappText.buildShareMessage`, `LiveNowStrip` (pode ser substituído pelo novo `LiveHeroCard`).

## Diferenciação visual por esporte

`gamePremiumTheme.ts` mapeia cada `SportType` para um par `{ accent, glow }` em hsl, aplicado como borda esquerda 3px + glow sutil no card:

- futebol → verde `#00ff87`
- basquete → laranja `#ff8a3d`
- tênis → roxo `#a78bfa`
- mma/boxing → vermelho `#ff5252`
- nfl (rugby/football americano) → azul `#3b82f6`
- f1 → vermelho ferrari `#e10600`
- demais → cinza neutro

## Animações (framer-motion, já no projeto)

- Card AO VIVO: glow pulsante 2s loop (omitido em `prefers-reduced-motion`).
- Filtros: `layoutId` na pílula ativa para transição suave entre chips.
- Cards de jogo: `fade-in` stagger 30ms ao montar.
- CTA Assine: shimmer diagonal sutil a cada 6s.
- Tudo desabilitado se `prefers-reduced-motion`.

## Estilo visual

- Fundo: gradient radial sutil `#07080a → #0a0c10` no topo + noise texture leve via SVG inline.
- Cards: `bg-white/[0.04]` com borda `white/8`, hover `white/[0.06]`.
- Glassmorphism no header sticky (`backdrop-blur-xl`) e na share-bar (já existe).
- Tipografia: títulos Bebas Neue (já carregada), corpo Syne (já no projeto).

## SEO e share

Mantém o bloco atual de OG/canonical/title. Atualiza description para refletir contagem por esporte. `buildShareMessage` segue intacto.

## Performance

- Lista virtualizada não é necessária (raramente passa de ~40 jogos).
- `useMemo` em agrupamentos, filtros e destaques.
- Imagens de canal já são SVG locais.
- Skeleton shimmer durante `isLoading`.

## Arquivos

**Novos**
- `src/components/agenda/public/AgendaHeader.tsx`
- `src/components/agenda/public/LiveHeroCard.tsx`
- `src/components/agenda/public/SportFilterBar.tsx`
- `src/components/agenda/public/HighlightsCarousel.tsx`
- `src/components/agenda/public/SportSection.tsx`
- `src/components/agenda/public/GamePremiumCard.tsx`
- `src/components/agenda/public/EmptyDayState.tsx`
- `src/components/agenda/public/AgendaSkeleton.tsx`
- `src/components/agenda/public/gamePremiumTheme.ts`
- `src/components/agenda/public/highlightsCuration.ts` (regex de competições top)

**Editados**
- `src/pages/AgendaPublica.tsx` — vira orquestrador enxuto que monta os componentes acima, mantém `ShareBar`, navegação de dias, SEO e CTA Assine.

**Não alterados**
- Backend, schema, parser do WhatsApp, rotas, autenticação.

## Fora de escopo (explicitamente)

- Placar/minuto ao vivo, audiência.
- Busca, favoritos, lembretes, login.
- Bottom-nav (a página continua sendo "single-screen" com share-bar fixa).
- Mudanças no admin.
