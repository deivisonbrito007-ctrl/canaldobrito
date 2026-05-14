import { useMemo, useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ArrowLeft, Sparkles, Copy, Share2 } from "lucide-react";
import { ChannelBadge } from "@/components/public/ChannelBadge";
import { useAllDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import {
  SPORT_EMOJI,
  SPORT_LABEL,
  type SportType,
  detectSportType,
  getLocalDateString,
  isGameCurrentlyLive,
  midnightInSaoPaulo,
} from "@/lib/gameUtils";
import { offsetDateStr, buildShareMessage, safeCopy } from "@/lib/whatsappText";
import { toast } from "sonner";
import logo from "@/assets/canal_do_brito_logo.png";
import LiveNowStrip from "@/components/agenda/LiveNowStrip";

const SITE_URL = "https://canaldobrito.site";

const SPORT_ORDER: SportType[] = [
  "football", "basketball", "volleyball", "tennis",
  "mma", "boxing", "f1", "hockey", "baseball",
  "rugby", "surf", "cycling", "swimming", "golf",
];

function groupBySport(games: DailyGame[]): Record<string, DailyGame[]> {
  const out: Record<string, DailyGame[]> = {};
  for (const g of games) {
    const saved = (g.sport_type || "football") as SportType;
    const detected = detectSportType(`${g.competition} ${g.home_team} ${g.away_team}`);
    const key = detected !== "football" ? detected : saved;
    if (!out[key]) out[key] = [];
    out[key].push(g);
  }
  // sort each group by time
  Object.values(out).forEach((arr) =>
    arr.sort((a, b) => a.game_time.localeCompare(b.game_time))
  );
  return out;
}

const AgendaPublica = () => {
  const [params, setParams] = useSearchParams();
  const today = getLocalDateString();
  const date = params.get("date") || today;
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const { data: rawGames, isLoading } = useAllDailyGames(date);

  const games = useMemo(
    () => (rawGames ?? []).filter((g) => !g.archived && g.active),
    [rawGames]
  );

  const grouped = useMemo(() => groupBySport(games), [games]);

  // Tick every 30s so live filtering stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const isToday = date === today;
  const liveGames = useMemo(() => {
    if (!isToday) return [];
    return games.filter((g) =>
      isGameCurrentlyLive(g.game_time, g.date, (g.sport_type || "football") as SportType)
    );
  }, [games, isToday]);

  const handleJumpTo = (id: string) => {
    const el = document.getElementById(`game-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-red-500/60");
      setTimeout(() => el.classList.remove("ring-2", "ring-red-500/60"), 1600);
    }
  };

  const sportsSorted = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      const ia = SPORT_ORDER.indexOf(a as SportType);
      const ib = SPORT_ORDER.indexOf(b as SportType);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [grouped]);

  const total = games.length;
  const dateObj = midnightInSaoPaulo(date);
  const titleLabel =
    date === today
      ? "AGENDA DE HOJE"
      : date === offsetDateStr(today, 1)
        ? "AGENDA DE AMANHÃ"
        : "AGENDA";
  const subtitle = (() => {
    const d = format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
    return d.charAt(0).toUpperCase() + d.slice(1);
  })();

  // SEO
  useEffect(() => {
    const summary = sportsSorted
      .map((s) => `${grouped[s].length} ${SPORT_LABEL[s as SportType] ?? s}`)
      .join(", ");
    document.title = `${titleLabel} — ${subtitle} · ${total} jogos | Canal do Brito`;
    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    const desc = total > 0 ? `${total} jogos: ${summary}.` : "Sem jogos cadastrados.";
    setMeta("description", desc);
    setMeta("og:title", `${titleLabel} — ${subtitle}`, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:url", `${SITE_URL}/agenda?date=${date}`, "property");
    setMeta("og:type", "website", "property");
    let canon = document.head.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", `${SITE_URL}/agenda?date=${date}`);
  }, [date, total, sportsSorted, grouped, titleLabel, subtitle]);

  const goToDate = (newDate: string) => {
    const next = new URLSearchParams(params);
    if (newDate === today) next.delete("date");
    else next.set("date", newDate);
    setActiveFilter(null);
    setParams(next, { replace: true });
  };

  const visibleSports = activeFilter ? [activeFilter] : sportsSorted;

  return (
    <div className="min-h-screen bg-[#07080a] text-white">
      <div className="mx-auto w-full max-w-[460px] px-4 pt-6 pb-32">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 mb-4">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Voltar">
            <img src={logo} alt="Canal do Brito" className="h-10 w-10 rounded-lg object-cover" />
          </Link>
          <div className="flex items-center gap-1 bg-white/5 rounded-full px-1 py-1 border border-white/10">
            <button
              onClick={() => goToDate(offsetDateStr(date, -1))}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToDate(today)}
              className="text-xs px-3 h-9 rounded-full hover:bg-white/10 transition font-medium uppercase tracking-wide"
              aria-label="Voltar para hoje"
            >
              {date === today ? "Hoje" : format(dateObj, "dd/MM")}
            </button>
            <button
              onClick={() => goToDate(offsetDateStr(date, 1))}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition"
              aria-label="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="mb-5">
          <h1
            className="text-4xl leading-none font-black tracking-tight"
            style={{ fontFamily: "Bebas Neue, sans-serif", color: "#00ff87" }}
          >
            {titleLabel}
          </h1>
          <p className="text-sm text-white/70 mt-1">
            {subtitle} · <span className="text-white font-semibold">{total} {total === 1 ? "jogo" : "jogos"}</span>
          </p>
        </div>

        {/* Live now strip (only today + has lives) */}
        {!isLoading && isToday && liveGames.length > 0 && (
          <LiveNowStrip games={liveGames} onJumpTo={handleJumpTo} />
        )}

        {/* Sport summary chips */}
        {sportsSorted.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {sportsSorted.map((s) => {
              const isActive = activeFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setActiveFilter(isActive ? null : s)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium border transition active:scale-95 ${
                    isActive
                      ? "bg-[#00ff87] text-[#07080a] border-[#00ff87]"
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{SPORT_EMOJI[s as SportType] ?? "🏆"}</span>
                  <span>{SPORT_LABEL[s as SportType] ?? s}</span>
                  <span className={`text-xs px-1.5 rounded-full ${isActive ? "bg-[#07080a]/20" : "bg-white/10"}`}>
                    {grouped[s].length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
                style={{ animation: "shimmer 1.5s infinite linear" }}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && total === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-3">📅</div>
            <p className="text-white/70 font-medium">Sem jogos para esta data.</p>
            <button
              onClick={() => goToDate(offsetDateStr(date, 1))}
              className="mt-4 text-[#00ff87] text-sm font-semibold underline-offset-4 hover:underline"
            >
              Ver agenda de amanhã →
            </button>
          </div>
        )}

        {/* Sport groups */}
        {!isLoading &&
          visibleSports.map((sport) => {
            const list = grouped[sport];
            return (
              <section key={sport} className="mb-6">
                <h2
                  className="flex items-center gap-2 text-xl uppercase tracking-wide mb-2"
                  style={{ fontFamily: "Bebas Neue, sans-serif" }}
                >
                  <span className="text-2xl leading-none">{SPORT_EMOJI[sport as SportType] ?? "🏆"}</span>
                  <span className="text-white">{SPORT_LABEL[sport as SportType] ?? sport}</span>
                  <span className="text-white/40 text-sm normal-case tracking-normal font-normal">
                    · {list.length} {list.length === 1 ? "jogo" : "jogos"}
                  </span>
                </h2>
                <div className="space-y-2">
                  {list.map((g) => {
                    const live = isGameCurrentlyLive(
                      g.game_time,
                      g.date,
                      (g.sport_type || "football") as SportType
                    );
                    const time = g.game_time.slice(0, 5);
                    const teams = g.away_team ? `${g.home_team} × ${g.away_team}` : g.home_team;
                    return (
                      <div
                        key={g.id}
                        id={`game-${g.id}`}
                        className={`relative rounded-xl border p-3 transition-shadow ${
                          live
                            ? "border-red-500/40 bg-red-500/5"
                            : "border-white/10 bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-baseline gap-3">
                          <span
                            className="text-2xl font-bold tabular-nums shrink-0"
                            style={{ fontFamily: "Bebas Neue, sans-serif", color: "#00ff87" }}
                          >
                            {time}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[15px] leading-snug">{teams}</p>
                            {g.competition && (
                              <p className="text-xs text-white/60 mt-0.5">
                                🏆 {g.competition}
                                {g.competition_detail ? ` · ${g.competition_detail}` : ""}
                              </p>
                            )}
                            {g.channels && g.channels.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {g.channels.map((ch, i) => (
                                  <ChannelBadge key={`${g.id}-ch-${i}`} name={ch} size="sm" />
                                ))}
                              </div>
                            )}
                          </div>
                          {live && (
                            <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              Ao vivo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

        {/* Footer link */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar para o app
          </Link>
          <p className="text-[11px] text-white/30 mt-2">canaldobrito.site</p>
        </div>
      </div>


      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default AgendaPublica;
