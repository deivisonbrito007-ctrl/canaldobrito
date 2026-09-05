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
  toSaoPauloDateTime,
  findExistingGame,
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
  z.object({ action: z.literal("cron") }),
  z.object({ action: z.literal("auto-fetch") }),
  z.object({ action: z.literal("status") }),
  z.object({ action: z.literal("test") }),
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
/** Cache por tipo de consulta: sugestões 15 min, ao vivo 30 s, esportes 24 h. */
const cacheTtl = (path: string, params: Record<string, string | number>) => {
  if (path === "/sports") return 24 * 3600_000;
  if (params.status === "live") return 30_000;
  return 15 * 60_000;
};
let windowStart = Date.now();
let windowCount = 0;
const MAX_PER_MIN = 120;
/** Requisições reais feitas à API nesta invocação (para cota). */
let requestsThisRun = 0;

async function apiGet<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const key = Deno.env.get("SPORTSAPI_KEY");
  if (!key) throw new ApiError(500, "Chave da SportsAPI não configurada no servidor.");
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `${API_BASE}${path}?${qs}`;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < cacheTtl(path, params)) return hit.data as T;

  if (Date.now() - windowStart > 60_000) {
    windowStart = Date.now();
    windowCount = 0;
  }
  if (windowCount >= MAX_PER_MIN) throw new ApiError(429, "Limite interno de requisições por minuto atingido. Tente em instantes.");
  windowCount++;
  requestsThisRun++;

  let res!: Response;
  let text = "";
  // 503 DATA_REFRESHING é transitório (coletor da API atualizando cache): tenta de novo com espera curta.
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15_000);
    try {
      res = await fetch(url, { headers: { "X-API-Key": key, Accept: "application/json" }, signal: ctrl.signal });
    } catch (e) {
      throw new ApiError(504, "SportsAPI não respondeu a tempo.", String(e));
    } finally {
      clearTimeout(t);
    }
    text = await res.text();
    if (res.status !== 503 || attempt === 2) break;
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  if (res.status === 503) {
    throw new ApiError(503, "SportsAPI está atualizando os dados agora. Tente de novo em 1–2 minutos.", text);
  }
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
    /** Intervalo quando NÃO há jogo ao vivo publicado (minutos). */
    liveIntervalMin: Math.max(1, Number(s.sportsapi_live_interval_min ?? "3") || 3),
    /** Intervalo quando HÁ jogo ao vivo publicado (segundos; cron roda a cada minuto, então mínimo efetivo 60s). */
    liveIntervalLiveSec: Math.max(30, Number(s.sportsapi_live_interval_live_sec ?? "60") || 60),
    autoFetch: (s.sportsapi_auto_fetch ?? "true") !== "false",
    autoFetchIntervalMin: Math.max(15, Number(s.sportsapi_auto_fetch_interval_min ?? "60") || 60),
    ignoreForeign: (s.sportsapi_ignore_foreign ?? "true") !== "false",
    nightPause: (s.sportsapi_night_pause ?? "true") !== "false",
    dailyBudget: Math.max(500, Number(s.sportsapi_daily_budget ?? "8000") || 8000),
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

const spNow = () => {
  const d = toSaoPauloDateTime(Date.now())!;
  return { date: d.date, hour: Number(d.time.slice(0, 2)) };
};
const addDays = (date: string, n: number) => new Date(Date.parse(date + "T12:00:00Z") + n * 86400_000).toISOString().slice(0, 10);

/** Requisições usadas hoje / no mês (a partir dos registros de execução). */
async function quotaUsage(db: Admin) {
  const { date } = spNow();
  const monthStart = date.slice(0, 7) + "-01";
  const { data } = await db
    .from("sportsapi_sync_runs")
    .select("created_at,requests_used")
    .gte("created_at", monthStart + "T03:00:00Z");
  let day = 0, month = 0;
  const dayStartMs = Date.parse(date + "T03:00:00Z"); // 00:00 em Brasília
  for (const r of data ?? []) {
    const n = Number(r.requests_used) || 0;
    month += n;
    if (Date.parse(r.created_at as string) >= dayStartMs) day += n;
  }
  return { day, month, monthStart };
}

