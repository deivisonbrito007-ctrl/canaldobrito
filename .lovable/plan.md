

# Redesign Completo — Canal do Brito (Home Page)

This is a major visual overhaul of the home page. The admin area, routing, and data hooks remain unchanged. The redesign focuses on the public-facing Index page and its components.

## Scope

### What changes
1. **Global styles** — New color palette (#00ff87 green, #07080a bg), font swap (Syne replaces Outfit as body font)
2. **Index.tsx** — Complete restructure with new sections: Hero, Categories, Live Games grid, Events, Novidades card, Promo strip
3. **New components**: `Navbar`, `Hero`, `CategoryCarousel`, `LiveGamesGrid`, `LiveEventsSection`, `NovidadesCard`, `PromoStrip`, `BottomNav`, `LoginModal`, `PublicFooter`
4. **Secret login** — Long-press on copyright text triggers login modal (bottom sheet)
5. **Login page** — Keep `/login` route working but the primary access is now via the secret long-press

### What stays the same
- Admin area (AdminLayout, all admin pages)
- All data hooks (useDailyGames, useNewsReleases, useBanners)
- Auth context and Supabase integration
- All database tables and RLS policies

## Implementation Plan

### 1. Update global styles (`src/index.css`)
- Import Google Fonts: `Bebas Neue` + `Syne` (replace Outfit)
- Update CSS variables to new palette:
  - `--background`: #07080a → `210 22% 3%`
  - `--primary`: #00ff87 → `153 100% 50%`
  - Surface colors: #0d0f12, #111418
  - Border: `rgba(255,255,255,0.06)`
- Add new CSS custom properties: `--green-dim`, `--green-border`, `--surface`, `--surface2`
- Add `fadeUp` keyframe animation with stagger support
- Update `.font-body` to use Syne
- Add `livePulse` keyframe (opacity 1→0.2, 1.5s)
- Add floating blob keyframes (10s and 13s cycles)
- Add modal slide-up animation

### 2. Update `tailwind.config.ts`
- Change `fontFamily.body` and `fontFamily.sans` from Outfit to Syne
- Add new color tokens: `surface`, `surface2`, `green-dim`, `green-border`

### 3. Create new `AppNavbar` (`src/components/public/AppNavbar.tsx`) — rewrite
- 54px height, sticky top
- Left: TV icon (SVG, green, 30x30, rounded-lg, bg green-dim) + "Canal do **Brito**"
- Center: formatted date "Sex · 20 mar" in muted
- Right: "X ao vivo" badge (green pulsing dot) + "Assine já" button (bg green, text black, rounded-full)
- No navigation links

### 4. Create `Hero` section (inline in Index or new component)
- Left column: animated pill "BEM-VINDO DE VOLTA" + title with mixed colors ("assistir" in green, "hoje?" in transparent/stroke) + subtitle
- Right column: 3-stat card (AO VIVO count, ESTA NOITE count, CANAIS count) with vertical dividers
- "AO VIVO" stat = live games + live events count from `useDailyGames`

### 5. Rewrite `CategoryIconsCarousel`
- Keep auto-scroll marquee behavior
- Update categories to match spec: 🔥 Em Alta (with "8" badge), ⚽ Futebol, 🏀 Basquete, 🥊 UFC/MMA, 🎬 Filmes, 📺 Séries, 🏅 Esportes, 🎾 Tênis, 🏆 Destaques
- Style: active item uses green-dim bg + green-border + green text; inactive uses surface bg + border + muted text
- Remove "Brito Solutions" header and WhatsApp button from this component

### 6. Rewrite `LiveFeedSection` → `LiveGamesGrid`
- Header: green pulsing dot + "Ao Vivo Canal do Brito" + badge "X jogos" + "Ver todos →" link
- **Grid layout**: 4 columns on desktop, 2 on mobile (not horizontal scroll)
- Card design per spec: 2.5px accent bar, sport-specific colors, league name + "AO VIVO" badge, teams with VS tag, footer with time + channel pill
- Hover: green border + translateY(-2px)
- Uses real data from `useDailyGames` (adversarial games only)

### 7. Create `LiveEventsSection`
- Same header style but orange (#f39c12) badge
- Cards with dark-green accent bar, centered event name, elapsed minutes badge in orange
- Uses real data from `useDailyGames` (non-adversarial events)

### 8. Rewrite `NewsReleasesSection` → `NovidadesCard`
- Wide card with 2-column grid: content left + poster right
- Left: tag pill "Nova Temporada" (green) + large Bebas Neue title + description + 2 buttons ("Assistir agora" solid green, "+ Minha lista" ghost)
- Right: dark area with decorative large text at 4% opacity + poster image
- Uses real data from `useActiveNewsReleases`

### 9. Create `PromoStrip`
- Full-width card with green-dim bg, green-border
- Eyebrow: "Brito Solutions · Premium"
- Title: Bebas Neue "ACESSE TUDO SEM LIMITES"
- Sub: "Esportes, filmes e séries · Cancele quando quiser"
- Button: "Assinar agora →" (links to WhatsApp)

### 10. Rewrite `BottomNav`
- Keep 3 items: Início (Home), Destaques (Star), Programação (CalendarDays)
- Active: green icon + green label + 2px green bar on top
- Inactive: #555e6a icon + label
- Background: #0a0c0e with 0.5px border-top
- **Remove any login button**

### 11. Rewrite `PublicFooter`
- Minimal: just "© 2026 Canal do Brito" in near-invisible color `rgba(255,255,255,0.06)`
- **Long-press handler** (1.5s hold): shows toast "Segure para acessar..." then opens login modal
- Implement with mousedown/touchstart + setTimeout, cancel on mouseup/mouseleave/touchend

### 12. Create `LoginModal` (bottom sheet)
- Slides up from bottom with cubic-bezier animation
- Dark overlay (click outside closes)
- Handle bar at top
- Logo + "Canal do Brito" + "Área administrativa" subtitle
- Email + Password fields
- "Entrar" button (green, full width)
- Divider "acesso restrito"
- "Problemas? Fale com o suporte" link
- X close button top-right
- Uses existing `useAuth().signIn()`

### 13. Update `Index.tsx`
- New section order: Navbar → Hero → CategoryCarousel → LiveGamesGrid → LiveEventsSection → NovidadesCard → PromoStrip → BannerSections → Footer → BottomNav
- Background: two green ambient blobs (radial-gradient, subtle opacity, floating animation)
- Grain overlay (keep existing)
- All sections enter with `fadeUp` animation in cascade

### 14. Update `index.html`
- Add Syne font via Google Fonts link (or handle in CSS @import)

## Files affected
- `src/index.css` — palette + fonts + animations
- `tailwind.config.ts` — font family + new colors
- `index.html` — font link
- `src/pages/Index.tsx` — full rewrite
- `src/components/public/AppNavbar.tsx` — rewrite
- `src/components/public/CategoryIconsCarousel.tsx` — rewrite
- `src/components/public/LiveFeedSection.tsx` — rewrite as grid
- `src/components/public/LiveEventsSection.tsx` — new (events only)
- `src/components/public/NewsReleasesSection.tsx` — rewrite as wide card
- `src/components/public/PromoStrip.tsx` — new
- `src/components/public/BottomNav.tsx` — rewrite
- `src/components/public/PublicFooter.tsx` — rewrite with secret login
- `src/components/public/LoginModal.tsx` — new component
- `src/components/public/Hero.tsx` — new component

