import { useMemo, useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Sparkles, ChevronRight, Copy, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAllDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import {
  SPORT_LABEL,
  type SportType,
  getLocalDateString,
  isGameCurrentlyLive,
  midnightInSaoPaulo,
} from "@/lib/gameUtils";
import { offsetDateStr, buildShareMessage, safeCopy } from "@/lib/whatsappText";
import { toast } from "sonner";

import { AgendaHeader } from "@/components/agenda/public/AgendaHeader";
import { LiveHeroCard } from "@/components/agenda/public/LiveHeroCard";
import { SportFilterBar, type FilterValue } from "@/components/agenda/public/SportFilterBar";
import { HighlightsCarousel } from "@/components/agenda/public/HighlightsCarousel";
import { SportSection } from "@/components/agenda/public/SportSection";
import { EmptyDayState } from "@/components/agenda/public/EmptyDayState";
import { AgendaSkeleton } from "@/components/agenda/public/AgendaSkeleton";
import { curateHighlights, detectedSport } from "@/components/agenda/public/highlightsCuration";

const SITE_URL = "https://canaldobrito.site";

const SPORT_ORDER: SportType[] = [
  "football", "basketball", "volleyball", "tennis",
  "mma", "boxing", "f1", "hockey", "baseball",
  "rugby", "surf", "cycling", "swimming", "golf",
];

function groupBySport(games: DailyGame[]): Record<string, DailyGame[]> {
  const out: Record<string, DailyGame[]> = {};
  for (const g of games) {
    const key = detectedSport(g);
    if (!out[key]) out[key] = [];
    out[key].push(g);
  }
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
      } catch { /* cancelled */ }
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
  const [filter, setFilter] = useState<FilterValue>("all");

  const { data: rawGames, isLoading } = useAllDailyGames(date);

  const games = useMemo(
    () => (rawGames ?? []).filter((g) => !g.archived && g.active),
    [rawGames]
  );

  const grouped = useMemo(() => groupBySport(games), [games]);

  // Tick a cada 20s para manter status ao vivo / minuto fresco
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 20000);
    return () => clearInterval(id);
  }, []);

  const isToday = date === today;
  const liveGames = useMemo(() => {
    if (!isToday) return [];
    return games.filter((g) =>
      isGameCurrentlyLive(g.game_time, g.date, (g.sport_type || "football") as SportType)
    );
  }, [games, isToday]);

  const allHighlights = useMemo(() => curateHighlights(games, 8), [games]);
  const highlights = useMemo(() => {
    if (filter === "all" || filter === "live") return allHighlights;
    return allHighlights.filter((h) => detectedSport(h.game) === filter);
  }, [allHighlights, filter]);

  const sportsSorted = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      const ia = SPORT_ORDER.indexOf(a as SportType);
      const ib = SPORT_ORDER.indexOf(b as SportType);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }) as SportType[];
  }, [grouped]);

  const countsBySport = useMemo(() => {
    const out: Partial<Record<SportType, number>> = {};
    for (const s of sportsSorted) out[s] = grouped[s].length;
    return out;
  }, [sportsSorted, grouped]);

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
    setFilter("all");
    setParams(next, { replace: true });
  };

  // Aplica filtro
  const visibleSports: SportType[] =
    filter === "all" || filter === "live" ? sportsSorted : [filter];

  const filteredGroup = (sport: SportType): DailyGame[] => {
    const list = grouped[sport] ?? [];
    if (filter === "live") {
      return list.filter((g) =>
        isGameCurrentlyLive(g.game_time, g.date, sport)
      );
    }
    return list;
  };

  return (
    <div
      className="min-h-screen text-white relative"
      style={{
        background:
          "radial-gradient(120% 70% at 50% 0%, #0c0e12 0%, #07080a 55%, #050608 100%)",
      }}
    >
      <AgendaHeader
        date={date}
        today={today}
        totalGames={total}
        onPrev={() => goToDate(offsetDateStr(date, -1))}
        onToday={() => goToDate(today)}
        onNext={() => goToDate(offsetDateStr(date, 1))}
      />

      <div className="mx-auto w-full max-w-[460px] px-4 pt-4 pb-32">
        {/* Título */}
        <div className="mb-4">
          <h1
            className="text-[40px] leading-[0.9] tracking-tight"
            style={{ fontFamily: "Bebas Neue, sans-serif", color: "#00ff87" }}
          >
            {titleLabel}
          </h1>
          <p className="text-[13px] text-white/65 mt-1">
            {subtitle} ·{" "}
            <span className="text-white font-semibold">
              {total} {total === 1 ? "jogo" : "jogos"}
            </span>
            {liveGames.length > 0 && (
              <>
                {" · "}
                <span className="text-[#ff3b3b] font-bold">
                  {liveGames.length} ao vivo
                </span>
              </>
            )}
          </p>
        </div>

        {/* Loading */}
        {isLoading && <AgendaSkeleton />}

        {/* Empty */}
        {!isLoading && total === 0 && (
          <EmptyDayState onSeeTomorrow={() => goToDate(offsetDateStr(date, 1))} />
        )}

        {!isLoading && total > 0 && (
          <>
            {/* AO VIVO HERO */}
            {isToday && liveGames.length > 0 && <LiveHeroCard games={liveGames} />}

            {/* Em Breve — fixo, sempre visível independente do filtro */}
            {highlights.length > 0 && <HighlightsCarousel highlights={highlights} />}

            {/* CTA Assine premium */}
            <Link
              to="/assinar"
              className="group mb-5 flex items-center justify-between gap-2 rounded-2xl px-4 h-14 active:scale-[0.99] transition-all shadow-lg shadow-[#00ff87]/20 hover:shadow-[#00ff87]/35 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #00ff87 0%, #00e07a 100%)",
                color: "#07080a",
              }}
              aria-label="Assine já o Canal do Brito"
            >
              {/* Shine sweep */}
              <motion.span
                aria-hidden
                className="absolute inset-y-0 -left-1/3 w-1/3 motion-reduce:hidden"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
                }}
                animate={{ x: ["0%", "420%"] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
              />
              <div className="flex items-center gap-2.5 min-w-0 relative">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-[#07080a]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0 leading-none">
                  <p
                    className="font-bold tracking-wide whitespace-nowrap"
                    style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "20px", lineHeight: 1 }}
                  >
                    ASSINE JÁ · R$ 35/MÊS
                  </p>
                  <p className="text-[10.5px] font-medium opacity-75 mt-1 whitespace-nowrap">
                    Esportes · Filmes · Séries
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 relative" />
            </Link>

            {/* Filtros */}
            {sportsSorted.length > 0 && (
              <SportFilterBar
                active={filter}
                onChange={setFilter}
                totalCount={total}
                liveCount={liveGames.length}
                countsBySport={countsBySport}
                sportOrder={sportsSorted}
              />
            )}

            {/* Agrupamentos */}
            {visibleSports.map((sport) => (
              <SportSection
                key={sport}
                sport={sport}
                games={filteredGroup(sport)}
              />
            ))}

            {/* Caso filtro ao vivo sem jogos */}
            {filter === "live" &&
              visibleSports.every((s) => filteredGroup(s).length === 0) && (
                <div className="text-center py-12 text-white/55 text-sm">
                  Nenhum jogo ao vivo no momento.
                </div>
              )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white/75 transition"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar para o app
          </Link>
          <p className="text-[11px] text-white/25 mt-2">canaldobrito.site</p>
        </div>
      </div>

      <ShareBar games={games} date={date} />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AgendaPublica;