async function lastRunOf(db: Admin, kinds: string[]) {
  const { data } = await db
    .from("sportsapi_sync_runs")
    .select("created_at,kind,status,error_message,total_found,total_updated")
    .in("kind", kinds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

async function doFetch(db: Admin, actor: string | null, date: string, sportsOverride?: string[]) {
  const s = await loadSettings(db);
  if (!s.enabled) throw new ApiError(400, "Integração SportsAPI está desativada nas configurações.");
  const sports = sportsOverride?.length ? sportsOverride : s.sports;
  const opts: ClassifyOptions = { brazilOnly: s.brazilOnly, acceptKnownChannel: s.acceptKnownChannel, ignoreForeign: s.ignoreForeign };
  const [registry, existing] = await Promise.all([loadRegistry(db), loadExisting(db, date)]);

  const totals = { found: 0, withTransmission: 0, ignored: 0, foreign: 0, ready: 0, review: 0, duplicates: 0 };
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
      if (e instanceof ApiError && (e.status === 503 || e.status === 429)) {
        errors.push(`${sport}: ${e.status === 503 ? "API atualizando dados, tente de novo em instantes" : "cota da API atingida"}`);
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
      if (c.status !== "ignorado_sem_transmissao" && c.status !== "ignorado_canal_estrangeiro") totals.withTransmission++;
      if (c.status === "ignorado_sem_transmissao") totals.ignored++;
      else if (c.status === "ignorado_canal_estrangeiro") totals.foreign++;
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
      total_ignored_foreign: totals.foreign,
      total_ready: totals.ready,
      total_review: totals.review,
      total_duplicates: totals.duplicates,
      status: errors.length ? "partial" : "ok",
      error_message: errors.join("; ") || null,
      actor_id: actor,
      requests_used: requestsThisRun,
    })
    .select("id")
    .single();

  await audit(db, actor ? "sportsapi_fetch" : "sportsapi_fetch_auto", actor, { date, sports, ...totals, errors, requests: requestsThisRun });

  // Modo auto-importar: só "pronto" sem canal desconhecido (avisos leves permitidos).
  let autoImported = 0;
  if (s.mode === "auto") {
    const { data: ready } = await db
      .from("sportsapi_suggestions")
      .select("id,warnings")
      .eq("date", date)
      .eq("status", "pronto_para_importar")
      .eq("review_status", "pending");
    const ids = (ready ?? [])
      .filter((r) => !(r.warnings as { code: string }[] | null)?.some((w) => !["canal_sem_logo", "pais_nao_informado"].includes(w.code)))
      .map((r) => r.id as string);
    if (ids.length) {
      const r = await doImport(db, actor, ids, true);
      autoImported = r.results.filter((x) => x.ok).length;
    }
  }
  return { run_id: run?.id ?? null, totals, errors, sports, autoImported };
}

/** Busca automática (cron): hoje e amanhã, respeitando intervalo, horário e cota. */
async function doAutoFetch(db: Admin, force = false) {
  const s = await loadSettings(db);
  if (!s.enabled || !s.autoFetch || s.mode === "manual") return { skipped: true, reason: "desativado" };
  const { date, hour } = spNow();
  if (!force && s.nightPause && (hour < 6 || hour >= 23)) return { skipped: true, reason: "madrugada" };
  const last = await lastRunOf(db, ["fetch-auto"]);
  if (!force && last && Date.now() - Date.parse(last.created_at as string) < s.autoFetchIntervalMin * 60_000 - 20_000) {
    return { skipped: true, reason: "intervalo" };
  }
  const q = await quotaUsage(db);
  if (q.day >= s.dailyBudget) return { skipped: true, reason: "cota_diaria" };

  const out: Record<string, unknown> = {};
  for (const d of [date, addDays(date, 1)]) {
    requestsThisRun = 0;
    try {
      const r = await doFetch(db, null, d);
      out[d] = { totals: r.totals, errors: r.errors, autoImported: r.autoImported };
    } catch (e) {
      out[d] = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  // Marca a execução automática (para o intervalo)
  await db.from("sportsapi_sync_runs").insert({ date, kind: "fetch-auto", sports: s.sports, status: "ok", requests_used: 0 });
  return { skipped: false, dates: out };
}

async function doLive(db: Admin, actor: string | null, fromCron: boolean) {
  const s = await loadSettings(db);
  if (!s.enabled || (fromCron && !s.liveUpdates)) return { updated: 0, checked: 0, skipped: true, reason: "desativado" };
  const { date: nowSp, hour } = spNow();
  const nowMs = Date.now();

  // Jogos publicados hoje (manual ou API) em janela relevante:
  // começa nos próximos 120 min, está em andamento, ou terminou há < 15 min.
  const { data: published } = await db
    .from("daily_games")
    .select("id,source,external_id,external_sport,sport_type,home_team,away_team,competition,channels,game_time,api_status,live_updated_at,date")
    .eq("date", nowSp)
    .eq("archived", false)
    .eq("active", true)
    .in("source", ["manual", "sportsapi"]);
  const startMs = (t: string) => Date.parse(`${nowSp}T${t.slice(0, 8).padEnd(8, ":00".slice(0, 8 - t.slice(0, 8).length))}-03:00`);
  const target = (published ?? []).filter((g) => {
    if (!g.channels || (g.channels as string[]).length === 0) return false;
    const st = startMs(g.game_time as string);
    if (g.api_status === "finished") {
      const upd = g.live_updated_at ? Date.parse(g.live_updated_at as string) : 0;
      return nowMs - upd < 15 * 60_000;
    }
    return st - nowMs <= 120 * 60_000 && nowMs - st <= 6 * 3600_000;
  });
  const anyLive = target.some((g) => g.api_status === "live");

  if (fromCron) {
    if (target.length === 0) return { updated: 0, checked: 0, skipped: true, reason: "sem_jogos_na_janela" };
    if (s.nightPause && hour >= 2 && hour < 6 && !anyLive) return { updated: 0, checked: 0, skipped: true, reason: "madrugada" };
    const last = await lastRunOf(db, ["live-cron"]);
    const q = await quotaUsage(db);
    const nearBudget = q.day >= s.dailyBudget * 0.8;
    // Intervalo adaptativo: com jogo ao vivo usa segundos; sem, usa minutos. Perto da cota, dobra.
    let minMs = anyLive ? s.liveIntervalLiveSec * 1000 : s.liveIntervalMin * 60_000;
    if (nearBudget) minMs *= 2;
    if (q.day >= s.dailyBudget) return { updated: 0, checked: 0, skipped: true, reason: "cota_diaria" };
    if (last && nowMs - Date.parse(last.created_at as string) < minMs - 10_000) return { updated: 0, checked: 0, skipped: true, reason: "intervalo" };
  }
  if (target.length === 0) return { updated: 0, checked: 0 };

  // Esportes: dos jogos-alvo (mapeando sport_type → id da API) + habilitados.
  const sportsOfTargets = target.map((g) => (g.external_sport as string) || sportTypeToApi(g.sport_type as string)).filter(Boolean) as string[];
  const sports = [...new Set(sportsOfTargets)];
  const byExt = new Map(target.filter((g) => g.external_id).map((g) => [String(g.external_id), g]));
  const manualTargets = target.filter((g) => !g.external_id) as unknown as ExistingGame[];
  let updated = 0;
  const liveNow: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (const sport of sports) {
    let matches: SportsApiMatch[] = [];
    try {
      matches = await fetchAllGames(sport, { status: "live" }, 100);
      const today = await fetchAllGames(sport, { date: nowSp }, 200).catch(() => []);
      const seen = new Set(matches.map((m) => String(m.id)));
      for (const m of today) if (!seen.has(String(m.id))) matches.push(m);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 429 || e.status === 503)) {
        errors.push(`${sport}: ${e.status}`);
        continue;
      }
      throw e;
    }
    for (const m of matches) {
      const n = normalizeSportsApiGame({ ...m, sport: m.sport ?? sport });
      if (!n) continue;
      let g = byExt.get(String(m.id));
      let linkExternal = false;
      if (!g && manualTargets.length) {
        // Jogo publicado manualmente: casa por times + horário (±15 min), sem exigir tvNetworks.
        const found = findExistingGame(n, manualTargets);
        if (found) {
          g = found.game as unknown as typeof g;
          linkExternal = true;
        }
      }
      if (!g) continue;
      if (n.api_status === "scheduled" && g.api_status !== "scheduled" && g.api_status) continue;
      const patch: Record<string, unknown> = {
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
      };
      if (linkExternal) Object.assign(patch, { external_source: "sportsapi", external_id: n.external_id, external_sport: n.sport });
      const { error } = await db.from("daily_games").update(patch).eq("id", g.id as string);
      if (!error) {
        updated++;
        liveNow.push({ id: g.id, status: n.api_status, score: `${n.home_score ?? "-"}x${n.away_score ?? "-"}`, linked: linkExternal });
      }
    }
  }

  await db.from("sportsapi_sync_runs").insert({
    date: nowSp,
    kind: fromCron ? "live-cron" : "live",
    sports,
    total_found: target.length,
    total_updated: updated,
    status: errors.length ? "partial" : "ok",
    error_message: errors.join("; ") || null,
    actor_id: actor,
    requests_used: requestsThisRun,
  });
  if (!fromCron || updated > 0 || errors.length) {
    await audit(db, "sportsapi_live_update", actor, { date: nowSp, checked: target.length, updated, anyLive, errors, requests: requestsThisRun, games: liveNow.slice(0, 50) });
  }
  return { updated, checked: target.length, anyLive, errors };
}

/** sport_type do app → id da SportsAPI (para jogos manuais sem external_sport). */
function sportTypeToApi(st: string): string | null {
  const m: Record<string, string> = {
    football: "football", basketball: "basketball", tennis: "tennis", mma: "mma", boxing: "mma", volleyball: "volleyball",
    futsal: "futsal", rugby: "american-football", baseball: "baseball", f1: "motorsport", cycling: "cycling", golf: "golf",
    hockey: "ice-hockey", handball: "handball", esports: "esports",
  };
  return m[st] ?? null;
}

/** Cron único (a cada minuto): decide o que está na hora de rodar. */
async function doCron(db: Admin) {
  requestsThisRun = 0;
  const live = await doLive(db, null, true).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
  requestsThisRun = 0;
  const fetch = await doAutoFetch(db).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
  return { live, fetch };
}

async function doStatus(db: Admin) {
  const s = await loadSettings(db);
  const [q, lastFetch, lastAuto, lastLive, lastErr] = await Promise.all([
    quotaUsage(db),
    lastRunOf(db, ["fetch"]),
    lastRunOf(db, ["fetch-auto"]),
    lastRunOf(db, ["live-cron", "live"]),
    db.from("sportsapi_sync_runs").select("created_at,kind,error_message").eq("status", "partial").order("created_at", { ascending: false }).limit(1).maybeSingle().then((r) => r.data),
  ]);
  const { hour } = spNow();
  const nextAuto = !s.autoFetch || s.mode === "manual" ? null
    : lastAuto ? new Date(Date.parse(lastAuto.created_at as string) + s.autoFetchIntervalMin * 60_000).toISOString() : "em até 1 min";
  return {
    enabled: s.enabled,
    mode: s.mode,
    quota: { day: q.day, month: q.month, dailyBudget: s.dailyBudget, monthlyLimit: 300_000, nearBudget: q.day >= s.dailyBudget * 0.8 },
    lastFetch, lastAuto, lastLive, lastPartial: lastErr,
    schedule: {
      autoFetch: s.autoFetch && s.mode !== "manual", autoFetchIntervalMin: s.autoFetchIntervalMin, nextAuto,
      live: s.liveUpdates, liveIntervalLiveSec: s.liveIntervalLiveSec, liveIntervalIdleMin: s.liveIntervalMin,
      nightPause: s.nightPause, pausedNow: s.nightPause && (hour < 6 || hour >= 23),
    },
    hasKey: !!Deno.env.get("SPORTSAPI_KEY"),
  };
}

async function doTest() {
  if (!Deno.env.get("SPORTSAPI_KEY")) return { ok: false, message: "Chave da SportsAPI não configurada no servidor." };
  const t0 = Date.now();
  try {
    cache.delete(`${API_BASE}/sports?`);
    const r = await apiGet<{ sports?: unknown[] }>("/sports", {});
    return { ok: true, latencyMs: Date.now() - t0, sports: Array.isArray(r?.sports) ? r.sports.length : null };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, message: e instanceof ApiError ? e.friendly : "Falha na conexão." };
  }
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
    if (["duplicado", "ignorado_sem_transmissao", "ignorado_canal_estrangeiro", "erro"].includes(sg.status)) {
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
  let r: { sports?: unknown[]; data?: unknown[] };
  try {
    r = await apiGet<{ sports?: unknown[]; data?: unknown[] }>("/sports", {});
  } catch (e) {
    // Lista de esportes é só apoio: em indisponibilidade temporária devolve vazio e a tela usa a lista padrão.
    if (e instanceof ApiError && (e.status === 503 || e.status === 429 || e.status === 504)) return { sports: [], cached: false, unavailable: true };
    throw e;
  }
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
  requestsThisRun = 0;
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return json({ error: "Parâmetros inválidos.", details: parsed.error.flatten() }, 400);
  const input = parsed.data;

  // Autenticação: admin logado, ou chamada interna (cron) com a service role.
  let actor: string | null = null;
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const isServiceCall = !!token && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  // Cron interno: segredo gerado no banco (settings.sportsapi_cron_secret, is_secret) — nunca sai do backend.
  let isCron = false;
  if ((input.action === "live" && input.cron === true) || input.action === "cron") {
    if (isServiceCall) isCron = true;
    else {
      const cronHeader = req.headers.get("x-cron-secret") ?? "";
      const { data: row } = await db.from("settings").select("value").eq("key", "sportsapi_cron_secret").maybeSingle();
      const cronSecret = (row?.value as string | undefined) ?? "";
      isCron = cronSecret.length >= 32 && cronHeader.length === cronSecret.length && cronHeader === cronSecret;
    }
  }

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
      case "cron":
        return json(await doCron(db));
      case "auto-fetch":
        return json(await doAutoFetch(db, true));
      case "status":
        return json(await doStatus(db));
      case "test":
        return json(await doTest());
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
