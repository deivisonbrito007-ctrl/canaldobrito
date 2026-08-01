import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GripVertical, ImageOff, RefreshCw, Star, Trash2 } from "lucide-react";

const ratingColor = (r: number) => (r >= 7 ? "text-emerald-400" : r >= 5 ? "text-amber-400" : "text-red-400");

export interface ContentRowItem {
  id: string;
  title: string;
  poster_url: string | null;
  year: number | null;
  rating: number | null;
  genre: string | null;
  active: boolean;
}

interface SortableContentRowProps {
  item: ContentRowItem;
  refreshing: boolean;
  disabled: boolean;
  selected: boolean;
  selectionMode: boolean;
  dragDisabled?: boolean;
  /** Classe de cor do gênero/hover, ex.: "text-blue-400/70" */
  genreClass?: string;
  hoverClass?: string;
  onSelectChange: (id: string, checked: boolean) => void;
  onRefresh: () => void;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}

/** Linha arrastável compartilhada por Filmes e Séries. */
export const SortableContentRow = ({
  item,
  refreshing,
  disabled,
  selected,
  selectionMode,
  dragDisabled,
  genreClass = "text-blue-400/70",
  hoverClass = "hover:text-blue-400",
  onSelectChange,
  onRefresh,
  onToggle,
  onDelete,
}: SortableContentRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: disabled || dragDisabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : ("auto" as const),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg glass-panel p-3 transition-colors ${selected ? "ring-1 ring-primary/40 bg-primary/[0.04]" : ""}`}
    >
      <div className="flex items-center justify-center h-11 w-7 -ml-1">
        {selectionMode ? (
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelectChange(item.id, !!v)}
            disabled={disabled}
            aria-label={`Selecionar ${item.title}`}
          />
        ) : (
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled || dragDisabled}
            className="touch-none h-11 w-7 flex items-center justify-center text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={dragDisabled ? `Reordenar indisponível com filtros ativos` : `Arrastar para reordenar ${item.title}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
      </div>

      {item.poster_url ? (
        <img src={item.poster_url} alt={item.title} className="h-14 w-10 rounded-md object-cover shrink-0" loading="lazy" />
      ) : (
        <div className="h-14 w-10 rounded-md bg-white/[0.03] flex items-center justify-center shrink-0">
          <ImageOff className="h-3.5 w-3.5 text-muted-foreground/20" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{item.title}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1 flex-wrap">
          {item.year && <span>{item.year}</span>}
          {item.rating != null && (
            <>
              <Star className={`h-2 w-2 fill-current ${ratingColor(item.rating)}`} />
              <span className={ratingColor(item.rating)}>{item.rating}</span>
            </>
          )}
          {item.genre ? (
            <span className={`${genreClass} truncate`}>• {item.genre}</span>
          ) : (
            <span className="text-amber-400/70 italic">• sem gênero</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className={`h-11 w-11 rounded-lg text-muted-foreground ${hoverClass} transition-all duration-200`}
          disabled={refreshing || disabled}
          onClick={onRefresh}
          aria-label={`Atualizar dados de ${item.title} via TMDB`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
        <Switch
          checked={item.active}
          disabled={disabled}
          onCheckedChange={onToggle}
          aria-label={`${item.active ? "Desativar" : "Ativar"} ${item.title}`}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-11 w-11 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200"
          disabled={disabled}
          onClick={onDelete}
          aria-label={`Remover ${item.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
