import { Zap } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

type Sport = "football" | "basketball" | "volleyball" | "tennis" | "other";

interface LiveEvent {
  id: string;
  league: string;
  sport: Sport;
  homeTeam?: string;
  awayTeam?: string;
  gender?: string;
  eventName?: string;
  eventSub?: string;
  startTime: string;
  channel: string;
  channelColor: string;
  isLive: boolean;
}

const SPORT_ACCENT: Record<Sport, string> = {
  football: "#e74c3c",
  basketball: "#3498db",
  volleyball: "#9b59b6",
  tennis: "#27ae60",
  other: "#e67e22",
};

const SPORT_EMOJI: Record<Sport, string> = {
  football: "⚽",
  basketball: "🏀",
  volleyball: "🏐",
  tennis: "🎾",
  other: "🏁",
};

const SAMPLE_EVENTS: LiveEvent[] = [
  { id: "1", sport: "basketball", league: "NBA League Pass", homeTeam: "Boston Celtics", awayTeam: "Memphis Grizzlies", startTime: "21:00", channel: "NBA Pass", channelColor: "#003087", isLive: true },
  { id: "2", sport: "volleyball", league: "Vôlei", homeTeam: "Osasco/São Cristóvão", awayTeam: "Dentil Praia Clube", gender: "Feminino", startTime: "21:00", channel: "SporTV 2", channelColor: "#27ae60", isLive: true },
  { id: "3", sport: "football", league: "Brasileirão Feminino", homeTeam: "Flamengo", awayTeam: "Cruzeiro", gender: "Feminino", startTime: "21:00", channel: "SporTV", channelColor: "#2ecc71", isLive: true },
  { id: "4", sport: "other", league: "Campeonato Argentino", homeTeam: "Atlético Tucumán", awayTeam: "Gimnasia La Plata", startTime: "21:00", channel: "Disney+", channelColor: "#003087", isLive: true },
  { id: "5", sport: "tennis", league: "Tênis · Indian Wells", eventName: "ATP e WTA", eventSub: "Indian Wells Masters", startTime: "20:00", channel: "ESPN 2", channelColor: "#cc1122", isLive: true },
];

const LiveCard = ({ event }: { event: LiveEvent }) => {
  const accent = SPORT_ACCENT[event.sport];
  const emoji = SPORT_EMOJI[event.sport];
  const isHeadToHead = !!(event.homeTeam && event.awayTeam);

  return (
    <div className="min-w-[240px] w-[240px] shrink-0 snap-start">
      <div
        className="rounded-[14px] overflow-hidden transition-colors duration-200"
        style={{
          background: "#1a1d2e",
          border: "1px solid #2a2d3e",
        }}
      >
        {/* Accent bar */}
        <div className="h-[3px]" style={{ background: accent }} />

        <div className="p-3 space-y-2.5">
          {/* Top row: league + live dot */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider truncate text-[#8b8fa3] font-body">
              {emoji} {event.league}
            </p>
            {event.isLive && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#e74c3c] animate-[livePulse_1.5s_ease-in-out_infinite]" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e74c3c]" />
                </span>
                <span className="text-[10px] font-bold text-[#e74c3c] font-body">Ao vivo</span>
              </div>
            )}
          </div>

          {/* Teams / Event */}
          {isHeadToHead ? (
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white leading-tight font-body line-clamp-2">
                    {event.homeTeam}
                  </p>
                  {event.gender && (
                    <p className="text-[10px] text-[#6b6f82] font-body mt-0.5">{event.gender}</p>
                  )}
                </div>
                <span className="text-[10px] text-[#6b6f82] font-body shrink-0 pt-0.5">vs</span>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[13px] font-bold text-white leading-tight font-body line-clamp-2">
                    {event.awayTeam}
                  </p>
                  {event.gender && (
                    <p className="text-[10px] text-[#6b6f82] font-body mt-0.5">{event.gender}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="text-[13px] font-bold text-white leading-tight font-body line-clamp-2">
                {event.eventName}
              </p>
              {event.eventSub && (
                <p className="text-[11px] text-[#6b6f82] font-body">{event.eventSub}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 flex items-center justify-between gap-2" style={{ borderTop: "1px solid #2a2d3e" }}>
          <span className="text-[10px] text-[#6b6f82] font-body">
            Começou {event.startTime}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full font-body text-white/90"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: event.channelColor }} />
            {event.channel}
          </span>
        </div>
      </div>
    </div>
  );
};

export const LiveFeedSection = () => {
  const liveCount = SAMPLE_EVENTS.filter((e) => e.isLive).length;

  return (
    <section className="space-y-3">
      <div className="px-4">
        <SectionHeader
          icon={Zap}
          title="Ao Vivo"
          subtitle="Acompanhe os jogos em tempo real"
          badge={
            liveCount > 0 ? (
              <span className="text-[10px] bg-destructive/15 text-destructive rounded-full px-2 py-0.5 font-bold font-body tabular-nums animate-pulse">
                {liveCount} ao vivo
              </span>
            ) : undefined
          }
        />
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory">
        {SAMPLE_EVENTS.map((event) => (
          <LiveCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
};
