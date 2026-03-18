import { Home, CalendarDays, User, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const navItems = [
  { id: "home", label: "Início", icon: Home },
  { id: "highlights", label: "Destaques", icon: Star },
  { id: "schedule", label: "Programação", icon: CalendarDays },
  { id: "profile", label: "Perfil", icon: User },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navigate = useNavigate();

  const handleTab = (id: string) => {
    if (id === "profile") {
      navigate("/login");
      return;
    }
    onTabChange(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-border/10">
      <div className="flex items-end justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
        {navItems.map((item) => {

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTab(item.id)}
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
