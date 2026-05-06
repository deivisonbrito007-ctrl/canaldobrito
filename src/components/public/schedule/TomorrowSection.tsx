import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { DailyGame } from "@/hooks/useDailyGames";
import { PeriodGroup, GROUP_ORDER, getTimeGroup, type TimeGroup } from "./PeriodGroup";

interface TomorrowSectionProps {
  games: DailyGame[];
  onPushReminder?: (gameId: string, add: boolean) => void;
}

export const TomorrowSection = ({ games, onPushReminder }: TomorrowSectionProps) => {
  const [open, setOpen] = useState(false);

  const tomorrowStr = useMemo(() => {
    if (!games[0]) return "";
    try {
      return format(new Date(games[0].date + "T12:00:00"), "EEEE, d 'de' MMM", { locale: ptBR });
    } catch {
      return games[0].date;
    }
  }, [games]);

  const grouped = useMemo(() => {
    const groups: Record<TimeGroup, DailyGame[]> = { morning: [], afternoon: [], night: [], dawn: [] };
    games.forEach((g) => groups[getTimeGroup(g.game_time || "00:00")].push(g));
    return groups;
  }, [games]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-3 w-full py-2 min-h-[44px]">
          <span className="text-base" aria-hidden>📅</span>
          <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest">Amanhã</span>
          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 tabular-nums">
            {games.length} {games.length === 1 ? "jogo" : "jogos"}
          </span>
          <span className="text-[10px] text-muted-foreground/50 capitalize">{tomorrowStr}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-border/40 to-transparent" />
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 ${
              open ? "" : "-rotate-90"
            }`}
            aria-hidden
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-5 mt-2">
          {GROUP_ORDER.map((group) => {
            const g = grouped[group];
            if (!g || g.length === 0) return null;
            return <PeriodGroup key={group} group={group} games={g} onPushReminder={onPushReminder} defaultOpen={false} />;
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
