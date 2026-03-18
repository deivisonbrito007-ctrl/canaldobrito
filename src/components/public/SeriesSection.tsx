import { useActiveSeries, type FeaturedSeries } from "@/hooks/useSeries";
import { Skeleton } from "@/components/ui/skeleton";
import { Clapperboard, Star, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const SeriesItem = ({ series }: { series: FeaturedSeries }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="group relative shrink-0 w-32 sm:w-36">
      <div className="relative overflow-hidden rounded-lg border border-border/30 bg-card aspect-[2/3]">
        {series.poster_url && !imgErr ? (
          <img
            src={series.poster_url}
            alt={series.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
          <p className="text-[10px] text-foreground/80 line-clamp-4">{series.overview}</p>
        </div>
        {series.rating && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5">
            <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-semibold text-foreground">{series.rating}</span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs font-medium text-foreground truncate">{series.title}</p>
      {series.year && <p className="text-[10px] text-muted-foreground">{series.year}</p>}
    </div>
  );
};

export const SeriesSection = () => {
  const { data: series, isLoading } = useActiveSeries();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2 px-1">
          <Clapperboard className="h-5 w-5 text-primary" /> Séries em Destaque
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="shrink-0 w-32 sm:w-36 aspect-[2/3] rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!series || series.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2 px-1">
        <Clapperboard className="h-5 w-5 text-primary" /> Séries em Destaque
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {series.map((s, idx) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <SeriesItem series={s} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};
