import { forwardRef } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrailerModalProps {
  open: boolean;
  onClose: () => void;
  trailerKey: string | null;
  loading?: boolean;
  title?: string;
}

export const TrailerModal = forwardRef<HTMLDivElement, TrailerModalProps>(({ open, onClose, trailerKey, loading, title }, ref) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative w-full max-w-2xl pointer-events-auto">
            <button
              onClick={onClose}
              className="absolute -top-10 right-0 p-2 rounded-full text-foreground/70 hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar trailer"
            >
              <X className="h-6 w-6" />
            </button>

            {loading && (
              <div className="aspect-video rounded-2xl bg-card border border-border/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!loading && trailerKey && (
              <div className="aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                  title={title ? `Trailer — ${title}` : "Trailer"}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {!loading && !trailerKey && (
              <div className="aspect-video rounded-2xl bg-card border border-border/20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Trailer não disponível</p>
              </div>
            )}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
));

TrailerModal.displayName = "TrailerModal";
