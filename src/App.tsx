import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminLayout from "./pages/AdminLayout";
import AdminProgramacao from "./pages/admin/AdminProgramacao";
import AdminFilmes from "./pages/admin/AdminFilmes";
import AdminSeries from "./pages/admin/AdminSeries";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/programacao" replace />} />
              <Route path="programacao" element={<AdminProgramacao />} />
              <Route path="filmes" element={<AdminFilmes />} />
              <Route path="series" element={<AdminSeries />} />
              <Route path="configuracoes" element={<AdminConfiguracoes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
