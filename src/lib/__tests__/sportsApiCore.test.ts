import { describe, it, expect } from "vitest";
import {
  classifyMatch,
  normalizeSportsApiGame,
  toSaoPauloDateTime,
  mapApiStatus,
  mapSportsApiToDailyGame,
  type ChannelRegistry,
  type ExistingGame,
  type SportsApiMatch,
} from "../../../supabase/functions/_shared/sportsApiCore";
import { formatScore, formatLiveClock } from "@/lib/sportsApi";

const registry: ChannelRegistry = new Map([
  ["espn", { name: "ESPN", hasLogo: true }],
  ["espn2", { name: "ESPN 2", hasLogo: true }],
  ["sportv", { name: "SporTV", hasLogo: true }],
  ["premiere", { name: "Premiere", hasLogo: false }],
  ["pfc", { name: "Premiere", hasLogo: false }],
]);
const opts = { brazilOnly: true, acceptKnownChannel: true };

// 2026-05-06 21:00 BRT == 2026-05-07 00:00 UTC
const START = Date.UTC(2026, 4, 7, 0, 0, 0);

const match = (o: Partial<SportsApiMatch> = {}): SportsApiMatch => ({
  id: 123,
  sport: "football",
  status: "scheduled",
  startTime: START,
  homeTeam: { name: "Flamengo" },
  awayTeam: { name: "Palmeiras" },
  league: { name: "Brasileirão", country: "Brazil" },
  tvNetworks: [{ name: "Premiere", country: "BR" }],
  ...o,
});

describe("sportsApiCore · horário", () => {
  it("converte epoch UTC para Brasília (UTC-3)", () => {
    const r = toSaoPauloDateTime(START)!;
    expect(r.date).toBe("2026-05-06");
    expect(r.time).toBe("21:00");
  });
  it("aceita epoch em segundos", () => {
    expect(toSaoPauloDateTime(START / 1000)!.time).toBe("21:00");
  });
  it("mapeia status da API", () => {
    expect(mapApiStatus("live")).toBe("live");
    expect(mapApiStatus("2nd half")).toBe("live");
    expect(mapApiStatus("finished")).toBe("finished");
    expect(mapApiStatus("FT")).toBe("finished");
    expect(mapApiStatus("scheduled")).toBe("scheduled");
  });
});

describe("sportsApiCore · classificação", () => {
  it("sem tvNetworks → ignorado_sem_transmissao", () => {
    const n = normalizeSportsApiGame(match({ tvNetworks: [] }))!;
    expect(classifyMatch(n, registry, [], opts).status).toBe("ignorado_sem_transmissao");
  });

  it("tvNetworks Brasil com canal cadastrado → pronto_para_importar", () => {
    const n = normalizeSportsApiGame(match({ tvNetworks: [{ name: "Premiere", country: "BR" }] }))!;
    const c = classifyMatch(n, registry, [], opts);
    expect(c.status).toBe("pronto_para_importar");
    expect(c.normalized_channels).toEqual(["Premiere"]);
    expect(c.broadcast_country).toBe("BR");
    expect(c.warnings.map((w) => w.code)).toContain("canal_sem_logo");
  });

  it("canal conhecido sem country → pronto com aviso de país", () => {
    const n = normalizeSportsApiGame(match({ tvNetworks: [{ name: "ESPN 2 HD" }] }))!;
    const c = classifyMatch(n, registry, [], opts);
    expect(c.status).toBe("pronto_para_importar");
    expect(c.normalized_channels).toEqual(["ESPN 2"]);
    expect(c.warnings.map((w) => w.code)).toContain("pais_nao_informado");
  });

  it("país embutido no nome: 'Premiere (Bra)' → BR e nome limpo", () => {
    const n = normalizeSportsApiGame(match({ tvNetworks: [{ name: "Premiere (Bra)" }] }))!;
    expect(n.tv_networks[0]).toMatchObject({ name: "Premiere", country: "bra" });
    const c = classifyMatch(n, registry, [], opts);
    expect(c.status).toBe("pronto_para_importar");
    expect(c.warnings.map((w) => w.code)).not.toContain("pais_nao_informado");
  });

  it("'ESPN (Usa)' não vale como transmissão no Brasil", () => {
    const n = normalizeSportsApiGame(match({ tvNetworks: [{ name: "ESPN (Usa)" }] }))!;
    const c = classifyMatch(n, registry, [], opts);
    expect(c.normalized_channels).toEqual([]);
    expect(c.status).toBe("ignorado_sem_transmissao");
  });

  it("apelido cadastrado (PFC) resolve para nome oficial", () => {
    const n = normalizeSportsApiGame(match({ tvNetworks: ["PFC"] }))!;
    expect(classifyMatch(n, registry, [], opts).normalized_channels).toEqual(["Premiere"]);
  });

  it("canal desconhecido sem país → revisar, sem canal válido", () => {
    const n = normalizeSportsApiGame(match({ tvNetworks: [{ name: "beIN Sports", country: "FR" }] }))!;
    const c = classifyMatch(n, registry, [], opts);
    expect(c.status).toBe("revisar");
    expect(c.normalized_channels).toEqual([]);
    expect(c.warnings.map((w) => w.code)).toContain("canal_desconhecido");
  });

  it("canal desconhecido com país BR → revisar mantendo o nome", () => {
    const n = normalizeSportsApiGame(match({ tvNetworks: [{ name: "Canal Novo", country: "Brasil" }] }))!;
    const c = classifyMatch(n, registry, [], opts);
    expect(c.status).toBe("revisar");
    expect(c.normalized_channels).toEqual(["Canal Novo"]);
  });

  it("mistura BR conhecido + estrangeiro → pronto só com o BR", () => {
    const n = normalizeSportsApiGame(match({ tvNetworks: [{ name: "ESPN", country: "BR" }, { name: "Sky Sports", country: "UK" }] }))!;
    const c = classifyMatch(n, registry, [], opts);
    expect(c.normalized_channels).toEqual(["ESPN"]);
    // canal estrangeiro desconhecido gera alerta e manda para revisão
    expect(c.status).toBe("revisar");
  });

  it("dados incompletos → erro", () => {
    const n = normalizeSportsApiGame(match({ homeTeam: { name: "" }, awayTeam: null, title: "" }))!;
    expect(classifyMatch(n, registry, [], opts).status).toBe("erro");
  });

  it("evento único usa título sem adversário", () => {
    const n = normalizeSportsApiGame(match({ sport: "f1", homeTeam: null, awayTeam: null, title: "GP de Mônaco" }))!;
    expect(n.home_team).toBe("GP de Mônaco");
    expect(n.away_team).toBe("");
    expect(n.sport_type).toBe("f1");
  });
});

