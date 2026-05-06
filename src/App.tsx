import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";

// Lazy-load non-critical routes
const Login = lazy(() => import("./pages/Login"));
const Assinar = lazy(() => import("./pages/Assinar"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminFilmes = lazy(() => import("./pages/admin/AdminFilmes"));
const AdminSeries = lazy(() => import("./pages/admin/AdminSeries"));
const AdminConfiguracoes = lazy(() => import("./pages/admin/AdminConfiguracoes"));
const AdminNovidades = lazy(() => import("./pages/admin/AdminNovidades"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const AdminGitHubDiagnostico = lazy(() => import("./pages/admin/AdminGitHubDiagnostico"));
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const ShareRedirect = lazy(() => import("./pages/ShareRedirect"));
const E2EModals = lazy(() => import("./pages/E2EModals"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/ao-vivo" element={<Index />} />
              <Route path="/novidades" element={<Index />} />
              <Route path="/sugestoes" element={<Index />} />
              <Route path="/destaques" element={<Index />} />
              <Route path="/programacao" element={<Index />} />
              <Route path="/s/:slug" element={<ShareRedirect />} />
              <Route path="/assinar" element={<Assinar />} />
              <Route path="/login" element={<Login />} />
              {import.meta.env.DEV && (
                <Route path="/e2e/modals" element={<E2EModals />} />
              )}
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="filmes" element={<AdminFilmes />} />
                <Route path="series" element={<AdminSeries />} />
                <Route path="novidades" element={<AdminNovidades />} />
                <Route path="whatsapp" element={<AdminWhatsApp />} />
                <Route path="diagnostico-github" element={<AdminGitHubDiagnostico />} />
                <Route path="auditoria" element={<AdminAudit />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
                {/* Redirects de rotas antigas removidas */}
                <Route path="api-sync" element={<Navigate to="/admin/whatsapp" replace />} />
                <Route path="sync-stats" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="canais" element={<Navigate to="/admin/whatsapp" replace />} />
                <Route path="canais-whitelist" element={<Navigate to="/admin/whatsapp" replace />} />
                <Route path="ligas" element={<Navigate to="/admin/whatsapp" replace />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
