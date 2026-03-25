/**
 * Normalized key for deduplication of daily games.
 * Uses home_team + away_team + game_time (lowercased, trimmed).
 */
export function gameKey(g: { home_team: string; away_team: string; game_time: string }): string {
  return `${g.home_team.toLowerCase().trim()}|${g.away_team.toLowerCase().trim()}|${g.game_time.slice(0, 5)}`;
}
