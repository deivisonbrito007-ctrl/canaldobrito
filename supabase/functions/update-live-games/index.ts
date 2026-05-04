// Atualiza is_live / status_short / elapsed_minutes de jogos vindos da API-Football.
// Roda a cada 5 min via cron. Sem inserts — só updates por external_id.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("API_FOOTBALL_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API_FOOTBALL_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Otimização de rate limit: só roda se houver jogos hoje vindos da API.
    const todayBRT = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const { data: todays, error: qErr } = await supabase
      .from("daily_games")
      .select("external_id")
      .eq("date", todayBRT)
      .eq("source", "api-football")
      .not("external_id", "is", null);
    if (qErr) throw qErr;

    if (!todays || todays.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, skipped: "no api-football games today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Busca todos os fixtures live da API (1 chamada).
    const r = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
      headers: { "x-apisports-key": apiKey },
    });
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `API ${r.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await r.json();
    const liveIds = new Set(
      todays.map((t: any) => t.external_id).filter(Boolean),
    );

    let updated = 0;
    const liveExternalIds: string[] = [];

    for (const f of json.response || []) {
      const extId = String(f.fixture.id);
      if (!liveIds.has(extId)) continue;
      liveExternalIds.push(extId);
      const status = f.fixture.status?.short || "NS";
      const elapsed = f.fixture.status?.elapsed ?? null;
      const isLive = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status);
      const { error } = await supabase
        .from("daily_games")
        .update({
          is_live: isLive,
          status_short: status,
          elapsed_minutes: elapsed,
        })
        .eq("external_id", extId);
      if (!error) updated++;
    }

    // Marca como não-live os jogos que estavam live mas saíram da lista (terminaram).
    const stillLiveSet = new Set(liveExternalIds);
    const toFinish = todays
      .map((t: any) => t.external_id)
      .filter((id: string) => id && !stillLiveSet.has(id));
    if (toFinish.length > 0) {
      await supabase
        .from("daily_games")
        .update({ is_live: false })
        .in("external_id", toFinish)
        .eq("is_live", true);
    }

    return new Response(
      JSON.stringify({ ok: true, todaysApiGames: todays.length, updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[update-live-games]", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
