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

const HighlightsTab = () => {
  const { data: movies } = useActiveMovies();
  const { data: series } = useActiveSeries();
  const totalCount = (movies?.length || 0) + (series?.length || 0);

  return (
    <div className="pt-5 pb-3 space-y-6">
      <div className="px-4">
        <SectionHeader
          icon={Star}
          title="Destaques"
          subtitle="Seleção da semana"
          badge={
            totalCount > 0 ? (
              <span className="ml-auto text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
                {totalCount} {totalCount === 1 ? "título" : "títulos"}
              </span>
            ) : undefined
          }
        />
      </div>
      <WeeklyMoviesSection />
      {/* Visual separator between sections */}
      {(movies?.length || 0) > 0 && (series?.length || 0) > 0 && (
        <div className="px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        </div>
      )}
      <WeeklySeriesSection />
      <HighlightsEmptyState />
    </div>
  );
};

export default HighlightsTab;
