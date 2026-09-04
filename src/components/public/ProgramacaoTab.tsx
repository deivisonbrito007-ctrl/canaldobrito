import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Radio, Clock } from "lucide-react";
import { PremiumCTA } from "@/components/public/cinema/PremiumCTA";
import { ContinueWatchingSection } from "@/components/public/ContinueWatchingSection";
import { useAllDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import {
  type SportType,
  getLocalDateString,
  getGameStatus,
  midnightInSaoPaulo,
} from "@/lib/gameUtils";
import { gameKey } from "@/lib/dedup";
import { offsetDateStr } from "@/lib/whatsappText";
import { isValidDateParam } from "@/lib/agendaRedirect";
import { normalizeChannelName } from "@/components/public/channelLogos";

import { LiveHeroCard } from "@/components/agenda/public/LiveHeroCard";
import { SportFilterBar, type FilterValue } from "@/components/agenda/public/SportFilterBar";
import { ScheduleToolbar, type StatusFilter, type SortMode } from "@/components/agenda/public/ScheduleToolbar";
import { HighlightsCarousel } from "@/components/agenda/public/HighlightsCarousel";
import { SportSection } from "@/components/agenda/public/SportSection";
import { TimeSection } from "@/components/agenda/public/TimeSection";
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

/** Remove visual duplicates (same teams + time + sport). */
function dedupGames(games: DailyGame[]): DailyGame[] {
  const seen = new Set<string>();
  const out: DailyGame[] = [];
  for (const g of games) {
    const k = `${g.date}|${gameKey(g)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(g);
  }
  return out;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const ProgramacaoTab = () => {
  const [params, setParams] = useSearchParams();
  const today = getLocalDateString();
  const tomorrow = offsetDateStr(today, 1);
  const rawDate = params.get("date");
  const dateIsAllowed = rawDate ? rawDate === today || rawDate === tomorrow : true;
  const date = rawDate && dateIsAllowed ? rawDate : today;

  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>(() =>
    (typeof sessionStorage !== "undefined" && (sessionStorage.getItem("agenda:sort") as SortMode)) || "sport",
  );
  const [channel, setChannel] = useState<string | null>(null);

  useEffect(() => {
    try { sessionStorage.setItem("agenda:sort", sort); } catch { /* noop */ }
  }, [sort]);

  // Defensive cleanup: drop ?date if it's not today/tomorrow (or is malformed).
  useEffect(() => {
    if (rawDate && (!isValidDateParam(rawDate) || !dateIsAllowed)) {
      const next = new URLSearchParams(params);
      next.delete("date");
      setParams(next, { replace: true });
    }
  }, [rawDate, dateIsAllowed, params, setParams]);

  const { data: rawGames, isLoading } = useAllDailyGames(date);
  const { data: tomorrowGamesRaw } = useAllDailyGames(date === today ? tomorrow : today);
  const tomorrowCount = useMemo(
    () => (date === today ? (tomorrowGamesRaw ?? []).filter((g) => !g.archived && g.active).length : 0),
    [tomorrowGamesRaw, date, today],
  );

  const games = useMemo(
    () => dedupGames((rawGames ?? []).filter((g) => !g.archived && g.active)),
    [rawGames]
  );

  // Tick a cada 20s para manter status ao vivo / minuto fresco
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 20000);
    return () => clearInterval(id);
  }, []);

  const isToday = date === today;

  // Status por jogo (recalculado a cada tick)
  const statusById = useMemo(() => {
    const m = new Map<string, ReturnType<typeof getGameStatus>>();
    for (const g of games) m.set(g.id, isToday ? getGameStatus(g) : "upcoming");
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, isToday, tick]);

  const liveGames = useMemo(
    () => games.filter((g) => statusById.get(g.id) === "live"),
    [games, statusById],
  );

  const statusCounts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: games.length, live: 0, soon: 0, ended: 0 };
    for (const g of games) {
      const s = statusById.get(g.id);
      if (s === "live") c.live++;
      else if (s === "soon") c.soon++;
      else if (s === "ended") c.ended++;
    }
    return c;
  }, [games, statusById]);

  const channelOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of games) {
      const seen = new Set<string>();
      for (const ch of g.channels ?? []) {
        const label = normalizeChannelName(ch) || ch.trim();
        if (!label || seen.has(label)) continue;
        seen.add(label);
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 12);
  }, [games]);

  // Pipeline de filtros: busca → status → canal → esporte
  const filtered = useMemo(() => {
    const q = norm(search.trim());
    return games.filter((g) => {
      if (status !== "all" && statusById.get(g.id) !== status) return false;
      if (channel) {
        const has = (g.channels ?? []).some((ch) => (normalizeChannelName(ch) || ch.trim()) === channel);
        if (!has) return false;
      }
      if (q) {
        const hay = norm(
          [g.home_team, g.away_team, g.competition, g.competition_detail, ...(g.channels ?? [])]
            .filter(Boolean)
            .join(" "),
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [games, search, status, channel, statusById]);

  const grouped = useMemo(() => groupBySport(filtered), [filtered]);

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
  const titleLabel = date === today ? "AGENDA DE HOJE" : date === tomorrow ? "AGENDA DE AMANHÃ" : "AGENDA";
  const subtitle = (() => {
    const d = format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
    return d.charAt(0).toUpperCase() + d.slice(1);
  })();

  const resetFilters = useCallback(() => {
    setFilter("all");
    setSearch("");
    setStatus("all");
    setChannel(null);
  }, []);

  const goToDate = (newDate: string) => {
    if (newDate !== today && newDate !== tomorrow) return;
    const next = new URLSearchParams(params);
    if (newDate === today) next.delete("date");
    else next.set("date", newDate);
    resetFilters();
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (date === tomorrow && !isLoading && total === 0) {
      goToDate(today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, tomorrow, today, isLoading, total]);

  // Sport chip "live" é redundante com status; mapeia para o status.
  const handleSportFilter = (v: FilterValue) => {
    if (v === "live") {
      setStatus("live");
      setFilter("all");
    } else {
      setFilter(v);
    }
  };

  const visibleSports: SportType[] =
    filter === "all" || filter === "live" ? sportsSorted : [filter];

  const visibleGames = useMemo(
    () =>
      visibleSports
        .flatMap((s) => grouped[s] ?? [])
        .sort((a, b) => a.game_time.localeCompare(b.game_time)),
    [visibleSports, grouped],
  );

  const hasActiveFilters = !!search || status !== "all" || !!channel || filter !== "all";
  const nothingMatches = !isLoading && total > 0 && visibleGames.length === 0;

  return (
    <div className="mx-auto w-full max-w-[460px] md:max-w-[1100px] px-4 md:px-6 pt-4 pb-6 text-white">
      {/* Título + navegação de dias */}
      <div className="mb-4">
        <div className="flex items-end justify-between gap-2">
          <h1
            className="text-[40px] md:text-[52px] leading-[0.9] tracking-tight"
            style={{ fontFamily: "Bebas Neue, sans-serif", color: "#00ff87" }}
          >
            {titleLabel}
          </h1>
          {(isToday ? tomorrowCount > 0 : true) && (
            <nav className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10 shrink-0" aria-label="Trocar dia">
              {isToday ? (
                <button
                  onClick={() => goToDate(tomorrow)}
                  className="inline-flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-full hover:bg-white/10 active:scale-95 transition text-[11px] font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff87]/60"
                  aria-label={`Ver programação de amanhã (${tomorrowCount} ${tomorrowCount === 1 ? "jogo" : "jogos"})`}
                >
                  Amanhã
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#00ff87]/15 text-[#00ff87] text-[10px] tabular-nums">
                    {tomorrowCount}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                </button>
              ) : (
                <button
                  onClick={() => goToDate(today)}
                  className="inline-flex items-center gap-1 h-9 pl-2 pr-3 rounded-full hover:bg-white/10 active:scale-95 transition text-[11px] font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff87]/60"
                  aria-label="Voltar para hoje"
                >
                  <ChevronLeft className="w-3.5 h-3.5 opacity-70" />
                  Hoje
                </button>
              )}
            </nav>
          )}
        </div>
        <p className="text-[13px] text-white/65 mt-1">
          {subtitle} ·{" "}
          <span className="text-white font-semibold">
            {total} {total === 1 ? "jogo" : "jogos"}
          </span>
          {liveGames.length > 0 && (
            <>
              {" · "}
              <span className="text-[#ff3b3b] font-bold">{liveGames.length} ao vivo</span>
            </>
          )}
          {" · "}
          <span className="text-white/45">Horário de Brasília</span>
        </p>
      </div>

      {isLoading && <AgendaSkeleton />}

      {!isLoading && total === 0 && (
        <EmptyDayState
          onSeeTomorrow={isToday && tomorrowCount > 0 ? () => goToDate(tomorrow) : undefined}
        />
      )}

      {!isLoading && total > 0 && (
        <>
          <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-6 md:items-start">
            <div className="min-w-0">
              {isToday && liveGames.length > 0 && <LiveHeroCard games={liveGames} />}

              {isToday && liveGames.length === 0 && (
                <section
                  className="mb-5 rounded-2xl border px-4 py-3.5 flex items-center gap-3"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(13,13,13,0.6) 100%)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                  aria-label="Sem jogos ao vivo agora"
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
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
                      <p className="text-[12px] text-white/55 mt-1.5 flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 shrink-0" />
                        Próximo:{" "}
                        <span className="text-white/85 font-semibold tabular-nums">
                          {allHighlights[0].game.game_time.slice(0, 5)}
                        </span>
                        <span className="truncate">
                          · {allHighlights[0].game.away_team
                            ? `${allHighlights[0].game.home_team} × ${allHighlights[0].game.away_team}`
                            : allHighlights[0].game.home_team}
                        </span>
                      </p>
                    ) : (
                      <p className="text-[12px] text-white/50 mt-1.5">Confira a programação completa abaixo.</p>
                    )}
                  </div>
                </section>
              )}
            </div>
            <div className="min-w-0">
              {highlights.length > 0 && <HighlightsCarousel highlights={highlights} />}
            </div>
          </div>

          <ScheduleToolbar
            search={search}
            onSearch={setSearch}
            status={status}
            onStatus={setStatus}
            statusCounts={statusCounts}
            sort={sort}
            onSort={setSort}
            channels={channelOptions}
            channel={channel}
            onChannel={setChannel}
          />

          {sportsSorted.length > 0 && sort === "sport" && (
            <SportFilterBar
              active={filter}
              onChange={handleSportFilter}
              totalCount={filtered.length}
              liveCount={0}
              countsBySport={countsBySport}
              sportOrder={sportsSorted}
            />
          )}

          {sort === "sport"
            ? visibleSports.map((sport) => (
                <SportSection key={sport} sport={sport} games={grouped[sport] ?? []} />
              ))
            : <TimeSection games={visibleGames} />}

          {nothingMatches && (
            <div className="text-center py-12">
              <p className="text-white/70 text-sm font-medium">
                {status === "live"
                  ? "Nenhum jogo ao vivo no momento."
                  : status === "soon"
                    ? "Nenhum jogo começando na próxima hora."
                    : "Nenhum jogo encontrado com esses filtros."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-3 min-h-11 px-4 rounded-full text-[#00ff87] text-sm font-semibold border border-[#00ff87]/30 hover:bg-[#00ff87]/10"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          <p className="text-center text-[11px] text-white/35 mt-2 mb-4">
            Todos os horários no Horário de Brasília (GMT-3)
          </p>

          <div className="mt-4">
            <ContinueWatchingSection />
          </div>

          <div className="mt-4 mb-2 md:max-w-[560px] md:mx-auto">
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
