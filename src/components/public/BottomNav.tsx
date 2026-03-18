import { useState } from "react";
import { Home, Search, CalendarDays, User, Play } from "lucide-react";

const navItems = [
  { id: "home", label: "Início", icon: Home },
  { id: "search", label: "Buscar", icon: Search },
  { id: "play", label: "", icon: Play, center: true },
  { id: "schedule", label: "Programação", icon: CalendarDays },
  { id: "profile", label: "Perfil", icon: User },
];

export const BottomNav = () => {
  const [active, setActive] = useState("home");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-border/10">
      <div className="flex items-end justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
        {navItems.map((item) => {
          if (item.center) {
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className="flex flex-col items-center -mt-4"
              >
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-[0_0_20px_hsl(160,100%,45%,0.25)] transition-transform active:scale-90">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className="flex flex-col items-center gap-1 py-1.5 px-3 touch-target relative"
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium font-body transition-colors ${
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
