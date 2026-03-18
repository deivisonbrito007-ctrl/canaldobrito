/**
 * Checks if a game is currently live based on its scheduled time.
 * A game is live if: now >= game_time AND now < game_time + 90min
 * Uses the game's date + game_time to build the full datetime.
 */
export function isGameCurrentlyLive(gameTime: string, gameDate: string): boolean {
  const [h, m] = (gameTime || "00:00").split(":").map(Number);
  const start = new Date(`${gameDate}T00:00:00`);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const now = new Date();
  return now >= start && now < end;
}
