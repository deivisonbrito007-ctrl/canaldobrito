import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import {
  classifyMatch,
  mapSportsApiToDailyGame,
  normalizeKey,
  normalizeSportsApiGame,
  type ChannelRegistry,
  type ExistingGame,
  type SportsApiMatch,
  type ClassifyOptions,
} from "../_shared/sportsApiCore.ts";

const API_BASE = "https://sportsapi.com.br/api/v1";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("sports") }),
  z.object({
    action: z.literal("fetch"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sports: z.array(z.string().min(1).max(40)).max(30).optional(),
  }),
  z.object({ action: z.literal("live"), cron: z.boolean().optional() }),
  z.object({ action: z.literal("import"), ids: z.array(z.string().uuid()).min(1).max(200), active: z.boolean().optional() }),
  z.object({ action: z.literal("ignore"), ids: z.array(z.string().uuid()).min(1).max(200) }),
  z.object({ action: z.literal("update-existing"), id: z.string().uuid() }),
  z.object({ action: z.literal("reclassify"), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
]);

class ApiError extends Error {
  constructor(public status: number, public friendly: string, public raw?: string) {
    super(friendly);
  }
}

// ---------------------------------------------------------------------------
// Chamada à SportsAPI com limite interno e cache curto em memória
// ---------------------------------------------------------------------------

const cache = new Map<string, { at: number; data: unknown }>();
const CACHE_MS = 10 * 60 * 1000;
let windowStart = Date.now();
let windowCount = 0;
const MAX_PER_MIN = 120;

async function apiGet<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const key = Deno.env.get("SPORTSAPI_KEY");
  if (!key) throw new ApiError(500, "Chave da SportsAPI não configurada no servidor.");
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `${API_BASE}${path}?${qs}`;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data as T;

  if (Date.now() - windowStart > 60_000) {
    windowStart = Date.now();
    windowCount = 0;
  }
  if (windowCount >= MAX_PER_MIN) throw new ApiError(429, "Limite interno de requisições por minuto atingido. Tente em instantes.");
  windowCount++;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch(url, { headers: { "X-API-Key": key, Accept: "application/json" }, signal: ctrl.signal });
  } catch (e) {
    throw new ApiError(504, "SportsAPI não respondeu a tempo.", String(e));
  } finally {
    clearTimeout(t);
  }
  const text = await res.text();
  if (res.status === 401 || res.status === 403) throw new ApiError(401, "Chave da SportsAPI inválida ou sem permissão.", text);
  if (res.status === 429) throw new ApiError(429, "Cota da SportsAPI esgotada (429). Aguarde antes de buscar de novo.", text);
  if (res.status === 404) throw new ApiError(404, "Esporte ou recurso não disponível na SportsAPI.", text);
  if (!res.ok) throw new ApiError(502, `SportsAPI retornou erro ${res.status}.`, text);
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(502, "Resposta inválida da SportsAPI.", text.slice(0, 200));
  }
  cache.set(url, { at: Date.now(), data });
  return data as T;
}

type GamesResponse = { matches?: SportsApiMatch[]; data?: SportsApiMatch[]; total?: number };
const extractMatches = (r: GamesResponse): SportsApiMatch[] =>
  Array.isArray(r?.matches) ? r.matches : Array.isArray(r?.data) ? r.data : [];

async function fetchAllGames(sport: string, params: Record<string, string>, max: number): Promise<SportsApiMatch[]> {
  const out: SportsApiMatch[] = [];
  let offset = 0;
  const limit = 100;
  while (out.length < max) {
    const r = await apiGet<GamesResponse>("/games", { sport, ...params, limit, offset });
    const batch = extractMatches(r);
    out.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
    if (offset >= 500) break;
  }
  return out.slice(0, max);
}

// ---------------------------------------------------------------------------
// Helpers de banco
// ---------------------------------------------------------------------------

type Admin = ReturnType<typeof createClient>;

