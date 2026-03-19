import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/canal_do_brito_logo.png";
import { Lock } from "lucide-react";

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border/50 bg-card p-8">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Brito Solutions" className="h-12 w-auto" />
          <h1 className="font-display text-xl font-bold text-foreground">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Acesso restrito à administração</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@britosolutions.tv"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            <Lock className="h-4 w-4" />
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="text-center">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar para a agenda
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
