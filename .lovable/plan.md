

# New "Ao Vivo - Canal do Brito" Card Feed Component

## What
Replace the current `LiveNowSection` + `LiveEventsSection` with a single, redesigned `LiveFeedSection` component that matches the specified card design with sport-colored accent bars, dark card backgrounds, channel pills, and cleaner team layouts.

## Changes

### 1. Create `src/components/public/LiveFeedSection.tsx`
New self-contained component with:
- **Props interface** for event objects (`id`, `league`, `sport`, `homeTeam`, `awayTeam`, `gender`, `eventName`, `eventSub`, `startTime`, `channel`, `channelColor`, `isLive`)
- **Sport color map**: football→red, basketball→blue, volleyball→purple, tennis→green, other→orange
- **SectionHeader** with Zap icon, title "Ao Vivo Canal do Brito", subtitle, red badge with live count
- **Horizontal scroll row** of ~240px cards with:
  - 3px accent bar colored by sport
  - Dark body (`bg-[#1a1d2e]`, border `border-[#2a2d3e]`, rounded-[14px])
  - Top row: league name (uppercase, small) + pulsing red dot with "Ao vivo"
  - Teams section: head-to-head layout with optional gender subtitle, or centered event name for solo events
  - Footer with thin top border: "Começou HH:MM" left, channel pill right (colored dot + name)
- **Hardcoded sample data** for preview (the 5 items specified)
- Pulsing dot via CSS animation, subtle hover border brightening

### 2. Update `src/pages/Index.tsx`
- Replace `LiveNowSection` and `LiveEventsSection` imports/usage with `LiveFeedSection`
- Remove old imports

### 3. Keep existing files
- `LiveNowSection.tsx` and `LiveEventsSection.tsx` stay in codebase but are no longer rendered on Index (can be cleaned up later)

## Files
- `src/components/public/LiveFeedSection.tsx` — new component
- `src/pages/Index.tsx` — swap sections

