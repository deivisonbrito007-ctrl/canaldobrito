import { forwardRef } from "react";
import { PosterCard } from "./PosterCard";
import type { CinemaItem } from "./useCinemaShelves";

interface PosterRailProps {
  title: string;
  emoji: string;
  items: CinemaItem[];
  onSelect: (item: CinemaItem) => void;
}

export const PosterRail = forwardRef<HTMLElement, PosterRailProps>(
  ({ title, emoji, items, onSelect }, ref) => {
    if (!items.length) return null;

    return (
      <section ref={ref} aria-label={title} className="space-y-3">
        <div className="flex items-baseline gap-2 px-4">
          <span aria-hidden className="text-xl leading-none">{emoji}</span>
          <h2 className="font-display text-xl tracking-wide text-foreground">{title}</h2>
          <span className="ml-1 text-xs text-muted-foreground tabular-nums">
            {items.length}
          </span>
        </div>

        <div
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 px-4 [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)]"
        >
          {items.map((item, i) => (
            <PosterCard
              key={item.id}
              item={item}
              onSelect={onSelect}
              index={i}
              priority={i < 2}
            />
          ))}
        </div>
      </section>
    );
  }
);
PosterRail.displayName = "PosterRail";