async function loadSettings(db: Admin) {
  const { data } = await db.from("settings").select("key,value").like("key", "sportsapi_%");
  const s: Record<string, string> = {};
  for (const r of data ?? []) s[r.key as string] = r.value as string;
  return {
    enabled: (s.sportsapi_enabled ?? "true") !== "false",
    mode: s.sportsapi_mode ?? "sugestoes",
    sports: (s.sportsapi_sports_enabled ?? "football").split(",").map((x) => x.trim()).filter(Boolean),
    brazilOnly: (s.sportsapi_brazil_only ?? "true") !== "false",
    acceptKnownChannel: (s.sportsapi_accept_known_channel ?? "true") !== "false",
    liveUpdates: (s.sportsapi_live_updates ?? "true") !== "false",
    liveIntervalMin: Number(s.sportsapi_live_interval_min ?? "3") || 3,
    maxPerSport: Math.max(1, Math.min(200, Number(s.sportsapi_max_per_sport ?? "40") || 40)),
    sportsCache: s.sportsapi_sports_cache ?? "",
  };
}

async function loadRegistry(db: Admin): Promise<ChannelRegistry> {
  const [{ data: rows }, { data: aliases }] = await Promise.all([
    db.from("channel_logo_mappings").select("id,name,name_normalized,logo_key,custom_logo_url").eq("active", true),
    db.from("channel_aliases").select("mapping_id,alias_normalized"),
  ]);
  const reg: ChannelRegistry = new Map();
  const byId = new Map<string, { name: string; hasLogo: boolean }>();
  for (const r of rows ?? []) {
    const entry = { name: r.name as string, hasLogo: !!r.custom_logo_url || (!!r.logo_key && r.logo_key !== "none") };
    reg.set((r.name_normalized as string) || normalizeKey(r.name as string), entry);
    byId.set(r.id as string, entry);
  }
  for (const a of aliases ?? []) {
    const e = byId.get(a.mapping_id as string);
    if (e && !reg.has(a.alias_normalized as string)) reg.set(a.alias_normalized as string, e);
  }
  return reg;
}

async function loadExisting(db: Admin, date: string): Promise<ExistingGame[]> {
  const { data } = await db
    .from("daily_games")
    .select("id,date,game_time,sport_type,home_team,away_team,competition,channels,home_score,away_score,external_id")
    .eq("date", date)
    .eq("archived", false);
  return (data ?? []) as ExistingGame[];
}

