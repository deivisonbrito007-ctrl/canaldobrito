import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllBanners } from "@/hooks/useBanners";
import { useAllMovies } from "@/hooks/useMovies";
import { useAllSeries } from "@/hooks/useSeries";
import { useAllNewsReleases } from "@/hooks/useNewsReleases";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Image, Film, Clapperboard, Sparkles, Plus } from "lucide-react";

const useCountUp = (target: number, duration = 800) => {
  const [count, setCount] = useState(0);
  const ref = useRef<number>();
  useEffect(() => {
    if (target <= 0) { setCount(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round(progress * target));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  return count;
};

const statCards = [
  { key: "date", icon: Calendar, color: "text-foreground", bg: "from-white/[0.04] to-white/[0.01]", border: "border-white/[0.08]" },
  { key: "banners", icon: Image, label: "Banners Ativos", color: "text-emerald-400", bg: "from-emerald-500/[0.08] to-emerald-500/[0.02]", border: "border-emerald-500/[0.15]" },
  { key: "filmes", icon: Film, label: "Filmes Cadastrados", color: "text-blue-400", bg: "from-blue-500/[0.08] to-blue-500/[0.02]", border: "border-blue-500/[0.15]" },
  { key: "series", icon: Clapperboard, label: "Séries Cadastradas", color: "text-purple-400", bg: "from-purple-500/[0.08] to-purple-500/[0.02]", border: "border-purple-500/[0.15]" },
  { key: "novidades", icon: Sparkles, label: "Novidades", color: "text-amber-400", bg: "from-amber-500/[0.08] to-amber-500/[0.02]", border: "border-amber-500/[0.15]" },
];

const quickActions = [
  { label: "+ Novo Banner", path: "/admin/banners", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:shadow-emerald-500/10", icon: Image },
  { label: "+ Novo Filme", path: "/admin/filmes", color: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:shadow-blue-500/10", icon: Film },
  { label: "+ Nova Série", path: "/admin/series", color: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 hover:shadow-purple-500/10", icon: Clapperboard },
  { label: "+ Nova Novidade", path: "/admin/novidades", color: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:shadow-amber-500/10", icon: Sparkles },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: banners } = useAllBanners();
  const { data: movies } = useAllMovies();
  const { data: series } = useAllSeries();
  const { data: news } = useAllNewsReleases();

  const activeBanners = banners?.filter((b) => b.active).length || 0;
  const totalMovies = movies?.length || 0;
  const totalSeries = series?.length || 0;
  const totalNews = news?.length || 0;

  const bCount = useCountUp(activeBanners);
  const mCount = useCountUp(totalMovies);
  const sCount = useCountUp(totalSeries);
  const nCount = useCountUp(totalNews);

  const counts: Record<string, number> = { banners: bCount, filmes: mCount, series: sCount, novidades: nCount };
  const todayFormatted = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.key}
            className={`admin-stagger-${i + 1} glass-panel rounded-2xl p-5 bg-gradient-to-br ${card.bg} border ${card.border} transition-all duration-300 hover:scale-[1.02]`}
          >
            {card.key === "date" ? (
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/[0.05]">
                  <Calendar className="h-6 w-6 text-foreground/80" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground capitalize">{todayFormatted.split(",")[0]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{todayFormatted.split(", ")[1]}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-white/[0.05]`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className={`text-3xl font-black ${card.color}`}>{counts[card.key]}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`flex items-center gap-2.5 p-4 rounded-xl border font-semibold text-sm transition-all duration-300 hover:shadow-lg ${action.color}`}
            >
              <action.icon className="h-5 w-5" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
