import { Search, X, ArrowDownAZ, Clock3 } from "lucide-react";

export type StatusFilter = "all" | "live" | "soon" | "ended";
export type SortMode = "sport" | "time";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  statusCounts: Record<StatusFilter, number>;
  sort: SortMode;
  onSort: (v: SortMode) => void;
  channels: { key: string; name: string; count: number }[];
  channel: string | null;
  onChannel: (v: string | null) => void;
}

const STATUS_CHIPS: { value: StatusFilter; label: string; dot?: string }[] = [
  { value: "all", label: "Todos" },
  { value: "live", label: "Ao vivo", dot: "#ff3b3b" },
  { value: "soon", label: "Em breve", dot: "#fbbf24" },
  { value: "ended", label: "Encerrados", dot: "rgba(255,255,255,0.35)" },
];

const chipBase =
  "shrink-0 h-10 px-3.5 inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold border transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff87]/60";

export const ScheduleToolbar = ({
  search,
  onSearch,
  status,
  onStatus,
  statusCounts,
  sort,
  onSort,
  channels,
  channel,
  onChannel,
}: Props) => {
  return (
    <div className="mb-4 space-y-2.5">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar time, competição ou canal"
          aria-label="Buscar time, competição ou canal"
          enterKeyHint="search"
          className="w-full h-11 pl-9 pr-10 rounded-xl bg-white/[0.05] border border-white/10 text-[14px] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00ff87]/50 focus:border-transparent"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch("")}
            aria-label="Limpar busca"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status + ordenação */}
      <div
        className="-mx-4 px-4 flex items-center gap-2 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: "none" }}
        role="toolbar"
        aria-label="Filtrar por status e ordenar"
      >
        {STATUS_CHIPS.map((c) => {
          const active = c.value === status;
          const count = statusCounts[c.value];
          if (c.value !== "all" && count === 0 && !active) return null;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onStatus(c.value)}
              aria-pressed={active}
              className={chipBase}
              style={{
                color: active ? "#07080a" : "#fff",
                background: active ? (c.value === "live" ? "#ff3b3b" : "#00ff87") : "rgba(255,255,255,0.05)",
                borderColor: active ? "transparent" : "rgba(255,255,255,0.10)",
              }}
            >
              {c.dot && !active && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} aria-hidden />
              )}
              {c.label}
              <span
                className="text-[10.5px] px-1.5 rounded-full font-bold tabular-nums"
                style={{
                  background: active ? "rgba(7,8,10,0.18)" : "rgba(255,255,255,0.10)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}

        <span className="w-px h-6 bg-white/10 shrink-0 mx-0.5" aria-hidden />

        <div className="shrink-0 inline-flex rounded-full border border-white/10 bg-white/[0.05] p-0.5" role="group" aria-label="Organizar">
          {(
            [
              { value: "sport", label: "Por esporte", Icon: ArrowDownAZ },
              { value: "time", label: "Por horário", Icon: Clock3 },
            ] as const
          ).map(({ value, label, Icon }) => {
            const active = sort === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSort(value)}
                aria-pressed={active}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-full text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff87]/60"
                style={{
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.6)",
                }}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Canais */}
      {channels.length > 1 && (
        <div
          className="-mx-4 px-4 flex items-center gap-2 overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: "none" }}
          role="toolbar"
          aria-label="Filtrar por canal"
        >
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/40 font-bold">📺 Canal</span>
          <button
            type="button"
            onClick={() => onChannel(null)}
            aria-pressed={channel === null}
            className={`${chipBase} h-9 text-[12px]`}
            style={{
              color: channel === null ? "#07080a" : "#fff",
              background: channel === null ? "#00ff87" : "rgba(255,255,255,0.05)",
              borderColor: channel === null ? "transparent" : "rgba(255,255,255,0.10)",
            }}
          >
            Todos
          </button>
          {channels.map((ch) => {
            const active = channel === ch.key;
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => onChannel(active ? null : ch.key)}
                aria-pressed={active}
                className={`${chipBase} h-9 text-[12px]`}
                style={{
                  color: active ? "#07080a" : "#fff",
                  background: active ? "#00ff87" : "rgba(255,255,255,0.05)",
                  borderColor: active ? "transparent" : "rgba(255,255,255,0.10)",
                }}
              >
                <span className="max-w-[140px] truncate">{ch.name}</span>
                <span className="text-[10px] opacity-60 tabular-nums">{ch.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
