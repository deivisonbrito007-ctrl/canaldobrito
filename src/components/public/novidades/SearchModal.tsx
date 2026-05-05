import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ContentListItem } from "./ContentListItem";
import type { NewsRelease } from "@/hooks/useNewsReleases";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  items: NewsRelease[];
  onSelect: (item: NewsRelease) => void;
}

export const SearchModal = ({ open, onClose, items, onSelect }: SearchModalProps) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      (i.overview ?? "").toLowerCase().includes(q) ||
      (i.genres ?? "").toLowerCase().includes(q),
    ).slice(0, 50);
  }, [query, items]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-background border border-border overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-background border-b border-border p-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar filmes, séries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-3 py-3 rounded-xl bg-surface-2 border border-border text-sm font-body focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar busca"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-2 border border-border text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {!query && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-body">Digite para buscar</p>
            </div>
          )}
          {query && results.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-body">Nenhum resultado para “{query}”</p>
            </div>
          )}
          {results.map((item) => (
            <ContentListItem key={item.id} item={item} onSelect={(i) => { onSelect(i); onClose(); }} />
          ))}
        </div>
      </div>
    </div>
  );
};
