import { cn } from "@/lib/utils";
import { SPORTS, SportType } from "@/types/sports";
import { motion } from "framer-motion";

interface SportFilterProps {
  selected: SportType | "all";
  onChange: (sport: SportType | "all") => void;
  counts: Record<string, number>;
}

export const SportFilter = ({ selected, onChange, counts }: SportFilterProps) => {
  const filters: { key: SportType | "all"; label: string; icon: string }[] = [
    { key: "all", label: "Todos", icon: "📺" },
    ...SPORTS.map((s) => ({ key: s.type, label: s.label, icon: s.icon })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {filters.map(({ key, label, icon }) => {
        const isActive = selected === key;
        const count = key === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[key] || 0;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="sport-filter-bg"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{icon}</span>
            <span className="relative z-10">{label}</span>
            <span
              className={cn(
                "relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
