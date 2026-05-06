import { ReactNode, useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Route-level guard for admin pages.
 * - Shows a spinner while auth is resolving.
 * - Redirects unauthenticated users to /login (preserving intended destination).
 * - Blocks authenticated non-admins with a 403-style screen + toast.
 */
const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { session, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  const warned = useRef(false);

  useEffect(() => {
    if (!isLoading && session && !isAdmin && !warned.current) {
      warned.current = true;
      toast.error("Acesso negado", {
        description: "Sua conta não possui permissão de administrador.",
      });
    }
  }, [isLoading, session, isAdmin]);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[100dvh] items-center justify-center bg-background"
      >
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        <span className="sr-only">Verificando permissões…</span>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <h1 className="font-display text-2xl tracking-wider text-foreground">
            Acesso restrito
          </h1>
          <p className="text-sm text-muted-foreground">
            Sua conta está autenticada, mas não possui o papel de administrador
            necessário para acessar esta área.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <a
              href="/"
              className="min-h-[44px] inline-flex items-center justify-center px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 transition"
            >
              Voltar ao site
            </a>
            <a
              href="/login"
              className="min-h-[44px] inline-flex items-center justify-center px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-white/[0.04] transition"
            >
              Trocar de conta
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;
