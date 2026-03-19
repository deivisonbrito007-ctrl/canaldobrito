import { useActiveSeries } from "@/hooks/useSeries";
import { Skeleton } from "@/components/ui/skeleton";
import { Clapperboard, Star, ImageOff } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { motion } from "framer-motion";
import { useState } from "react";

const SeriesCard = ({ item, index }: { item: ReturnType<typeof useActiveSeries>["data"] extends (infer T)[] | undefined ? T : never; index: number }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      className="snap-start shrink-0 w-[150px] sm:w-[180px]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
    >
      <div className="group relative overflow-hidden rounded-xl border border-border/10 bg-card aspect-[2/3] transition-all duration-250 hover:scale-[1.04] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer">
        {item.poster_url && !imgErr ? (
          <img
            src={item.poster_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-card gap-1.5">
            <ImageOff className="h-8 w-8 text-muted-foreground/15" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold font-body backdrop-blur-md border bg-secondary/20 text-secondary border-secondary/20">
          📺 Série
        </div>

        {item.rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-black/40 backdrop-blur-md border border-accent3/20 px-2 py-1">
            <Star className="h-2.5 w-2.5 text-accent3 fill-accent3" />
            <span className="text-[9px] font-bold text-accent3">{Number(item.rating).toFixed(1)}</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
          <p className="text-[12px] sm:text-sm font-bold text-foreground leading-tight line-clamp-2 drop-shadow-lg font-body">
            {item.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {item.year && (
              <span className="text-[10px] text-foreground/40 font-medium font-body">{item.year}</span>
            )}
            {item.genre && (
              <span className="text-[9px] text-secondary font-semibold bg-secondary/10 rounded-full px-2 py-0.5 border border-secondary/15 font-body">
                {item.genre.split(",")[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const WeeklySeriesSection = () => {
  const { data: series, isLoading } = useActiveSeries();

  if (isLoading) {
    return (
      <div className="space-y-4 px-4">
        <SectionHeader />
        <div className="flex gap-3.5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl w-[150px] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!series?.length) return null;

  return (
    <div className="space-y-4">
      <div className="px-4">
        <SectionHeader icon={Clapperboard} title="Séries" subtitle="Destaques da semana" />
      </div>
      <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 pb-2">
        {series.map((item, idx) => (
          <SeriesCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = () => (
  <div className="flex items-center gap-2.5">
    <div className="p-1.5 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/15 border border-secondary/15 shadow-[0_0_8px_hsl(var(--secondary)/0.15)]">
      <Clapperboard className="h-4 w-4 text-secondary" />
    </div>
    <div className="flex flex-col">
      <h2 className="font-display text-base sm:text-lg font-extrabold text-foreground tracking-tight leading-tight">
        Séries <span className="text-primary">Brito Solutions</span>
      </h2>
      <p className="text-[10px] text-muted-foreground/60 font-body tracking-wide">
        Destaques da semana
      </p>
    </div>
  </div>
);
