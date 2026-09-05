/**
 * Núcleo puro da integração SportsAPI (sportsapi.com.br).
 *
 * Sem imports: roda igual na Edge Function (Deno) e nos testes (vitest).
 * Responsável por normalizar partidas da API, aplicar a regra
 * "somente com transmissão para o Brasil / canal reconhecido" e
 * classificar cada partida em um status interno.
 */

export type SportsApiTvNetwork = {
  name: string;
  country?: string | null;
  logo?: string | null;
};

/** Forma tolerante do que a API devolve em `matches[]`. */
export type SportsApiMatch = {
  id: string | number;
  sport?: string;
  status?: string;
  startTime?: number | string;
  homeTeam?: { name?: string; logo?: string } | null;
  awayTeam?: { name?: string; logo?: string } | null;
  title?: string;
  name?: string;
  league?: { name?: string; country?: string } | null;
  tvNetworks?: Array<SportsApiTvNetwork | string> | null;
  homeScore?: number | null;
  awayScore?: number | null;
  gameTimeDisplay?: string | null;
  period?: string | null;
};

export type SuggestionStatus =
  | "pronto_para_importar"
  | "revisar"
  | "ignorado_sem_transmissao"
  | "ignorado_canal_estrangeiro"
  | "duplicado"
  | "conflito"
  | "erro";

export type ApiStatus = "scheduled" | "live" | "finished";

export type SuggestionWarning = {
  code:
    | "canal_desconhecido"
    | "canal_sem_logo"
    | "pais_nao_informado"
    | "duplicado"
    | "horario_divergente"
    | "competicao_divergente"
    | "esporte_divergente"
    | "sem_transmissao"
    | "canal_estrangeiro"
    | "status_conflitante"
    | "dados_incompletos";
  message: string;
};

export type NormalizedMatch = {
  external_id: string;
  sport: string;
  sport_type: string;
  home_team: string;
  away_team: string;
  title: string | null;
  competition: string;
  competition_country: string | null;
  start_time: string; // ISO UTC
  date: string; // YYYY-MM-DD em Brasília
  game_time: string; // HH:MM em Brasília
  tv_networks: SportsApiTvNetwork[];
  api_status: ApiStatus;
  home_score: number | null;
  away_score: number | null;
  live_clock: string | null;
  period: string | null;
};

export type ChannelRegistryEntry = {
  /** Nome oficial do canal no app. */
  name: string;
  hasLogo: boolean;
};

/** Mapa chave normalizada (nome oficial ou apelido) -> entrada. */
export type ChannelRegistry = Map<string, ChannelRegistryEntry>;

export type ExistingGame = {
  id: string;
  date: string;
  game_time: string;
  sport_type: string;
  home_team: string;
  away_team: string;
  competition: string;
  channels: string[] | null;
  home_score?: number | null;
  away_score?: number | null;
  external_id?: string | null;
};

export type ClassifyOptions = {
  brazilOnly: boolean;
  acceptKnownChannel: boolean;
  /** Descarta em silêncio redes com país/nome estrangeiro (padrão true). */
  ignoreForeign?: boolean;
};

export type BroadcastDecision = {
  accept: boolean;
  reason: "pais_brasil" | "canal_cadastrado" | "pais_estrangeiro" | "nome_estrangeiro" | "canal_desconhecido" | "fora_do_brasil_aceito";
  entry: ChannelRegistryEntry | null;
};

export type Classification = {
  status: SuggestionStatus;
  warnings: SuggestionWarning[];
  normalized_channels: string[];
  broadcast_country: string | null;
  matched_game_id: string | null;
};

// ---------------------------------------------------------------------------
// Normalização básica
// ---------------------------------------------------------------------------

export const normalizeKey = (s: string): string =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();

const QUALITY_SUFFIX = /(fhd|uhd|hd|4k|sd)$/;
export const stripQuality = (k: string): string => k.replace(QUALITY_SUFFIX, "");

const BR_COUNTRIES = new Set(["br", "bra", "brazil", "brasil"]);
export const isBrazilCountry = (c?: string | null): boolean =>
  !!c && BR_COUNTRIES.has(c.trim().toLowerCase());

