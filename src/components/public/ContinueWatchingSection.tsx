import { Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const items = [
  { id: 1, title: "A Nobreza do Amor", episode: "T2 EP4", progress: 65, emoji: "👑" },
  { id: 2, title: "Pânico 7", episode: "Filme", progress: 30, emoji: "😱" },
  { id: 3, title: "Cosmos: Séries", episode: "T1 EP8", progress: 82, emoji: "🌌" },
];

export const ContinueWatchingSection = () => (
  <section className="space-y-4">
    <div className="flex items-center justify-between px-4">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-secondary/15 border border-secondary/15">
          <Play className="h-4 w-4 text-secondary" />
        </div>
        <h2 className="font-display text-xl tracking-[2px] text-foreground">
          Continue Assistindo
        </h2>
      </div>
    </div>

    <div data-horizontal-scroll className="flex gap-3.5 overflow-x-auto scrollbar-hide px-4 pb-2">
      {items.map((item) => (
        <div key={item.id} className="shrink-0 w-[200px] group cursor-pointer">
          <div className="relative rounded-xl overflow-hidden bg-card border border-border/10">
            {/* Thumb */}
            <div className="h-[115px] flex items-center justify-center bg-gradient-to-br from-card to-muted/30 text-4xl relative">
              {item.emoji}
              {/* Play overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Play className="h-4 w-4 text-primary-foreground fill-current" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0">
                <Progress value={item.progress} className="h-[3px] rounded-none bg-muted/30" />
              </div>
            </div>
            {/* Info */}
            <div className="p-3 space-y-1">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider font-body">
                {item.episode}
              </p>
              <p className="text-sm font-semibold text-foreground font-body line-clamp-1">
                {item.title}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);