async function audit(db: Admin, action: string, actor: string | null, payload: Record<string, unknown>) {
  await db.from("audit_logs").insert({ action, entity: "sportsapi", actor_id: actor, payload });
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

async function doFetch(db: Admin, actor: string | null, date: string, sportsOverride?: string[]) {
  const s = await loadSettings(db);
  if (!s.enabled) throw new ApiError(400, "Integração SportsAPI está desativada nas configurações.");
  const sports = sportsOverride?.length ? sportsOverride : s.sports;
  const opts: ClassifyOptions = { brazilOnly: s.brazilOnly, acceptKnownChannel: s.acceptKnownChannel };
  const [registry, existing] = await Promise.all([loadRegistry(db), loadExisting(db, date)]);

  const totals = { found: 0, withTransmission: 0, ignored: 0, ready: 0, review: 0, duplicates: 0 };
  const errors: string[] = [];
  const rows: Record<string, unknown>[] = [];

  for (const sport of sports) {
    let matches: SportsApiMatch[] = [];
    try {
      matches = await fetchAllGames(sport, { date, status: "scheduled" }, s.maxPerSport);
      // Inclui ao vivo/encerrados do dia para não perder jogos já iniciados.
      const live = await fetchAllGames(sport, { date, status: "live" }, 50).catch(() => []);
      const seen = new Set(matches.map((m) => String(m.id)));
      for (const m of live) if (!seen.has(String(m.id))) matches.push(m);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        errors.push(`${sport}: não disponível`);
        continue;
      }
      throw e;
    }
    for (const m of matches) {
      totals.found++;
      const n = normalizeSportsApiGame({ ...m, sport: m.sport ?? sport });
      if (!n) {
        totals.ignored++;
        continue;
      }
      if (n.date !== date) continue; // fuso: jogo cai em outro dia em Brasília
      const c = classifyMatch(n, registry, existing, opts);
      if (c.status !== "ignorado_sem_transmissao") totals.withTransmission++;
      if (c.status === "ignorado_sem_transmissao") totals.ignored++;
      else if (c.status === "pronto_para_importar") totals.ready++;
      else if (c.status === "revisar" || c.status === "conflito" || c.status === "erro") totals.review++;
      else if (c.status === "duplicado") totals.duplicates++;

      rows.push({
        date: n.date,
        external_id: n.external_id,
        sport: n.sport,
        sport_type: n.sport_type,
        title: n.title,
        home_team: n.home_team,
        away_team: n.away_team,
        competition: n.competition,
        competition_country: n.competition_country,
        start_time: n.start_time,
        game_time: n.game_time,
        tv_networks: n.tv_networks,
        normalized_channels: c.normalized_channels,
        broadcast_country: c.broadcast_country,
        api_status: n.api_status,
        home_score: n.home_score,
        away_score: n.away_score,
        live_clock: n.live_clock,
        period: n.period,
        status: c.status,
        warnings: c.warnings,
        matched_game_id: c.matched_game_id,
        payload: { league: m.league ?? null, status: m.status ?? null, tvNetworks: n.tv_networks },
      });
    }
  }

  // Upsert preservando decisões do admin (ignorado/importado)
  if (rows.length) {
    const ids = rows.map((r) => r.external_id as string);
    const { data: prev } = await db
      .from("sportsapi_suggestions")
      .select("external_id,sport,review_status,imported_game_id")
      .in("external_id", ids);
    const prevMap = new Map((prev ?? []).map((p) => [`${p.external_id}|${p.sport}`, p]));
    for (const r of rows) {
      const p = prevMap.get(`${r.external_id}|${r.sport}`);
      if (p?.review_status === "ignored") r.review_status = "ignored";
      if (p?.imported_game_id) {
        r.review_status = "imported";
        r.imported_game_id = p.imported_game_id;
        r.status = "duplicado";
      }
    }
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await db.from("sportsapi_suggestions").upsert(rows.slice(i, i + 200), { onConflict: "external_id,sport" });
      if (error) throw new ApiError(500, "Falha ao salvar sugestões.", error.message);
    }
  }

  const { data: run } = await db
    .from("sportsapi_sync_runs")
    .insert({
      date,
      kind: "fetch",
      sports,
      total_found: totals.found,
      total_with_transmission: totals.withTransmission,
      total_ignored_no_transmission: totals.ignored,
      total_ready: totals.ready,
      total_review: totals.review,
      total_duplicates: totals.duplicates,
      status: errors.length ? "partial" : "ok",
      error_message: errors.join("; ") || null,
      actor_id: actor,
    })
    .select("id")
    .single();

  await audit(db, "sportsapi_fetch", actor, { date, sports, ...totals, errors });
  return { run_id: run?.id ?? null, totals, errors, sports };
}

async function doLive(db: Admin, actor: string | null, fromCron: boolean) {
  const s = await loadSettings(db);
  if (!s.enabled || (fromCron && !s.liveUpdates)) return { updated: 0, skipped: true };
  if (fromCron) {
    // Proteção contra disparos repetidos: respeita o intervalo configurado.
    const { data: last } = await db
      .from("sportsapi_sync_runs")
      .select("created_at")
      .eq("kind", "live-cron")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const minMs = Math.max(2, Number(s.liveIntervalMin) || 3) * 60_000 - 15_000;
    if (last && Date.now() - new Date(last.created_at as string).getTime() < minMs) return { updated: 0, skipped: true, reason: "intervalo" };
  }

  const nowSp = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
  const { data: imported } = await db
    .from("daily_games")
    .select("id,external_id,external_sport,game_time,api_status")
    .eq("date", nowSp)
    .eq("source", "sportsapi")
    .eq("archived", false)
    .not("external_id", "is", null);
  const target = (imported ?? []).filter((g) => g.api_status !== "finished");
  if (target.length === 0) return { updated: 0, checked: 0 };

  const sports = [...new Set(target.map((g) => (g.external_sport as string) || "football"))];
  const byExt = new Map(target.map((g) => [String(g.external_id), g]));
  let updated = 0;
  const liveNow: Record<string, unknown>[] = [];

  for (const sport of sports) {
    let matches: SportsApiMatch[] = [];
    try {
      matches = await fetchAllGames(sport, { status: "live" }, 100);
      const today = await fetchAllGames(sport, { date: nowSp, status: "finished" }, 100).catch(() => []);
      matches = [...matches, ...today];
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 429)) continue;
      throw e;
    }
    for (const m of matches) {
      const g = byExt.get(String(m.id));
      if (!g) continue;
      const n = normalizeSportsApiGame({ ...m, sport: m.sport ?? sport });
      if (!n) continue;
      const { error } = await db
        .from("daily_games")
        .update({
          home_score: n.home_score,
          away_score: n.away_score,
          live_status: n.api_status,
          api_status: n.api_status,
          live_clock: n.live_clock,
          period: n.period,
          is_live: n.api_status === "live",
          status_short: n.api_status === "live" ? "LIVE" : n.api_status === "finished" ? "FT" : "NS",
          live_updated_at: new Date().toISOString(),
          last_api_sync_at: new Date().toISOString(),
        })
        .eq("id", g.id as string);
      if (!error) {
        updated++;
        liveNow.push({ id: g.id, status: n.api_status, score: `${n.home_score ?? "-"}x${n.away_score ?? "-"}` });
      }
    }
  }

  await db.from("sportsapi_sync_runs").insert({
    date: nowSp,
    kind: fromCron ? "live-cron" : "live",
    sports,
    total_found: target.length,
    total_updated: updated,
    status: "ok",
    actor_id: actor,
  });
  if (!fromCron || updated > 0) await audit(db, "sportsapi_live_update", actor, { date: nowSp, checked: target.length, updated, games: liveNow.slice(0, 50) });
  return { updated, checked: target.length };
}

