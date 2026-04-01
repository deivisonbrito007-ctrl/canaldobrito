import { describe, it, expect } from "vitest";
import { parseScheduleText } from "../dev-server/src/components/admin/ProgramacaoTexto";

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
});
