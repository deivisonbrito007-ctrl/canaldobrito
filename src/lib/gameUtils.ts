/**
 * Checks if a game is currently live based on its scheduled time.
 * A game is live if: now >= game_time AND now < game_time + 90min
 * Compares only hours/minutes of today to avoid timezone parsing issues.
 * Only applies to games scheduled for today's date.
 */
export function isGameCurrentlyLive(gameTime: string, gameDate: string): boolean {
  const now = new Date();

  // Check if game date matches today (local)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (gameDate !== todayStr) return false;

  const [gh, gm] = (gameTime || "00:00").split(":").map(Number);
  const gameMinutes = gh * 60 + gm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return nowMinutes >= gameMinutes && nowMinutes < gameMinutes + 90;
}
