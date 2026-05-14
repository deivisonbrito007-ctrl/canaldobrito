import type { DailyGame } from "@/hooks/useDailyGames";
import { detectSportType, isGameCurrentlyLive, type SportType } from "@/lib/gameUtils";

/**
 * Regex de competições "imperdíveis". Ordem irrelevante; usado em case-insensitive.
 */
const TOP_COMPETITIONS = /\b(brasileir[aã]o|libertadores|sul[- ]americana|copa do brasil|champions|premier league|la ?liga|serie a|bundesliga|ligue 1|europa league|conference league|world cup|copa do mundo|sele[çc][aã]o|nba|playoffs?|finais?|final|nfl|super ?bowl|ufc \d+|ufc fight night|ufc on|f[oó]rmula 1|gp d[aeo]|grande pr[eê]mio|wimbledon|roland garros|us open|australian open|atp finals|masters)\b/i;

const TOP_TEAMS = /\b(flamengo|palmeiras|corinthians|s[aã]o paulo|santos|fluminense|gr[eê]mio|internacional|atl[eé]tico|cruzeiro|botafogo|vasco|real madrid|barcelona|bayern|manchester|liverpool|chelsea|arsenal|psg|juventus|milan|inter|atletico madrid|borussia)\b/i;

export type Highlight = {
  game: DailyGame;
  reason: "live" | "competition" | "team";
};

/**
 * Retorna até `limit` jogos imperdíveis do dia.
 * Prioridade: ao vivo > competição top > time grande.
 */
export function curateHighlights(games: DailyGame[], limit = 8): Highlight[] {
  const seen = new Set<string>();
  const out: Highlight[] = [];

  const add = (game: DailyGame, reason: Highlight["reason"]) => {
    if (seen.has(game.id)) return;
    seen.add(game.id);
    out.push({ game, reason });
  };

  // 1) Ao vivo agora
  for (const g of games) {
    const sport = (g.sport_type || "football") as SportType;
    if (isGameCurrentlyLive(g.game_time, g.date, sport)) add(g, "live");
  }

  // 2) Competições top
  for (const g of games) {
    const text = `${g.competition} ${g.competition_detail ?? ""}`;
    if (TOP_COMPETITIONS.test(text)) add(g, "competition");
  }

  // 3) Times grandes
  for (const g of games) {
    const text = `${g.home_team} ${g.away_team}`;
    if (TOP_TEAMS.test(text)) add(g, "team");
  }

  return out.slice(0, limit);
}

export function detectedSport(g: DailyGame): SportType {
  const saved = (g.sport_type || "football") as SportType;
  const detected = detectSportType(`${g.competition} ${g.home_team} ${g.away_team}`);
  return detected !== "football" ? detected : saved;
}
