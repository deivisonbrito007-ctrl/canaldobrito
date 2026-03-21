import { Home, Star, CalendarDays } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const navItems = [
  { id: "home", label: "Início", icon: Home },
  { id: "highlights", label: "Destaques", icon: Star },
  { id: "schedule", label: "Programação", icon: CalendarDays },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "hsl(210 22% 4%)",
        borderTop: "0.5px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 6px)",
      }}
    >
      <div className="flex items-end justify-around px-2 pt-1.5 pb-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-4 min-h-[44px] min-w-[44px]"
            >
              {isActive && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary" />
              )}
              <Icon
                className={`h-[22px] w-[22px] transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.5 : 1.6}
              />
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
