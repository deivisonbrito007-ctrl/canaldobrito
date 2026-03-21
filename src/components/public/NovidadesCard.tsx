import { useActiveNewsReleases } from "@/hooks/useNewsReleases";
import { ContentDetailSheet } from "./ContentDetailSheet";
import { useState } from "react";
import { ImageOff } from "lucide-react";

export const NovidadesCard = () => {
  const { data: items, isLoading } = useActiveNewsReleases();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading || !items || items.length === 0) return null;

  const item = items[0];

  const badgeLabel =
    item.badge_type === "lancamento" ? "🆕 Lançamento" :
    item.badge_type === "nova_temporada" ? "📺 Nova Temporada" :
    item.badge_type === "estreia" ? "⭐ Estreia" :
    item.badge_type === "exclusivo" ? "👑 Exclusivo" : "🔥 Novidade";

  return (
    <section className="px-4 animate-fade-up stagger-6">
      <div
        className="rounded-2xl overflow-hidden bg-surface border border-border cursor-pointer transition-all duration-200 hover:border-primary/20"
        onClick={() => {
          setSelectedItem(item);
          setSheetOpen(true);
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Content left */}
          <div className="p-5 space-y-3 flex flex-col justify-center">
            <span className="inline-flex self-start items-center rounded-full bg-green-dim border border-green-border px-2.5 py-1 text-[10px] font-bold text-primary font-body">
              {badgeLabel}
            </span>

            <h3 className="font-display text-3xl sm:text-4xl text-foreground leading-none tracking-wide">
              {item.title.toUpperCase()}
            </h3>

            {item.overview && (
              <p className="text-xs text-muted-foreground font-body line-clamp-3 leading-relaxed">
                {item.overview}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button className="bg-primary text-primary-foreground text-[11px] font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-body">
                Assistir agora
              </button>
              <button className="border border-border text-foreground text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-surface-2 transition-colors font-body">
                + Minha lista
              </button>
            </div>
          </div>

          {/* Poster right */}
          <div className="relative min-h-[200px] sm:min-h-[280px] overflow-hidden">
            {/* Decorative text */}
            <span className="absolute inset-0 flex items-center justify-center font-display text-[120px] text-foreground/[0.04] leading-none select-none pointer-events-none">
              {item.title.split(" ")[0]}
            </span>

            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-contain z-[1]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageOff className="h-10 w-10 text-muted-foreground/20" />
              </div>
            )}
          </div>
        </div>
      </div>

      <ContentDetailSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedItem(null); }}
        item={selectedItem ? {
          title: selectedItem.title,
          overview: selectedItem.overview,
          poster_url: selectedItem.image_url,
          rating: selectedItem.rating,
          year: selectedItem.year,
          genre: selectedItem.genres,
          tmdb_id: selectedItem.tmdb_id,
          content_type: selectedItem.content_type,
        } : null}
      />
    </section>
  );
};
