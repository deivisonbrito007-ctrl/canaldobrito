export type SportType = "football" | "basketball";

export type GameStatus = "scheduled" | "live" | "finished";

export interface Team {
  name: string;
  logo?: string;
  score?: number;
}

export interface Game {
  id: string;
  sport: SportType;
  league: string;
  leagueIcon?: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  status: GameStatus;
  venue?: string;
  round?: string;
  highlight?: boolean;
  apiSource?: "api-football" | "balldontlie" | "pandascore" | "manual";
  externalId?: string;
  broadcastChannel?: string;
}

export interface SportConfig {
  type: SportType;
  label: string;
  icon: string;
  color: string;
}

export const SPORTS: SportConfig[] = [
  { type: "football", label: "Futebol", icon: "⚽", color: "hsl(122 39% 49%)" },
  { type: "basketball", label: "Basketball", icon: "🏀", color: "hsl(25 95% 53%)" },
];
