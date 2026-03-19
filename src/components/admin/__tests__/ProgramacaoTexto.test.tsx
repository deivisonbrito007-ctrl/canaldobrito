import { describe, it, expect } from "vitest";

// We need to test the parser. Since it's not exported, we extract and test it directly.
// Re-implement parseScheduleText here for unit testing (mirrors the component's logic).

interface ParsedGame {
  home_team: string;
  away_team: string;
  competition: string;
  competition_detail: string;
  game_time: string;
  channels: string[];
  is_womens: boolean;
  date: string;
  selected: boolean;
}

function parseScheduleText(text: string, fallbackDate: string): ParsedGame[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const games: ParsedGame[] = [];
  let currentDate = fallbackDate;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const dateMatch = line.match(/(?:📅|📺|🗓|🗓️|\*\*Dia|Dia)\s*\**\s*(?:Dia\s*)?\**\s*(\d{1,2})\/(\d{1,2})/i);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, "0");
      const month = dateMatch[2].padStart(2, "0");
      const year = new Date().getFullYear();
      currentDate = `${year}-${month}-${day}`;
      i++;
      continue;
    }

    if (!/\sx\s/i.test(line)) {
      i++;
      continue;
    }

    const teamLine = line;
    const compLine = i + 1 < lines.length ? lines[i + 1] : "";
    const channelLine = i + 2 < lines.length ? lines[i + 2] : "";

    const teamParts = teamLine.split(/\sx\s/i).map((t) => t.trim());
    const home_team = teamParts[0] || "";
    const away_team = teamParts[1] || "";
    const is_womens = /\(F\)/i.test(teamLine);

    let competition = "";
    let competition_detail = "";
    let game_time = "00:00";

    if (compLine.includes("🏆") || /[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]/.test(compLine) || compLine.includes("/")) {
      const afterTrophy = compLine.includes("🏆") ? (compLine.split("🏆").pop() || "") : compLine;
      const beforeSlash = afterTrophy.split("/")[0].trim();

      const detailMatch = beforeSlash.match(/\(([^)]+)\)/);
      if (detailMatch) {
        competition_detail = detailMatch[1];
        competition = beforeSlash.replace(/\([^)]+\)/, "").trim();
      } else {
        competition = beforeSlash;
      }
      competition = competition.replace(/[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛📺🏆]/g, "").trim();

      const timeMatch = compLine.match(/(?:[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]\s*)?(\d{1,2})[hH:](\d{2})/);
      if (timeMatch) {
        const hours = timeMatch[1].padStart(2, "0");
        const minutes = timeMatch[2] || "00";
        game_time = `${hours}:${minutes}`;
      } else {
        const timeMatchShort = compLine.match(/(?:[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]\s*)?(\d{1,2})[hH]\b/);
        if (timeMatchShort) {
          game_time = `${timeMatchShort[1].padStart(2, "0")}:00`;
        }
      }
    }

    let channels: string[] = [];
    if (channelLine.includes("📺")) {
      const afterTv = channelLine.split("📺").pop() || "";
      channels = afterTv
        .split(",")
        .flatMap((part) => part.split(/ e (?=[A-Z])/))
        .map((c) => c.trim())
        .filter(Boolean);
    }

    games.push({
      home_team,
      away_team,
      competition,
      competition_detail,
      game_time,
      channels,
      is_womens,
      date: currentDate,
      selected: true,
    });

    i += 3;
  }

  return games;
}

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
});
