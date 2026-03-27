import { describe, it, expect } from "vitest";
import { parseScheduleText } from "../ProgramacaoTexto";

describe("parseScheduleText", () => {
  const fallback = "2026-03-19";

  it("parses a single game correctly", () => {
    const text = `Flamengo x Palmeiras
🏆 Brasileirão (oitavas de final) / ⏰ 19h00
📺 Sportv, Premiere`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].home_team).toBe("Flamengo");
    expect(games[0].away_team).toBe("Palmeiras");
    expect(games[0].competition).toBe("Brasileirão");
    expect(games[0].competition_detail).toBe("oitavas de final");
    expect(games[0].game_time).toBe("19:00");
    expect(games[0].channels).toEqual(["Sportv", "Premiere"]);
    expect(games[0].date).toBe(fallback);
    expect(games[0].selected).toBe(true);
  });

  it("detects date headers and assigns correct dates", () => {
    const text = `📅**Dia 20/03**

Flamengo x Palmeiras
🏆 Brasileirão / ⏰ 19h00
📺 Sportv

📅**Dia 21/03**

Barcelona x Real Madrid
🏆 La Liga / ⏰ 16h30
📺 ESPN`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(2);
    expect(games[0].date).toBe(`${new Date().getFullYear()}-03-20`);
    expect(games[1].date).toBe(`${new Date().getFullYear()}-03-21`);
  });

  it("returns empty array when no games found", () => {
    const text = "Nenhum jogo hoje\nApenas informações gerais";
    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(0);
  });

  it("detects women's games with (F) marker", () => {
    const text = `Brasil (F) x Argentina (F)
🏆 Copa América Feminina / ⏰ 20h00
📺 Globo`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].is_womens).toBe(true);
  });

  it("handles time format with h (e.g. 16h30)", () => {
    const text = `Time A x Time B
🏆 Liga / ⏰ 16h30
📺 Canal`;

    const games = parseScheduleText(text, fallback);
    expect(games[0].game_time).toBe("16:30");
  });

  it("handles short time format (e.g. 9h)", () => {
    const text = `Time A x Time B
🏆 Liga / ⏰ 9h
📺 Canal`;

    const games = parseScheduleText(text, fallback);
    expect(games[0].game_time).toBe("09:00");
  });

  it("parses multiple channels including 'e' separator", () => {
    const text = `Time A x Time B
🏆 Liga / ⏰ 20h00
📺 ESPN, Sportv e Star+`;

    const games = parseScheduleText(text, fallback);
    expect(games[0].channels).toEqual(["ESPN", "Sportv", "Star+"]);
  });

  it("parses Format B — individual sport without 'x'", () => {
    const text = `ATP e WTA
🎾 Tênis (Indian Wells) / ⏰ 20h00
📺 ESPN 2`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].home_team).toBe("ATP e WTA");
    expect(games[0].away_team).toBe("");
    expect(games[0].competition).toBe("Tênis");
    expect(games[0].competition_detail).toBe("Indian Wells");
    expect(games[0].sport_type).toBe("tennis");
  });

  it("parses Format B — F1 event", () => {
    const text = `GP da Arábia Saudita
🏎️ Fórmula 1 (Classificação) / ⏰ 13h00
📺 Band, BandSports`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].home_team).toBe("GP da Arábia Saudita");
    expect(games[0].away_team).toBe("");
    expect(games[0].sport_type).toBe("f1");
  });

  it("parses Format B — UFC event", () => {
    const text = `UFC 315 (Card Principal)
🥊 MMA / ⏰ 23h00
📺 Combate`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].home_team).toBe("UFC 315 (Card Principal)");
    expect(games[0].sport_type).toBe("mma");
  });

  // ===== NEW: Multi-line format tests =====

  it("parses multi-line format with separate 🏆/📍/⏰/📺 lines", () => {
    const text = `China x Curaçao
🏆 FIFA Series 2026
📍 Fase de grupos
⏰ 03:00
📺 DAZN`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].home_team).toBe("China");
    expect(games[0].away_team).toBe("Curaçao");
    expect(games[0].competition).toBe("FIFA Series 2026");
    expect(games[0].competition_detail).toBe("Fase de grupos");
    expect(games[0].game_time).toBe("03:00");
    expect(games[0].channels).toEqual(["DAZN"]);
  });

  it("parses multiple multi-line games", () => {
    const text = `China x Curaçao
🏆 FIFA Series 2026
📍 Fase de grupos
⏰ 03:00
📺 DAZN

Nova Zelândia x Finlândia
🏆 FIFA Series 2026
📍 Fase de grupos
⏰ 03:15
📺 DAZN`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(2);
    expect(games[0].home_team).toBe("China");
    expect(games[0].game_time).toBe("03:00");
    expect(games[1].home_team).toBe("Nova Zelândia");
    expect(games[1].game_time).toBe("03:15");
  });

  it("skips section headers like FUTEBOL, BASQUETE, NBA", () => {
    const text = `FUTEBOL

China x Curaçao
🏆 FIFA Series 2026
📍 Fase de grupos
⏰ 03:00
📺 DAZN

BASQUETE

NBA

Los Angeles Clippers x Indiana Pacers
🏆 NBA
📍 Temporada regular
⏰ 20:00
📺 League Pass`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(2);
    expect(games[0].home_team).toBe("China");
    expect(games[1].home_team).toBe("Los Angeles Clippers");
    expect(games[1].away_team).toBe("Indiana Pacers");
    expect(games[1].competition).toBe("NBA");
  });

  it("handles mixed section headers and women's games in multi-line format", () => {
    const text = `Brasileirão Feminino

Botafogo (F) x Corinthians (F)
🏆 Brasileirão Feminino
📍 Primeira fase
⏰ 19:00
📺 SporTV`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].is_womens).toBe(true);
    expect(games[0].home_team).toBe("Botafogo");
    expect(games[0].away_team).toBe("Corinthians");
    expect(games[0].competition).toBe("Brasileirão Feminino");
  });

  it("parses multi-line tennis event (no 'x')", () => {
    const text = `Miami Open
🏆 ATP / WTA 1000
📍 Sessão do dia
⏰ 16:00
📺 ESPN 2`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].home_team).toBe("Miami Open");
    expect(games[0].away_team).toBe("");
    expect(games[0].competition).toBe("ATP / WTA 1000");
    expect(games[0].competition_detail).toBe("Sessão do dia");
    expect(games[0].game_time).toBe("16:00");
  });

  it("parses NBA basketball game in multi-line format", () => {
    const text = `Atlanta Hawks x Boston Celtics
🏆 NBA
📍 Temporada regular
⏰ 20:30
📺 Prime Video`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].competition).toBe("NBA");
    expect(games[0].competition_detail).toBe("Temporada regular");
    expect(games[0].game_time).toBe("20:30");
    expect(games[0].channels).toEqual(["Prime Video"]);
  });

  it("parses volleyball in multi-line format", () => {
    const text = `Vôlei Renata x Sada Cruzeiro
🏆 Superliga Masculina
📍 Fase regular / decisiva
⏰ 21:00
📺 SporTV 2`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].competition).toBe("Superliga Masculina");
    expect(games[0].competition_detail).toBe("Fase regular / decisiva");
  });

  it("detects date from header like 'AGENDA ESPORTIVA — SEXTA 27/03'", () => {
    const text = `AGENDA ESPORTIVA — SEXTA 27/03

Horários de Brasília

FUTEBOL

China x Curaçao
🏆 FIFA Series 2026
📍 Fase de grupos
⏰ 03:00
📺 DAZN`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(1);
    expect(games[0].date).toBe(`${new Date().getFullYear()}-03-27`);
  });

  it("handles full real-world agenda with multiple sports", () => {
    const text = `AGENDA ESPORTIVA — SEXTA 27/03

Horários de Brasília

FUTEBOL

China x Curaçao
🏆 FIFA Series 2026
📍 Fase de grupos
⏰ 03:00
📺 DAZN

Inglaterra x Uruguai
🏆 Amistoso Internacional
📍 Data FIFA
⏰ 16:45
📺 ESPN e Disney+

BASQUETE

Atlanta Hawks x Boston Celtics
🏆 NBA
📍 Temporada regular
⏰ 20:30
📺 Prime Video

TÊNIS

Miami Open
🏆 ATP / WTA 1000
📍 Sessão do dia
⏰ 16:00
📺 ESPN 2`;

    const games = parseScheduleText(text, fallback);
    expect(games).toHaveLength(4);
    expect(games[0].home_team).toBe("China");
    expect(games[1].home_team).toBe("Inglaterra");
    expect(games[1].channels).toEqual(["ESPN", "Disney+"]);
    expect(games[2].home_team).toBe("Atlanta Hawks");
    expect(games[3].home_team).toBe("Miami Open");
  });
});
