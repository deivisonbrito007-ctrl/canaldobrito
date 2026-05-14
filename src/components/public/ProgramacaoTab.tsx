import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Radio, Clock } from "lucide-react";
import { PremiumCTA } from "@/components/public/cinema/PremiumCTA";
import { useAllDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import {
  type SportType,
  getLocalDateString,
  isGameCurrentlyLive,
  midnightInSaoPaulo,
} from "@/lib/gameUtils";
import { offsetDateStr } from "@/lib/whatsappText";
import { isValidDateParam } from "@/lib/agendaRedirect";

import { LiveHeroCard } from "@/components/agenda/public/LiveHeroCard";
import { SportFilterBar, type FilterValue } from "@/components/agenda/public/SportFilterBar";
import { HighlightsCarousel } from "@/components/agenda/public/HighlightsCarousel";
import { SportSection } from "@/components/agenda/public/SportSection";
import { EmptyDayState } from "@/components/agenda/public/EmptyDayState";
import { AgendaSkeleton } from "@/components/agenda/public/AgendaSkeleton";
import { curateHighlights, detectedSport } from "@/components/agenda/public/highlightsCuration";

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

const ProgramacaoTab = () => {
  const [params, setParams] = useSearchParams();
  const today = getLocalDateString();
  const rawDate = params.get("date");
  const dateIsValid = rawDate ? isValidDateParam(rawDate) : true;
  const date = rawDate && dateIsValid ? rawDate : today;
  const [filter, setFilter] = useState<FilterValue>("all");

  // Defensive cleanup: if URL has an invalid ?date, drop only that param
  // and keep UTMs/others. replace:true avoids polluting history.
  useEffect(() => {
    if (rawDate && !dateIsValid) {
      const next = new URLSearchParams(params);
      next.delete("date");
      setParams(next, { replace: true });
    }
  }, [rawDate, dateIsValid, params, setParams]);

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
    <div className="mx-auto w-full max-w-[460px] px-4 pt-4 pb-6 text-white">
      {/* Título + navegação de dias */}
      <div className="mb-4">
        <div className="flex items-end justify-between gap-2">
          <h1
            className="text-[40px] leading-[0.9] tracking-tight"
            style={{ fontFamily: "Bebas Neue, sans-serif", color: "#00ff87" }}
          >
            {titleLabel}
          </h1>
          <nav className="flex items-center gap-0.5 bg-white/5 rounded-full p-1 border border-white/10 shrink-0">
            <button
              onClick={() => goToDate(offsetDateStr(date, -1))}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToDate(today)}
              className="text-[11px] px-2.5 h-8 rounded-full hover:bg-white/10 transition font-bold uppercase tracking-wider"
              aria-label="Voltar para hoje"
            >
              {isToday ? "Hoje" : format(dateObj, "dd/MM")}
            </button>
            <button
              onClick={() => goToDate(offsetDateStr(date, 1))}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition"
              aria-label="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
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

          {/* Placeholder: hoje, sem jogos ao vivo */}
          {isToday && liveGames.length === 0 && (
            <section
              className="mb-5 rounded-2xl border px-4 py-3.5 flex items-center gap-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(13,13,13,0.6) 100%)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
              aria-label="Sem jogos ao vivo agora"
            >
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Radio className="w-4 h-4 text-white/55" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[15px] uppercase tracking-wide leading-none text-white/85"
                  style={{ fontFamily: "Bebas Neue, sans-serif" }}
                >
                  Sem jogos ao vivo agora
                </p>
                {allHighlights.length > 0 ? (
                  <p className="text-[11.5px] text-white/55 mt-1.5 flex items-center gap-1 truncate">
                    <Clock className="w-3 h-3 shrink-0" />
                    Próximo: <span className="text-white/85 font-semibold tabular-nums">{allHighlights[0].game.game_time.slice(0, 5)}</span>
                    <span className="truncate">
                      · {allHighlights[0].game.away_team
                        ? `${allHighlights[0].game.home_team} × ${allHighlights[0].game.away_team}`
                        : allHighlights[0].game.home_team}
                    </span>
                  </p>
                ) : (
                  <p className="text-[11.5px] text-white/50 mt-1.5">
                    Confira a programação completa abaixo.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Em Breve — fixo, sempre visível independente do filtro */}
          {highlights.length > 0 && <HighlightsCarousel highlights={highlights} />}

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

          {filter === "live" &&
            visibleSports.every((s) => filteredGroup(s).length === 0) && (
              <div className="text-center py-12 text-white/55 text-sm">
                Nenhum jogo ao vivo no momento.
              </div>
            )}

          {/* CTA Assine premium — ao final da página */}
          <div className="mt-4 mb-2">
            <PremiumCTA from="programacao-bottom" />
          </div>
        </>
      )}

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ProgramacaoTab;