async function doImport(db: Admin, actor: string | null, ids: string[], active: boolean) {
  const { data: sugg, error } = await db.from("sportsapi_suggestions").select("*").in("id", ids);
  if (error) throw new ApiError(500, "Falha ao ler sugestões.", error.message);
  const results: { id: string; ok: boolean; game_id?: string; reason?: string }[] = [];
  for (const sg of sugg ?? []) {
    if (sg.imported_game_id) {
      results.push({ id: sg.id, ok: false, reason: "já importado" });
      continue;
    }
    if (sg.status === "duplicado" || sg.status === "ignorado_sem_transmissao" || sg.status === "erro") {
      results.push({ id: sg.id, ok: false, reason: `status ${sg.status}` });
      continue;
    }
    if (!Array.isArray(sg.normalized_channels) || sg.normalized_channels.length === 0) {
      results.push({ id: sg.id, ok: false, reason: "sem canal válido" });
      continue;
    }
    const n = {
      external_id: sg.external_id,
      sport: sg.sport,
      sport_type: sg.sport_type,
      home_team: sg.home_team,
      away_team: sg.away_team,
      title: sg.title,
      competition: sg.competition,
      competition_country: sg.competition_country,
      start_time: sg.start_time,
      date: sg.date,
      game_time: sg.game_time,
      tv_networks: sg.tv_networks ?? [],
      api_status: sg.api_status ?? "scheduled",
      home_score: sg.home_score,
      away_score: sg.away_score,
      live_clock: sg.live_clock,
      period: sg.period,
    };
    const row = mapSportsApiToDailyGame(n, {
      status: sg.status,
      warnings: sg.warnings ?? [],
      normalized_channels: sg.normalized_channels,
      broadcast_country: sg.broadcast_country,
      matched_game_id: sg.matched_game_id,
    }, active);
    const { data: g, error: insErr } = await db.from("daily_games").insert(row).select("id").single();
    if (insErr) {
      results.push({ id: sg.id, ok: false, reason: insErr.code === "23505" ? "já existe na agenda" : insErr.message });
      continue;
    }
    await db.from("sportsapi_suggestions").update({ review_status: "imported", imported_game_id: g.id }).eq("id", sg.id);
    results.push({ id: sg.id, ok: true, game_id: g.id });
  }
  await audit(db, "sportsapi_import", actor, { requested: ids.length, imported: results.filter((r) => r.ok).length, results });
  return { results };
}

async function doIgnore(db: Admin, actor: string | null, ids: string[]) {
  const { error } = await db.from("sportsapi_suggestions").update({ review_status: "ignored" }).in("id", ids);
  if (error) throw new ApiError(500, "Falha ao ignorar.", error.message);
  await audit(db, "sportsapi_ignore", actor, { ids });
  return { ignored: ids.length };
}