describe("sportsApiCore · duplicados", () => {
  const existing: ExistingGame[] = [
    { id: "g1", date: "2026-05-06", game_time: "21:00:00", sport_type: "football", home_team: "Flamengo", away_team: "Palmeiras", competition: "Brasileirão", channels: ["Premiere"] },
  ];

  it("mesmo jogo já na agenda → duplicado", () => {
    const n = normalizeSportsApiGame(match())!;
    const c = classifyMatch(n, registry, existing, opts);
    expect(c.status).toBe("duplicado");
    expect(c.matched_game_id).toBe("g1");
  });

  it("times invertidos e horário ±15 min ainda é duplicado, mas com horário divergente → conflito", () => {
    const n = normalizeSportsApiGame(match({ startTime: START + 10 * 60_000, homeTeam: { name: "Palmeiras" }, awayTeam: { name: "Flamengo" } }))!;
    const c = classifyMatch(n, registry, existing, opts);
    expect(c.status).toBe("conflito");
    expect(c.warnings.map((w) => w.code)).toContain("horario_divergente");
  });

  it("horário muito diferente não é duplicado", () => {
    const n = normalizeSportsApiGame(match({ startTime: START + 3 * 3600_000 }))!;
    expect(classifyMatch(n, registry, existing, opts).status).toBe("pronto_para_importar");
  });

  it("match por external_id vence", () => {
    const n = normalizeSportsApiGame(match({ id: "abc", homeTeam: { name: "Outro" }, awayTeam: { name: "Time" } }))!;
    const c = classifyMatch(n, registry, [{ ...existing[0], external_id: "abc" }], opts);
    expect(c.status).toBe("duplicado");
  });
});

describe("sportsApiCore · mapeamento para daily_games", () => {
  it("gera linha com source sportsapi, canais normalizados e placar", () => {
    const n = normalizeSportsApiGame(match({ status: "live", homeScore: 2, awayScore: 1, gameTimeDisplay: "74'", period: "Segundo tempo" }))!;
    const c = classifyMatch(n, registry, [], opts);
    const row = mapSportsApiToDailyGame(n, c, true);
    expect(row.source).toBe("sportsapi");
    expect(row.external_id).toBe("123");
    expect(row.date).toBe("2026-05-06");
    expect(row.game_time).toBe("21:00");
    expect(row.channels).toEqual(["Premiere"]);
    expect(row.home_score).toBe(2);
    expect(row.api_status).toBe("live");
    expect(row.is_live).toBe(true);
    expect(row.live_clock).toBe("74'");
  });

  it("helpers de exibição", () => {
    expect(formatScore({ home_score: 2, away_score: 1 })).toBe("2 x 1");
    expect(formatScore({ home_score: null, away_score: 1 })).toBeNull();
    expect(formatLiveClock({ live_clock: "74'", period: "Segundo tempo" })).toBe("74' · Segundo tempo");
    expect(formatLiveClock({})).toBeNull();
  });
});
