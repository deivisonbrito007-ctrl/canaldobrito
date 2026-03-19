/**
 * Returns today's date as YYYY-MM-DD in the browser's local timezone.
 * Avoids the UTC bug where toISOString().split("T")[0] returns tomorrow
 * after 21h in UTC-3 (Brazil).
 */
export function getLocalDateString(date?: Date): string {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Checks if a game is currently live based on its scheduled time.
 * A game is live if: now >= game_time AND now < game_time + 90min
 * Only applies to games scheduled for today's date (local).
 */
export function isGameCurrentlyLive(gameTime: string, gameDate: string): boolean {
  const now = new Date();
  if (gameDate !== getLocalDateString(now)) return false;

  const [gh, gm] = (gameTime || "00:00").split(":").map(Number);
  const gameMinutes = gh * 60 + gm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return nowMinutes >= gameMinutes && nowMinutes < gameMinutes + 90;
}

/**
 * Returns elapsed minutes since game start, or null if game hasn't started
 * or isn't today.
 */
export function getElapsedMinutes(gameTime: string, gameDate: string): number | null {
  const now = new Date();
  if (gameDate !== getLocalDateString(now)) return null;

  const [gh, gm] = (gameTime || "00:00").split(":").map(Number);
  const gameMinutes = gh * 60 + gm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const elapsed = nowMinutes - gameMinutes;
  if (elapsed < 0 || elapsed >= 90) return null;
  return elapsed;
}
