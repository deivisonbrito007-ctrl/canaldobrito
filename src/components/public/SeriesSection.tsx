import { useActiveSeries, type FeaturedSeries } from "@/hooks/useSeries";
import { Skeleton } from "@/components/ui/skeleton";
import { Clapperboard, Star, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const SeriesItem = ({ series, index }: { series: FeaturedSeries; index: number }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      className="group relative shrink-0 w-36 sm:w-40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/20 bg-card shadow-lg shadow-black/10 aspect-[2/3] transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-xl">
        {series.poster_url && !imgErr ? (
          <img
            src={series.poster_url}
            alt={series.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
          <p className="text-[11px] leading-relaxed text-foreground/80 line-clamp-5">{series.overview}</p>
        </div>

        {/* Rating */}
        {series.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/70 backdrop-blur-sm px-2 py-1 border border-border/20">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] font-bold text-foreground">{Number(series.rating).toFixed(1)}</span>
          </div>
        )}

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 group-hover:opacity-0 transition-opacity">
          <p className="text-xs font-semibold text-foreground truncate drop-shadow-lg">{series.title}</p>
          {series.year && <p className="text-[10px] text-foreground/60">{series.year}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export const SeriesSection = () => {
  const { data: series, isLoading } = useActiveSeries();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Clapperboard className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
            Séries em Destaque
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="shrink-0 w-36 sm:w-40 aspect-[2/3] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!series || series.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Clapperboard className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
          Séries em Destaque
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent ml-2" />
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1 snap-x snap-mandatory">
        {series.map((s, idx) => (
          <div key={s.id} className="snap-start">
            <SeriesItem series={s} index={idx} />
          </div>
        ))}
      </div>
    </section>
  );
};