/** Esporte da API -> sport_type do app. */
const SPORT_MAP: Record<string, string> = {
  football: "football",
  soccer: "football",
  futsal: "futsal",
  basketball: "basketball",
  nba: "basketball",
  tennis: "tennis",
  f1: "f1",
  formula1: "f1",
  "formula-1": "f1",
  motorsport: "f1",
  motogp: "f1",
  nascar: "f1",
  indycar: "f1",
  mma: "mma",
  ufc: "mma",
  boxing: "boxing",
  volleyball: "volleyball",
  handball: "handball",
  hockey: "hockey",
  "ice-hockey": "hockey",
  nhl: "hockey",
  baseball: "baseball",
  mlb: "baseball",
  rugby: "rugby",
  "american-football": "rugby",
  nfl: "rugby",
  surf: "surf",
  surfing: "surf",
  cycling: "cycling",
  swimming: "swimming",
  golf: "golf",
  athletics: "athletics",
  gymnastics: "gymnastics",
  esports: "esports",
};

export function mapSport(apiSport: string | undefined | null): string {
  const k = (apiSport ?? "").toLowerCase().trim();
  return SPORT_MAP[k] ?? SPORT_MAP[k.replace(/[^a-z0-9]/g, "")] ?? "football";
}

export function mapApiStatus(status: string | undefined | null): ApiStatus {
  const s = (status ?? "").toLowerCase();
  if (/live|inprogress|in_progress|playing|halftime|ht|1st|2nd|\d+(st|nd|rd|th)/.test(s)) return "live";
  if (/finish|final|ended|ft|closed|complete|aet|pen/.test(s)) return "finished";
  return "scheduled";
}

// ---------------------------------------------------------------------------
// Horário: UTC -> America/Sao_Paulo (UTC-3, sem horário de verão desde 2019)
// ---------------------------------------------------------------------------

const SP_OFFSET_MS = -3 * 60 * 60 * 1000;

export function toSaoPauloDateTime(startTime: number | string | undefined): { date: string; time: string; iso: string } | null {
  if (startTime === undefined || startTime === null || startTime === "") return null;
  let ms: number;
  if (typeof startTime === "number") ms = startTime < 1e12 ? startTime * 1000 : startTime;
  else if (/^\d+$/.test(startTime)) ms = Number(startTime) < 1e12 ? Number(startTime) * 1000 : Number(startTime);
  else ms = Date.parse(startTime);
  if (!Number.isFinite(ms)) return null;
  const sp = new Date(ms + SP_OFFSET_MS);
  const date = sp.toISOString().slice(0, 10);
  const time = sp.toISOString().slice(11, 16);
  return { date, time, iso: new Date(ms).toISOString() };
}

// ---------------------------------------------------------------------------
// Normalização da partida
// ---------------------------------------------------------------------------

/** A API costuma embutir o país no nome: "Premiere (Bra)", "ESPN (Usa)". */
const NAME_COUNTRY_SUFFIX = /\s*\(([A-Za-z]{2,3})\)\s*$/;
export function splitNetworkName(name: string, country?: string | null): { name: string; country: string | null } {
  const m = name.match(NAME_COUNTRY_SUFFIX);
  if (!m) return { name: name.trim(), country: country ?? null };
  return { name: name.replace(NAME_COUNTRY_SUFFIX, "").trim(), country: country ?? m[1].toLowerCase() };
}

export function normalizeTvNetworks(raw: SportsApiMatch["tvNetworks"]): SportsApiTvNetwork[] {
  if (!Array.isArray(raw)) return [];
  const out: SportsApiTvNetwork[] = [];
  for (const n of raw) {
    if (typeof n === "string") {
      if (n.trim()) out.push({ ...splitNetworkName(n), logo: null });
    } else if (n && typeof n === "object" && typeof n.name === "string" && n.name.trim()) {
      out.push({ ...splitNetworkName(n.name, n.country), logo: n.logo ?? null });
    }
  }
  return out;
}

export function normalizeSportsApiGame(m: SportsApiMatch): NormalizedMatch | null {
  const when = toSaoPauloDateTime(m.startTime);
  if (!when || m.id === undefined || m.id === null) return null;
  const home = (m.homeTeam?.name ?? "").trim();
  const away = (m.awayTeam?.name ?? "").trim();
  const title = (m.title ?? m.name ?? "").trim() || null;
  return {
    external_id: String(m.id),
    sport: (m.sport ?? "").toLowerCase() || "football",
    sport_type: mapSport(m.sport),
    home_team: home || title || "",
    away_team: home ? away : "",
    title,
    competition: (m.league?.name ?? "").trim(),
    competition_country: m.league?.country?.trim() || null,
    start_time: when.iso,
    date: when.date,
    game_time: when.time,
    tv_networks: normalizeTvNetworks(m.tvNetworks),
    api_status: mapApiStatus(m.status),
    home_score: typeof m.homeScore === "number" ? m.homeScore : null,
    away_score: typeof m.awayScore === "number" ? m.awayScore : null,
    live_clock: m.gameTimeDisplay?.toString().trim() || null,
    period: m.period?.toString().trim() || null,
  };
}

