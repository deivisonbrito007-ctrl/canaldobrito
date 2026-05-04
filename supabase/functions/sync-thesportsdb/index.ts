// TheSportsDB Premium → daily_games (multi-sport).
// V1 endpoints (premium key). Cobre futebol e 13 outros esportes em uma única chave.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// strSport (TheSportsDB) → sport_type interno
const SPORT_MAP: Record<string, string> = {
  Soccer: "football",
  Basketball: "basketball",
  Tennis: "tennis",
  Motorsport: "f1",
  Fighting: "mma",
  Volleyball: "volleyball",
  "Ice Hockey": "hockey",
  Baseball: "baseball",
  Rugby: "rugby",
  Cycling: "cycling",
  "American Football": "football", // mapeia NFL para 'football' (enum não tem 'nfl' separado)
  Golf: "golf",
  Surfing: "surf",
};

// Esportes que vamos sincronizar diariamente (chave = strSport TheSportsDB)
const SPORTS_TO_SYNC = [
  "Soccer",
  "Basketball",
  "Tennis",
  "Motorsport",
  "Fighting",
  "Volleyball",
  "Ice Hockey",
  "Baseball",
  "American Football",
  "Golf",
  "Cycling",
];

function todayBRT(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

// Combina dateEvent (UTC) + strTime (HH:MM:SS UTC) → { date, time } em America/Sao_Paulo
function toBRT(dateEvent: string, strTime: string | null): { date: string; time: string } | null {
  if (!dateEvent) return null;
  const t = (strTime && /^\d{2}:\d{2}/.test(strTime)) ? strTime.slice(0, 8) : "00:00:00";
  const iso = `${dateEvent}T${t}Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  const dt = new Date(ms);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(dt);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(dt);
  return { date, time };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("THESPORTSDB_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "THESPORTSDB_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date") || todayBRT();
    if (!isValidDate(dateParam)) {
      return new Response(JSON.stringify({ error: "invalid date (YYYY-MM-DD)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sportsParam = url.searchParams.get("sports");
    const sports = sportsParam ? sportsParam.split(",").map((s) => s.trim()).filter(Boolean) : SPORTS_TO_SYNC;
    const fetchTV = url.searchParams.get("tv") !== "false";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const base = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;
    const allRows: any[] = [];
    const errors: string[] = [];
    const perSport: Record<string, number> = {};

    // Para a data alvo (já em BRT), precisamos consultar dateEvent UTC equivalente.
    // TheSportsDB indexa por dateEvent (UTC). Para garantir cobertura, consultamos dateParam e dateParam-1d e dateParam+1d, e filtramos depois pela data BRT real.
    const candidateDates = (() => {
      const ms = Date.parse(`${dateParam}T12:00:00Z`);
      const out = new Set<string>();
      for (const off of [-1, 0, 1]) {
        const d = new Date(ms + off * 86400_000);
        out.add(d.toISOString().slice(0, 10));
      }
      return [...out];
    })();

    // Pré-busca TODA a programação de TV do dia em uma única chamada (eventstv.php).
    // FILTRO ESTRITO: apenas canais transmitidos no Brasil (strCountry === "Brazil")
    // OU nomes de canais conhecidos como brasileiros/globais disponíveis no Brasil.
    const tvByEvent = new Map<string, string[]>();
    // Heurística: nomes de canais que sabidamente operam no Brasil mesmo quando a API marca outro país
    const BR_CHANNEL_HINTS = [
      "globo", "sportv", "sporttv", "premiere", "band", "espn brasil", "espn br",
      "tnt sports brasil", "tnt brasil", "cazé", "caze", "cazétv", "cazetv",
      "nsports", "n sports", "disney+", "disney plus", "max", "hbo max",
      "amazon prime video brasil", "prime video brasil", "paramount+ brasil",
      "apple tv", "youtube", "twitch", "x sports", "rede tv", "sbt", "record",
      "f1 tv", "ufc fight pass", "nba league pass",
    ];
    const isBrazilChannel = (country: string, channel: string) => {
      if ((country || "").trim().toLowerCase() === "brazil") return true;
      const c = (channel || "").toLowerCase();
      return BR_CHANNEL_HINTS.some((h) => c.includes(h));
    };

    if (fetchTV) {
      for (const d of candidateDates) {
        try {
          const tvR = await fetch(`${base}/eventstv.php?d=${d}`);
          if (!tvR.ok) { errors.push(`tv@${d}: HTTP ${tvR.status}`); continue; }
          const tvJ = await tvR.json();
          const list: any[] = Array.isArray(tvJ?.tvevents) ? tvJ.tvevents
            : Array.isArray(tvJ?.tvevent) ? tvJ.tvevent : [];
          for (const t of list) {
            const id = String(t.idEvent || "");
            if (!id) continue;
            const ch = (t.strChannel || "").trim();
            if (!ch) continue;
            // ⚠️ Só aceita canais do Brasil (ou marcas globais conhecidas no BR)
            if (!isBrazilChannel(t.strCountry || "", ch)) continue;
            if (!tvByEvent.has(id)) tvByEvent.set(id, []);
            const arr = tvByEvent.get(id)!;
            if (!arr.some((x) => x.toLowerCase() === ch.toLowerCase())) {
              arr.push(ch);
            }
          }
        } catch (e) { errors.push(`tv@${d}: ${(e as Error).message}`); }
      }
    }

    for (const sport of sports) {
      let countForSport = 0;
      const rawEvents: any[] = [];
      for (const d of candidateDates) {
        const apiUrl = `${base}/eventsday.php?d=${d}&s=${encodeURIComponent(sport)}`;
        const r = await fetch(apiUrl);
        if (!r.ok) { errors.push(`${sport}@${d}: HTTP ${r.status}`); continue; }
        const j = await r.json();
        if (Array.isArray(j?.events)) rawEvents.push(...j.events);
      }

      for (const ev of rawEvents) {
        const brt = toBRT(ev.dateEvent, ev.strTime ?? ev.strTimestamp ?? null);
        if (!brt || brt.date !== dateParam) continue;

        const sportType = SPORT_MAP[sport] || "football";
        const home = ev.strHomeTeam || ev.strEvent || "TBD";
        const away = ev.strAwayTeam || "—";
        const competition = ev.strLeague || sport;
        const competitionDetail = ev.strSeason ? `${ev.strSeason}${ev.intRound ? ` • R${ev.intRound}` : ""}` : (ev.intRound ? `R${ev.intRound}` : null);

        // Pega canais do índice pré-construído + limita a 6 para não poluir
        const channels: string[] = (tvByEvent.get(String(ev.idEvent)) || []).slice(0, 6);


        allRows.push({
          date: brt.date,
          home_team: home,
          away_team: away,
          competition,
          competition_detail: competitionDetail,
          game_time: brt.time,
          channels,
          is_live: false,
          is_womens: false,
          active: true,
          archived: false,
          status_short: "NS",
          elapsed_minutes: null,
          sport_type: sportType,
          source: "thesportsdb",
          external_id: `tsdb:${ev.idEvent}`,
        });
        countForSport++;
      }
      perSport[sport] = countForSport;
    }

    // Pré-busca TODAS as linhas existentes da data alvo numa única query, indexa em memória.
    const { data: existingRows } = await supabase
      .from("daily_games")
      .select("id, source, channels, external_id, date, home_team, away_team, game_time")
      .eq("date", dateParam);

    const matchKey = (d: string, h: string, a: string, t: string) =>
      `${d}|${h.trim().toLowerCase()}|${a.trim().toLowerCase()}|${t}`;
    const existingMap = new Map<string, any>();
    for (const r of existingRows || []) {
      existingMap.set(matchKey(r.date, r.home_team, r.away_team, r.game_time), r);
    }

    let upserted = 0;
    let skipped = 0;

    // Processa em batches paralelos de 10
    const BATCH = 10;
    for (let i = 0; i < allRows.length; i += BATCH) {
      const slice = allRows.slice(i, i + BATCH);
      const results = await Promise.all(slice.map(async (row) => {
        const existing = existingMap.get(matchKey(row.date, row.home_team, row.away_team, row.game_time));
        if (existing) {
          const existingChannels: string[] = Array.isArray(existing.channels) ? existing.channels : [];
          const merged = Array.from(new Set([...existingChannels, ...row.channels]));
          const { error } = await supabase.from("daily_games").update({
            competition: row.competition,
            competition_detail: row.competition_detail,
            channels: merged,
            sport_type: row.sport_type,
            external_id: row.external_id,
            source: existing.source === "manual" ? "manual" : "thesportsdb",
          }).eq("id", existing.id);
          return error ? "skip" : "ok";
        } else {
          const { error } = await supabase.from("daily_games").insert(row);
          return error ? "skip" : "ok";
        }
      }));
      for (const r of results) { if (r === "ok") upserted++; else skipped++; }
    }

    return new Response(JSON.stringify({
      ok: true, date: dateParam, sports: sports.length, perSport, upserted, skipped, errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[sync-thesportsdb]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
