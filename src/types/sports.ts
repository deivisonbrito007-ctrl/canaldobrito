export type SportType = "football" | "basketball" | "tennis" | "american_football" | "baseball" | "motorsport" | "mma" | "hockey" | "golf" | "esports";

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
  { type: "american_football", label: "Football Americano", icon: "🏈", color: "hsl(220 70% 45%)" },
  { type: "baseball", label: "Baseball", icon: "⚾", color: "hsl(0 72% 51%)" },
  { type: "hockey", label: "Hockey", icon: "🏒", color: "hsl(200 80% 50%)" },
  { type: "tennis", label: "Tênis", icon: "🎾", color: "hsl(80 60% 45%)" },
  { type: "mma", label: "MMA / UFC", icon: "🥊", color: "hsl(0 85% 40%)" },
  { type: "motorsport", label: "Automobilismo", icon: "🏎️", color: "hsl(0 0% 30%)" },
  { type: "golf", label: "Golf", icon: "⛳", color: "hsl(140 50% 40%)" },
  { type: "esports", label: "E-Sports", icon: "🎮", color: "hsl(270 60% 50%)" },
];