// ---------------------------------------------------------------------------
// Canais
// ---------------------------------------------------------------------------

export function resolveNetwork(name: string, registry: ChannelRegistry): ChannelRegistryEntry | null {
  const k = normalizeKey(name);
  if (!k) return null;
  return registry.get(k) ?? registry.get(stripQuality(k)) ?? null;
}

/** Filtra redes relevantes para o Brasil (país BR ou canal reconhecido). */
export function filterBrazilBroadcasts(
  networks: SportsApiTvNetwork[],
  registry: ChannelRegistry,
  opts: ClassifyOptions,
): {
  accepted: Array<{ network: SportsApiTvNetwork; entry: ChannelRegistryEntry | null }>;
  unknown: SportsApiTvNetwork[];
  foreign: SportsApiTvNetwork[];
} {
  const accepted: Array<{ network: SportsApiTvNetwork; entry: ChannelRegistryEntry | null }> = [];
  const unknown: SportsApiTvNetwork[] = [];
  const foreign: SportsApiTvNetwork[] = [];
  for (const n of networks) {
    const entry = resolveNetwork(n.name, registry);
    const br = isBrazilCountry(n.country);
    if (br) accepted.push({ network: n, entry });
    else if (!n.country && opts.acceptKnownChannel && entry) accepted.push({ network: n, entry });
    else if (!opts.brazilOnly && entry) accepted.push({ network: n, entry });
    // País explícito e não-Brasil: transmissão irrelevante para o app (não vira alerta).
    else if (n.country) foreign.push(n);
    else unknown.push(n);
  }
  return { accepted, unknown, foreign };
}

// ---------------------------------------------------------------------------
// Duplicados
// ---------------------------------------------------------------------------

const teamKey = (s: string) => normalizeKey(s).replace(/(fc|ec|sc|club|clube|de|do|da)$/g, "");