async function doUpdateExisting(db: Admin, actor: string | null, id: string) {
  const { data: sg } = await db.from("sportsapi_suggestions").select("*").eq("id", id).maybeSingle();
  if (!sg?.matched_game_id) throw new ApiError(400, "Sugestão sem jogo correspondente na agenda.");
  const { data: game } = await db.from("daily_games").select("channels").eq("id", sg.matched_game_id).maybeSingle();
  const merged = [...new Set([...(game?.channels ?? []), ...(sg.normalized_channels ?? [])])];
  const { error } = await db
    .from("daily_games")
    .update({
      channels: merged,
      external_source: "sportsapi",
      external_id: sg.external_id,
      external_sport: sg.sport,
      api_status: sg.api_status,
      live_status: sg.api_status,
      home_score: sg.home_score,
      away_score: sg.away_score,
      live_clock: sg.live_clock,
      period: sg.period,
      broadcast_country: sg.broadcast_country,
      last_api_sync_at: new Date().toISOString(),
    })
    .eq("id", sg.matched_game_id);
  if (error) throw new ApiError(500, "Falha ao atualizar jogo.", error.message);
  await db.from("sportsapi_suggestions").update({ review_status: "imported", imported_game_id: sg.matched_game_id }).eq("id", id);
  await audit(db, "sportsapi_update_existing", actor, { suggestion: id, game: sg.matched_game_id, channels: merged });
  return { game_id: sg.matched_game_id, channels: merged };
}

async function doSports(db: Admin) {
  const s = await loadSettings(db);
  if (s.sportsCache) {
    try {
      const c = JSON.parse(s.sportsCache);
      if (c.at && Date.now() - c.at < 24 * 3600_000 && Array.isArray(c.sports)) return { sports: c.sports, cached: true };
    } catch { /* ignore */ }
  }
  const r = await apiGet<{ sports?: unknown[]; data?: unknown[] }>("/sports", {});
  const raw = Array.isArray(r?.sports) ? r.sports : Array.isArray(r?.data) ? r.data : Array.isArray(r) ? (r as unknown[]) : [];
  const sports = raw
    .map((x) => (typeof x === "string" ? { id: x, name: x } : { id: String((x as { id?: string; slug?: string; key?: string }).id ?? (x as { slug?: string }).slug ?? (x as { key?: string }).key ?? ""), name: String((x as { name?: string }).name ?? (x as { id?: string }).id ?? "") }))
    .filter((x) => x.id);
  const value = JSON.stringify({ at: Date.now(), sports });
  const { data: existing } = await db.from("settings").select("id").eq("key", "sportsapi_sports_cache").maybeSingle();
  if (existing) await db.from("settings").update({ value }).eq("key", "sportsapi_sports_cache");
  else await db.from("settings").insert({ key: "sportsapi_sports_cache", value });
  return { sports, cached: false };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corpo inválido." }, 400);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return json({ error: "Parâmetros inválidos.", details: parsed.error.flatten() }, 400);
  const input = parsed.data;

  // Autenticação: admin logado, ou chamada interna (cron) com a service role.
  let actor: string | null = null;
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const isServiceCall = !!token && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isCron = input.action === "live" && input.cron === true && (isServiceCall || req.headers.get("x-cron-secret") === Deno.env.get("SUPABASE_ANON_KEY"));

  if (!isCron) {
    if (!token) return json({ error: "Faça login para usar a SportsAPI." }, 401);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessão inválida." }, 401);
    actor = userData.user.id;
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: actor, _role: "admin" });
    if (!isAdmin) return json({ error: "Apenas administradores." }, 403);
  }

  try {
    switch (input.action) {
      case "sports":
        return json(await doSports(db));
      case "fetch":
        return json(await doFetch(db, actor, input.date, input.sports));
      case "live":
        return json(await doLive(db, actor, !!input.cron));
      case "import":
        return json(await doImport(db, actor, input.ids, input.active ?? true));
      case "ignore":
        return json(await doIgnore(db, actor, input.ids));
      case "update-existing":
        return json(await doUpdateExisting(db, actor, input.id));
      case "reclassify":
        return json(await doFetch(db, actor, input.date));
    }
  } catch (e) {
    if (e instanceof ApiError) {
      console.error("sportsapi error", e.status, e.friendly, e.raw?.slice(0, 300));
      await audit(db, "sportsapi_error", actor, { action: input.action, status: e.status, message: e.friendly }).catch(() => {});
      return json({ error: e.friendly, code: e.status }, e.status >= 500 ? 502 : e.status);
    }
    console.error("sportsapi unexpected", e);
    return json({ error: "Erro inesperado na integração SportsAPI." }, 500);
  }
});
