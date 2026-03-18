import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Image, Film, Clapperboard, Settings, ExternalLink, Sparkles, ChevronRight, User, MessageCircle } from "lucide-react";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";

const adminTabs = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard", color: "text-foreground", activeBg: "bg-white/[0.08]", activeBorder: "border-b-white" },
  { value: "banners", label: "Banners", icon: Image, path: "/admin/banners", color: "text-emerald-400", activeBg: "bg-emerald-500/[0.08]", activeBorder: "border-b-emerald-400" },
  { value: "filmes", label: "Filmes", icon: Film, path: "/admin/filmes", color: "text-blue-400", activeBg: "bg-blue-500/[0.08]", activeBorder: "border-b-blue-400" },
  { value: "series", label: "Séries", icon: Clapperboard, path: "/admin/series", color: "text-purple-400", activeBg: "bg-purple-500/[0.08]", activeBorder: "border-b-purple-400" },
  { value: "novidades", label: "Novidades", icon: Sparkles, path: "/admin/novidades", color: "text-amber-400", activeBg: "bg-amber-500/[0.08]", activeBorder: "border-b-amber-400" },
  { value: "configuracoes", label: "Config", icon: Settings, path: "/admin/configuracoes", color: "text-muted-foreground", activeBg: "bg-white/[0.06]", activeBorder: "border-b-muted-foreground" },
];

const AdminLayout = () => {
  const { isAdmin, isLoading, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const currentTab = adminTabs.find((t) => location.pathname.startsWith(t.path));
  const currentValue = currentTab?.value || "dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#0d1117] admin-scrollbar">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
          {/* Left */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Brito Solutions" className="h-8 sm:h-10 w-auto" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-display text-sm font-bold text-foreground">Admin</span>
              <span className="text-[9px] font-black uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded-md border border-primary/30">PRO</span>
            </div>
            {currentTab && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground ml-4">
                <ChevronRight className="h-3 w-3" />
                <span className={currentTab.color}>{currentTab.label}</span>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-1 text-[11px] border-primary/30 text-primary hover:bg-primary/10 hover:text-primary h-8 px-2 sm:px-3 min-h-[36px]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver Site</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-h-[36px] min-w-[36px]"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6">
          <nav className="flex gap-0.5 overflow-x-auto scrollbar-none -mb-px">
            {adminTabs.map((tab) => {
              const isActive = currentValue === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-all rounded-t-lg min-h-[44px] min-w-[44px] ${
                    isActive
                      ? `${tab.activeBg} ${tab.activeBorder} ${tab.color}`
                      : "border-b-transparent text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${isActive ? tab.color : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