const minutesOf = (t: string) => {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

export function findExistingGame(n: NormalizedMatch, existing: ExistingGame[]): { game: ExistingGame; exact: boolean } | null {
  const byExternal = existing.find((g) => g.external_id && g.external_id === n.external_id);
  if (byExternal) return { game: byExternal, exact: true };
  const h = teamKey(n.home_team);
  const a = teamKey(n.away_team);
  for (const g of existing) {
    if (g.date !== n.date) continue;
    const gh = teamKey(g.home_team);
    const ga = teamKey(g.away_team ?? "");
    const sameTeams = (gh === h && ga === a) || (gh === a && ga === h);
    if (!sameTeams) continue;
    const diff = Math.abs(minutesOf(g.game_time) - minutesOf(n.game_time));
    if (diff <= 15) return { game: g, exact: diff === 0 && g.sport_type === n.sport_type };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Classificação
// ---------------------------------------------------------------------------

export function classifyMatch(
  n: NormalizedMatch,
  registry: ChannelRegistry,
  existing: ExistingGame[],
  opts: ClassifyOptions,
): Classification {
  const warnings: SuggestionWarning[] = [];

  if (!n.home_team || !n.game_time) {
    return {
      status: "erro",
      warnings: [{ code: "dados_incompletos", message: "Faltam dados obrigatórios (time/evento ou horário)." }],
      normalized_channels: [],
      broadcast_country: null,
      matched_game_id: null,
    };
  }

  if (n.tv_networks.length === 0) {
    return {
      status: "ignorado_sem_transmissao",
      warnings: [{ code: "sem_transmissao", message: "A API não informou nenhum canal de transmissão." }],
      normalized_channels: [],
      broadcast_country: null,
      matched_game_id: null,
    };
  }

  const { accepted, unknown, foreign } = filterBrazilBroadcasts(n.tv_networks, registry, opts);

  if (accepted.length === 0 && unknown.length === 0) {
    return {
      status: "ignorado_sem_transmissao",
      warnings: [{
        code: "sem_transmissao",
        message: `Só transmissão fora do Brasil (${foreign.map((f) => `${f.name} · ${f.country}`).join(", ")}).`,
      }],
      normalized_channels: [],
      broadcast_country: null,
      matched_game_id: null,
    };
  }
  const channels: string[] = [];
  const seen = new Set<string>();
  for (const { network, entry } of accepted) {
    const name = entry?.name ?? network.name;
    const k = normalizeKey(name);
    if (seen.has(k)) continue;
    seen.add(k);
    channels.push(name);
    if (!entry) warnings.push({ code: "canal_desconhecido", message: `Canal "${network.name}" não está no cadastro.` });
    else if (!entry.hasLogo) warnings.push({ code: "canal_sem_logo", message: `Canal "${entry.name}" está sem logo.` });
    if (!network.country) warnings.push({ code: "pais_nao_informado", message: `"${network.name}" veio sem país de transmissão.` });
  }
  for (const u of unknown) {
    warnings.push({ code: "canal_desconhecido", message: `Canal "${u.name}"${u.country ? ` (${u.country})` : ""} não reconhecido.` });
  }

  const brCountry = accepted.find((a) => isBrazilCountry(a.network.country))?.network.country ?? null;

  // Duplicados / conflitos
  const found = findExistingGame(n, existing);
  let matched_game_id: string | null = null;
  if (found) {
    matched_game_id = found.game.id;
    warnings.push({ code: "duplicado", message: "Já existe na programação." });
    if (found.game.game_time.slice(0, 5) !== n.game_time) {
      warnings.push({ code: "horario_divergente", message: `Horário na agenda: ${found.game.game_time.slice(0, 5)} · API: ${n.game_time}.` });
    }
    if (found.game.sport_type !== n.sport_type) {
      warnings.push({ code: "esporte_divergente", message: `Esporte na agenda: ${found.game.sport_type} · API: ${n.sport_type}.` });
    }
    if (n.competition && found.game.competition && normalizeKey(found.game.competition) !== normalizeKey(n.competition)) {
      warnings.push({ code: "competicao_divergente", message: `Competição na agenda: ${found.game.competition} · API: ${n.competition}.` });
    }
    const hasConflict = warnings.some((w) => ["horario_divergente", "esporte_divergente", "competicao_divergente"].includes(w.code));
    return {
      status: hasConflict && !found.exact ? "conflito" : "duplicado",
      warnings,
      normalized_channels: channels,
      broadcast_country: brCountry,
      matched_game_id,
    };
  }

  const hasUnknown = warnings.some((w) => w.code === "canal_desconhecido");
  if (channels.length === 0) {
    return { status: "revisar", warnings, normalized_channels: channels, broadcast_country: brCountry, matched_game_id };
  }
  return {
    status: hasUnknown ? "revisar" : "pronto_para_importar",
    warnings,
    normalized_channels: channels,
    broadcast_country: brCountry,
    matched_game_id,
  };
}

/** Converte partida normalizada + classificação em linha de `daily_games`. */
export function mapSportsApiToDailyGame(n: NormalizedMatch, c: Classification, active: boolean) {
  return {
    date: n.date,
    home_team: n.home_team,
    away_team: n.away_team,
    competition: n.competition,
    competition_detail: n.competition_country ?? "",
    game_time: n.game_time,
    channels: c.normalized_channels,
    is_live: n.api_status === "live",
    is_womens: /\(f\)|feminin|women|femenin/i.test(`${n.home_team} ${n.competition}`),
    active,
    archived: false,
    status_short: n.api_status === "live" ? "LIVE" : n.api_status === "finished" ? "FT" : "NS",
    elapsed_minutes: null,
    publish_at: null,
    sport_type: n.sport_type,
    source: "sportsapi",
    external_source: "sportsapi",
    external_id: n.external_id,
    external_sport: n.sport,
    api_status: n.api_status,
    home_score: n.home_score,
    away_score: n.away_score,
    live_status: n.api_status,
    live_clock: n.live_clock,
    period: n.period,
    broadcast_country: c.broadcast_country,
    last_api_sync_at: new Date().toISOString(),
    api_payload_summary: {
      league: n.competition,
      league_country: n.competition_country,
      tv_networks: n.tv_networks,
      start_time: n.start_time,
    },
  };
}

export const SUGGESTION_STATUS_LABEL: Record<SuggestionStatus, string> = {
  pronto_para_importar: "Pronto",
  revisar: "Revisar",
  ignorado_sem_transmissao: "Sem transmissão",
  duplicado: "Duplicado",
  conflito: "Conflito",
  erro: "Erro",
};
