import { useState } from "react";
import { useTrailerKey } from "@/hooks/useTrailerKey";
import { X, Play, Loader2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContentDetailSheetProps {
  open: boolean;
  onClose: () => void;
  item: {
    title: string;
    overview?: string | null;
    poster_url?: string | null;
    backdrop_url?: string | null;
    image_url?: string | null;
    rating?: number | null;
    year?: number | null;
    genre?: string | null;
    tmdb_id?: number | null;
    content_type?: string;
  } | null;
}

export const ContentDetailSheet = ({ open, onClose, item }: ContentDetailSheetProps) => {
  const { trailerKey, loading: loadingTrailer } = useTrailerKey(
    item?.tmdb_id,
    item?.content_type,
    open
  );
  const [expandOverview, setExpandOverview] = useState(false);

  if (!item) return null;

  const poster = item.poster_url || item.image_url;
  const backdrop = (item as any).backdrop_url;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[60] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card border-t border-border/30"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-card rounded-t-3xl">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-3 right-4 p-2 rounded-full hover:bg-secondary/50 text-muted-foreground z-20"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="px-4 pb-24 space-y-4">
              <div className="flex gap-3">
                {poster && (
                  <img
                    src={poster}
                    alt={item.title}
                    className="w-24 h-auto rounded-xl object-cover border border-border/20 premium-shadow-sm"
                  />
                )}
                <div className="flex-1 space-y-2 pt-1">
                  <h3 className="font-display text-lg font-bold text-foreground leading-tight">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.year && (
                      <span className="text-xs text-muted-foreground font-medium">{item.year}</span>
                    )}
                    {item.rating && (
                      <span className="text-xs text-amber-400 font-bold">⭐ {Number(item.rating).toFixed(1)}</span>
                    )}
                    {item.genre && item.genre.split(",").slice(0, 3).map((g, i) => (
                      <span key={i} className="text-[10px] text-primary font-semibold bg-primary/15 rounded-full px-2 py-0.5">
                        {g.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {item.overview && (
                <div>
                  <p className={`text-sm text-muted-foreground leading-relaxed ${!expandOverview ? "line-clamp-4" : ""}`}>
                    {item.overview}
                  </p>
                  {item.overview.length > 200 && (
                    <button
                      onClick={() => setExpandOverview(!expandOverview)}
                      className="text-xs text-primary font-semibold mt-1"
                    >
                      {expandOverview ? "Ver menos" : "Ver mais"}
                    </button>
                  )}
                </div>
              )}

              {loadingTrailer && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {trailerKey && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Play className="h-3.5 w-3.5 text-primary" />
                    Trailer
                  </p>
                  <div className="aspect-video rounded-xl overflow-hidden border border-border/20 premium-shadow">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailerKey}?rel=0`}
                      title="Trailer"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {!loadingTrailer && !trailerKey && item.tmdb_id && (
                <a
                  href={`https://www.themoviedb.org/${item.content_type === "series" || item.content_type === "tv" ? "tv" : "movie"}/${item.tmdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver no TMDB
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
