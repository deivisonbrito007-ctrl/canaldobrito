import { useActiveMovies, type FeaturedMovie } from "@/hooks/useMovies";
import { Skeleton } from "@/components/ui/skeleton";
import { Film, Star, ImageOff, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const MovieCard = ({ movie, index }: { movie: FeaturedMovie; index: number }) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/20 bg-card shadow-md aspect-[2/3]">
        {movie.poster_url && !imgErr ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <ImageOff className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Bottom gradient always visible */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* Rating */}
        {movie.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-foreground">{Number(movie.rating).toFixed(1)}</span>
          </div>
        )}

        {/* Info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2 drop-shadow-lg">
            {movie.title}
          </p>
          <div className="flex items-center gap-2">
            {movie.year && (
              <span className="text-[11px] text-foreground/60 font-medium">{movie.year}</span>
            )}
            {movie.genre && (
              <span className="text-[10px] text-primary/80 bg-primary/10 rounded px-1.5 py-0.5 font-medium">
                {movie.genre.split(",")[0]}
              </span>
            )}
          </div>
          {movie.overview && (
            <p className="text-[11px] text-foreground/50 line-clamp-2 leading-relaxed">
              {movie.overview}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const MoviesSection = () => {
  const { data: movies, isLoading } = useActiveMovies();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SectionHeader />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="space-y-4">
        <SectionHeader />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-secondary p-4 mb-4">
            <Film className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum filme em destaque</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Volte mais tarde para novidades</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader count={movies.length} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {movies.map((movie, idx) => (
          <MovieCard key={movie.id} movie={movie} index={idx} />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ count }: { count?: number }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
        <Film className="h-4 w-4 text-primary" />
      </div>
      <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
        Filmes em Destaque
      </h2>
    </div>
    {count !== undefined && (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" />
        {count} {count === 1 ? "filme" : "filmes"}
      </div>
    )}
  </div>
);