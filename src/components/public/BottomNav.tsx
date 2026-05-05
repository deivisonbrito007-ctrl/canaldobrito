import { Radio, Sparkles, Star, CalendarDays } from "lucide-react";
import { useTabBadges } from "@/hooks/useTabBadges";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const navItems = [
  { id: "live", label: "Ao Vivo", icon: Radio },
  { id: "novidades", label: "Novidades", icon: Sparkles },
  { id: "highlights", label: "Sugestões", icon: Star },
  { id: "schedule", label: "Programação", icon: CalendarDays },
] as const;

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const { data: badges } = useTabBadges();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "hsl(var(--background))",
        borderTop: "0.5px solid hsl(var(--border) / 0.15)",
        paddingBottom: "env(safe-area-inset-bottom, 6px)",
      }}
    >
      <div className="flex items-end justify-around px-1 pt-1.5 pb-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showBadge = !isActive && badges?.[item.id as keyof typeof badges];
          const isLive = item.id === "live" && showBadge;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-2 min-h-[44px] min-w-[44px]"
            >
              {isActive && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary" />
              )}
              <div className="relative">
                <Icon
                  className={`h-[22px] w-[22px] transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.6}
                />
                {showBadge && (
                  isLive ? (
                    <span
                      className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background"
                      style={{ boxShadow: "0 0 6px hsl(0 80% 60%)" }}
                      aria-label="Ao vivo agora"
                    />
                  ) : (
                    <span
                      className="absolute -top-1.5 -right-2 text-[8px] font-bold leading-none px-1 py-[2px] rounded-full bg-primary text-primary-foreground ring-2 ring-background tracking-wide"
                      aria-label="Conteúdo novo"
                    >
                      NOVO
                    </span>
                  )
                )}
              </div>
              <span
                className={`text-[10px] font-semibold transition-colors duration-200 font-body ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
