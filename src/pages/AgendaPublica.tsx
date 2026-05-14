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

function ShareBar({ games, date }: { games: DailyGame[]; date: string }) {
  const message = useMemo(() => buildShareMessage(games, date, SITE_URL), [games, date]);

  const handleCopy = async () => {
    const ok = await safeCopy(message);
    if (ok) toast.success("Mensagem copiada!");
    else toast.error("Não foi possível copiar.");
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Canal do Brito — Agenda", text: message });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#07080a]/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto w-full max-w-[460px] px-4 py-3 grid grid-cols-3 gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 h-11 rounded-full bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 active:scale-95 transition"
          aria-label="Copiar mensagem"
        >
          <Copy className="w-4 h-4" />
          Copiar
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-1.5 h-11 rounded-full text-sm font-bold active:scale-95 transition"
          style={{ background: "#25D366", color: "#07080a" }}
          aria-label="Enviar no WhatsApp"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          WhatsApp
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 h-11 rounded-full bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 active:scale-95 transition"
          aria-label="Compartilhar"
        >
          <Share2 className="w-4 h-4" />
          Mais
        </button>
      </div>
    </div>
  );
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

        {/* Assine CTA */}
        <Link
          to="/assinar"
          className="group mb-5 flex items-center justify-between gap-2 rounded-2xl px-4 h-14 active:scale-[0.99] transition-all shadow-lg shadow-[#00ff87]/20 hover:shadow-[#00ff87]/30 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #00ff87 0%, #00e07a 100%)",
            color: "#07080a",
          }}
          aria-label="Assine já o Canal do Brito"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-[#07080a]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 leading-none">
              <p
                className="font-bold tracking-wide whitespace-nowrap"
                style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "20px", lineHeight: 1 }}
              >
                ASSINE JÁ
              </p>
              <p className="text-[10.5px] font-medium opacity-75 mt-1 whitespace-nowrap">
                Esportes, filmes e séries · R$ 35/mês
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>

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

      {/* Sticky share bar */}
      <ShareBar games={games} date={date} />


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
