import { Star, Film } from "lucide-react";

import { SectionHeader } from "./SectionHeader";
import { WeeklyMoviesSection } from "./WeeklyMoviesSection";
import { WeeklySeriesSection } from "./WeeklySeriesSection";
import { useActiveMovies } from "@/hooks/useMovies";
import { useActiveSeries } from "@/hooks/useSeries";

const HighlightsEmptyState = () => {
  const { data: movies, isLoading: lm } = useActiveMovies();
  const { data: series, isLoading: ls } = useActiveSeries();
  if (lm || ls) return null;
  if ((movies?.length || 0) > 0 || (series?.length || 0) > 0) return null;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
      <div className="p-4 rounded-2xl bg-muted/30 border border-border/10">
        <Film className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <p className="text-sm font-semibold text-muted-foreground">Nenhum destaque esta semana</p>
      <p className="text-xs text-muted-foreground/60">Volte em breve para novos filmes e séries.</p>
    </div>
  );
};

const HighlightsTab = () => (
  <div className="pt-5 pb-3 space-y-6">
    <div className="px-4">
      <SectionHeader icon={Star} title="Destaques" subtitle="Seleção da semana" />
    </div>
    <WeeklyMoviesSection />
    <WeeklySeriesSection />
    <HighlightsEmptyState />
  </div>
);

export default HighlightsTab;
