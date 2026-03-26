import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Image, Film, Clapperboard, Sparkles } from "lucide-react";
import type { Banner } from "@/hooks/useBanners";

interface ActivityItem {
  type: "banner" | "filme" | "série" | "novidade";
  title: string;
  created_at: string;
  route: string;
}

const typeConfig = {
  banner: { icon: Image, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  filme: { icon: Film, color: "text-blue-400", bg: "bg-blue-500/10" },
  série: { icon: Clapperboard, color: "text-purple-400", bg: "bg-purple-500/10" },
  novidade: { icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10" },
};

interface RecentActivityProps {
  banners: Banner[] | undefined;
  movies: any[] | undefined;
  series: any[] | undefined;
  news: any[] | undefined;
  isLoading: boolean;
}

export const RecentActivity = React.forwardRef<HTMLDivElement, RecentActivityProps>(({ banners, movies, series, news, isLoading }, ref) => {
  const navigate = useNavigate();

  const items = useMemo(() => {
    const all: ActivityItem[] = [];
    banners?.forEach(b => all.push({ type: "banner", title: b.title || (b.image_url ? b.image_url.slice(-20) : "Banner"), created_at: b.created_at, route: "/admin/banners" }));
    movies?.forEach(m => all.push({ type: "filme", title: m.title, created_at: m.created_at, route: "/admin/filmes" }));
    series?.forEach(s => all.push({ type: "série", title: s.title, created_at: s.created_at, route: "/admin/series" }));
    news?.forEach(n => all.push({ type: "novidade", title: n.title, created_at: n.created_at, route: "/admin/novidades" }));
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  }, [banners, movies, series, news]);

  if (isLoading || items.length === 0) return null;

  return (
    <div ref={ref}>
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Atividade Recente</h2>
      <div className="space-y-2">
        {items.map((item, i) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;
          return (
            <button
              key={`${item.type}-${i}`}
              onClick={() => navigate(item.route)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className={`p-1.5 rounded-lg ${config.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground/90 truncate">{item.title}</p>
                <p className="text-[9px] text-muted-foreground/60 capitalize">{item.type}</p>
              </div>
              <span className="text-[9px] text-muted-foreground/50 whitespace-nowrap">
                {formatDistanceToNow(new Date(item.created_at), { locale: ptBR, addSuffix: true })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
RecentActivity.displayName = "RecentActivity";
