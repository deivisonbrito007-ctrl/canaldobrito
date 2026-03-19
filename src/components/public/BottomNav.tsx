import { Home, CalendarDays, Star } from "lucide-react";
import { motion } from "framer-motion";

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/10 backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-end justify-around px-2 pt-1.5 pb-[env(safe-area-inset-bottom,6px)]">
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
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon
                  className={`h-[22px] w-[22px] transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground/70"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.6}
                />
              </motion.div>
              <span
                className={`text-[10px] font-semibold transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground/50"
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
