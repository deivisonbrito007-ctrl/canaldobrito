import { forwardRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface TrailerModalProps {
  open: boolean;
  onClose: () => void;
  trailerKey: string | null;
  loading?: boolean;
  title?: string;
}

export const TrailerModal = forwardRef<HTMLDivElement, TrailerModalProps>(({ open, onClose, trailerKey, loading, title }, ref) => {
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  // ESC closes; lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={(node) => {
              trapRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title ? `Trailer — ${title}` : "Trailer"}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none outline-none"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative w-full max-w-2xl pointer-events-auto">
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 p-2 rounded-full bg-black/40 text-foreground/90 hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                <div className="aspect-video rounded-2xl overflow-hidden border border-border/20 shadow-2xl bg-black">
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
    </AnimatePresence>,
    document.body
  );
});

TrailerModal.displayName = "TrailerModal";
