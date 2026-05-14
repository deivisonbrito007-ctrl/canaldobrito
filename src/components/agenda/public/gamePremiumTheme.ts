import type { SportType } from "@/lib/gameUtils";

export type SportTheme = {
  /** hex accent — borda lateral e ícone */
  accent: string;
  /** rgba glow para shadows */
  glow: string;
};

export const SPORT_THEME: Record<SportType, SportTheme> = {
  football:   { accent: "#00ff87", glow: "0,255,135" },
  basketball: { accent: "#ff8a3d", glow: "255,138,61" },
  tennis:     { accent: "#a78bfa", glow: "167,139,250" },
  volleyball: { accent: "#fbbf24", glow: "251,191,36" },
  mma:        { accent: "#ff5252", glow: "255,82,82" },
  boxing:     { accent: "#ff5252", glow: "255,82,82" },
  f1:         { accent: "#e10600", glow: "225,6,0" },
  hockey:     { accent: "#60a5fa", glow: "96,165,250" },
  baseball:   { accent: "#f97316", glow: "249,115,22" },
  rugby:      { accent: "#3b82f6", glow: "59,130,246" },
  surf:       { accent: "#06b6d4", glow: "6,182,212" },
  cycling:    { accent: "#facc15", glow: "250,204,21" },
  swimming:   { accent: "#38bdf8", glow: "56,189,248" },
  golf:       { accent: "#84cc16", glow: "132,204,22" },
};

export function themeFor(sport: SportType): SportTheme {
  return SPORT_THEME[sport] ?? SPORT_THEME.football;
}
