

# Correções Mobile & UX — Canal do Brito

12 correções para melhorar a experiência mobile, acessibilidade e performance.

## Arquivos afetados

| Arquivo | Correções |
|---------|-----------|
| `index.html` | #03 viewport-fit, #12 PWA manifest link |
| `src/index.css` | #09 padding var, #10 will-change + reduced-motion, #11 skeleton shimmer (already exists partially) |
| `src/components/public/LiveFeedSection.tsx` | #01 grid 1→2→4 cols, #05 touch targets, #11 skeleton loading |
| `src/components/public/Hero.tsx` | #02 clamp() title, hero layout stacking |
| `src/components/public/BottomNav.tsx` | #03 safe-area padding, #05 touch targets |
| `src/components/public/NovidadesCard.tsx` | #04 poster-top mobile layout (already done, minor tweaks) |
| `src/components/public/CategoryIconsCarousel.tsx` | #05 touch targets 44px, #06 pause on touch + resume after 2s |
| `src/components/public/AppNavbar.tsx` | #07 hide date on mobile (already done), ensure CTA touch target |
| `src/components/public/LoginModal.tsx` | #08 iOS keyboard visual viewport adjustment |
| `src/components/public/PromoStrip.tsx` | #05 CTA touch target |
| `src/pages/Index.tsx` | #03 safe-area bottom padding on main |
| `public/manifest.json` | #12 PWA manifest (new file) |

## Implementation details

### #01 — Grid responsivo cards ao vivo
Change `LiveFeedSection` grid from `grid-cols-2 lg:grid-cols-4` to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Ensure card text uses `truncate` and min-widths are removed so text flows naturally on narrow screens.

### #02 — Título hero fluido
Replace fixed `text-[26px] sm:text-[34px]` with `clamp(1.4rem, 5vw, 2.125rem)` via inline style. Stack hero layout vertically on mobile (stats full-width below title) — already done, verify sizing.

### #03 — Safe area bottom nav iOS
- Add `viewport-fit=cover` to index.html viewport meta
- Update BottomNav padding-bottom to `calc(6px + env(safe-area-inset-bottom))`
- Update Index.tsx main `pb-28` to include safe area awareness

### #04 — Banner novidades mobile
Already implemented poster-on-top layout. Minor tweak: ensure poster height on mobile is at least 200px and gradient fade is stronger.

### #05 — Touch targets 44px
Audit all interactive elements: category pills, "Ver todos" links, nav items, CTA buttons. Add `min-h-[44px] min-w-[44px]` where missing. Some already have it.

### #06 — Carrossel pause on touch
Add `onTouchStart` (pause) and `onTouchEnd` (resume after 2s delay) to `CategoryIconsCarousel`. Already pauses on hover via CSS; add JS touch handlers that toggle a class.

### #07 — Navbar mobile
Date is already `hidden sm:block`. Verify CTA button has 44px touch target.

### #08 — Modal login keyboard iOS
Add `useEffect` with `window.visualViewport` resize listener to shift modal up when keyboard opens.

### #09 — Padding lateral consistente
Add CSS custom property `--px: 1rem` (1.5rem at md+). Update sections to use consistent `px-[var(--px)]` or keep existing `px-4` which is already 1rem.

### #10 — Performance reduced-motion
Add `will-change: transform` to `.atm-blob` (rename ambient blobs). Extend existing `prefers-reduced-motion` rule to cover all animated classes.

### #11 — Skeleton loading for live cards
Add a `SkeletonCard` component inside `LiveFeedSection` shown while `isLoading` is true.

### #12 — PWA Manifest
Create `public/manifest.json` and add `<link rel="manifest">` to index.html. Note: icon files won't exist yet but the manifest will be ready.

