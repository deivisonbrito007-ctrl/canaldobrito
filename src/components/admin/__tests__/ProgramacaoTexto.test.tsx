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
});
