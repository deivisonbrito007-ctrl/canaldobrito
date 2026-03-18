import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Image, Film, Clapperboard, Settings, ExternalLink, Sparkles } from "lucide-react";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";

const adminTabs = [
  { value: "banners", label: "Banners", icon: Image, path: "/admin/banners" },
  { value: "filmes", label: "Filmes", icon: Film, path: "/admin/filmes" },
  { value: "series", label: "Séries", icon: Clapperboard, path: "/admin/series" },
  { value: "novidades", label: "Novidades", icon: Sparkles, path: "/admin/novidades" },
  { value: "configuracoes", label: "Config", icon: Settings, path: "/admin/configuracoes" },
];

const AdminLayout = () => {
  const { isAdmin, isLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const currentTab = adminTabs.find((t) => location.pathname.startsWith(t.path))?.value || "banners";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/20 bg-background/90 backdrop-blur-2xl shadow-[0_1px_12px_hsl(0,0%,0%,0.3)]">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <div className="container flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Brito Solutions" className="h-9 w-auto" />
            <div className="hidden sm:block">
              <span className="font-display text-sm font-bold text-foreground">Admin</span>
              <p className="text-[10px] text-muted-foreground/50">Painel de Gerenciamento</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver Site</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-4 sm:px-6 pt-4">
        <Tabs value={currentTab} onValueChange={(v) => {
          const tab = adminTabs.find((t) => t.value === v);
          if (tab) navigate(tab.path);
        }}>
          <TabsList className="w-full grid grid-cols-4 h-auto bg-secondary/50 border border-border/20 rounded-xl p-1">
            {adminTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 text-xs py-2.5 rounded-lg font-semibold data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:border-border/30 data-[state=active]:border transition-all duration-200"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="container px-4 sm:px-6 py-5">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
