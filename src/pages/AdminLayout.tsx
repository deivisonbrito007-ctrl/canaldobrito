import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Image, Film, Clapperboard, Settings } from "lucide-react";
import logo from "@/assets/logo_brito_solutions_sem_fundo.png";

const adminTabs = [
  { value: "banners", label: "Banners", icon: Image, path: "/admin/banners" },
  { value: "filmes", label: "Filmes", icon: Film, path: "/admin/filmes" },
  { value: "series", label: "Séries", icon: Clapperboard, path: "/admin/series" },
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
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="container flex items-center justify-between px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Brito Solutions" className="h-8 w-auto" />
            <span className="font-display text-sm font-bold text-foreground hidden sm:inline">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Ver Site
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-3 sm:px-4 pt-3">
        <Tabs value={currentTab} onValueChange={(v) => {
          const tab = adminTabs.find((t) => t.value === v);
          if (tab) navigate(tab.path);
        }}>
          <TabsList className="w-full grid grid-cols-4 h-auto">
            {adminTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs py-2">
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="container px-3 sm:px-4 py-4">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
