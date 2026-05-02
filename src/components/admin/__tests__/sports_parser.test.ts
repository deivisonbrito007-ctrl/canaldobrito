import { describe, it, expect } from "vitest";
import { parseScheduleText } from "../ProgramacaoTexto";

describe("parseScheduleText - novos esportes", () => {
  it("detecta rugby via emoji 🏉", () => {
    const text = `Crusaders x Blues
🏉 Super Rugby / ⏰ 06h05
📺 ESPN 4`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("rugby");
    expect(games[0].competition).toBe("Super Rugby");
  });

  it("detecta surf via emoji 🏄", () => {
    const text = `World Surf League — Etapa Pipeline
🏄 WSL / ⏰ 18h00
📺 SporTV 2`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("surf");
  });

  it("detecta natação via emoji 🏊", () => {
    const text = `Brasil x Austrália
🏊 World Aquatics / ⏰ 14h30
📺 SporTV`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("swimming");
  });

  it("detecta ciclismo via emoji 🚴", () => {
    const text = `Tour de France — Etapa 12
🚴 Ciclismo / ⏰ 10h00
📺 ESPN`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("cycling");
  });

  it("detecta golf via emoji ⛳", () => {
    const text = `Masters — Primeira Rodada
⛳ PGA Tour / ⏰ 10h00
📺 ESPN`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("golf");
  });

  it("detecta rugby via regex sem emoji", () => {
    const text = `All Blacks x Springboks
🏆 World Rugby / ⏰ 09h00
📺 ESPN 2`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("rugby");
  });

  it("detecta surf via regex sem emoji", () => {
    const text = `Gabriel Medina
🏆 WSL Pipeline / ⏰ 20h00
📺 SporTV`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("surf");
  });

  it("programação mista com múltiplos esportes", () => {
    const text = `📅 Dia 01/04

Crusaders x Blues
🏉 Super Rugby / ⏰ 06h05
📺 ESPN 4

Brasil x Austrália
🏊 World Aquatics / ⏰ 14h30
📺 SporTV

Flamengo x Palmeiras
🏆 Brasileirão / ⏰ 19h00
📺 Premiere`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(3);
    expect(games[0].sport_type).toBe("rugby");
    expect(games[1].sport_type).toBe("swimming");
    expect(games[2].sport_type).toBe("football");
  });

  it("detecta MMA via regex UFC", () => {
    const text = `Islam Makhachev x Arman Tsarukyan
🥊 UFC 312 / ⏰ 23h00
📺 Canal Combate`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("mma");
  });

  it("detecta MMA via regex Bellator", () => {
    const text = `Patricio Pitbull x AJ McKee
🥊 Bellator 300 / ⏰ 22h00
📺 ESPN 2`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("mma");
  });

  it("detecta Boxe via regex WBC", () => {
    const text = `Canelo Alvarez x Jermell Charlo
🥊 WBC Championship / ⏰ 23h00
📺 ESPN`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("boxing");
  });

  it("detecta Boxe via regex WBA", () => {
    const text = `Tyson Fury x Oleksandr Usyk
🥊 WBA Heavyweight / ⏰ 18h00
📺 Canal Combate`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("boxing");
  });

  it("detecta Boxe via palavra 'Boxe'", () => {
    const text = `Amanda Serrano x Katie Taylor
🏆 Boxe Internacional / ⏰ 22h00
📺 ESPN`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    expect(games[0].sport_type).toBe("boxing");
  });

  it("emoji 🥊 com competição genérica cai em football (fallback)", () => {
    const text = `Lutador A x Lutador B
🥊 Campeonato Nacional / ⏰ 21h00
📺 SporTV`;
    const games = parseScheduleText(text, "2026-04-01");
    expect(games).toHaveLength(1);
    // 🥊 is ambiguous, detectSportType decides — no UFC/boxing keyword → football fallback
    expect(games[0].sport_type).toBe("football");
  });
});

describe("Auto-bump date for dawn games (00:00–04:59) — opt-in via flag", () => {
  const BUMP = { autoBumpMidnight: true };

  it("bumps date +1 for 00:00 game when flag is ON and date comes from header", () => {
    const text = `📅 Dia 04/04

Santos Laguna x América-MEX
🏆 Liga MX
⏰ 00h00
📺 ESPN`;
    const result = parseScheduleText(text, "2026-04-04", BUMP);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-04-05");
    expect(result[0].dateBumped).toBe(true);
  });

  it("bumps date +1 for 02:30 game when flag is ON", () => {
    const text = `📅 Dia 04/04

LA Galaxy x Inter Miami
🏆 MLS
⏰ 02h30
📺 Apple TV`;
    const result = parseScheduleText(text, "2026-04-04", BUMP);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-04-05");
    expect(result[0].dateBumped).toBe(true);
  });

  it("does NOT bump date for 05:00+ games even with flag ON", () => {
    const text = `📅 Dia 04/04

Arsenal x Chelsea
🏆 Premier League
⏰ 08h30
📺 ESPN`;
    const result = parseScheduleText(text, "2026-04-04", BUMP);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-04-04");
    expect(result[0].dateBumped).toBeFalsy();
  });

  it("does NOT bump when date is from fallback (manual picker)", () => {
    const text = `Santos Laguna x América-MEX
🏆 Liga MX
⏰ 00h00
📺 ESPN`;
    const result = parseScheduleText(text, "2026-04-05", BUMP);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-04-05");
    expect(result[0].dateBumped).toBeFalsy();
  });

  it("handles mixed dawn and normal games correctly with flag ON", () => {
    const text = `📅 Dia 04/04

Flamengo x Palmeiras
🏆 Brasileirão
⏰ 21h00
📺 Globo

Santos Laguna x América-MEX
🏆 Liga MX
⏰ 00h00
📺 ESPN`;
    const result = parseScheduleText(text, "2026-04-04", BUMP);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-04-04");
    expect(result[0].dateBumped).toBeFalsy();
    expect(result[1].date).toBe("2026-04-05");
    expect(result[1].dateBumped).toBe(true);
  });

  it("DEFAULT (flag OFF): madrugada keeps the header date — prevents the 02/05 bug", () => {
    const text = `📅 Dia 04/04

Formula E - GP de Miami - Treino
🏎️ Automobilismo
⏰ 04h30
📺 Band Sports`;
    const result = parseScheduleText(text, "2026-04-04");
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-04-04");
    expect(result[0].dateBumped).toBeFalsy();
  });
});
