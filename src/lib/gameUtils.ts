export type SportType = 'football' | 'basketball' | 'tennis' | 'f1' | 'mma' | 'volleyball';

/** Exact regulation duration in minutes per sport (no extra time) */
export const SPORT_DURATION: Record<SportType, number> = {
  football: 90,
  basketball: 48,
  tennis: 180,
  f1: 120,
  mma: 25,
  volleyball: 90,
};

/** Sport emoji map */
export const SPORT_EMOJI: Record<SportType, string> = {
  football: '⚽',
  basketball: '🏀',
  tennis: '🎾',
  f1: '🏎️',
  mma: '🥊',
  volleyball: '🏐',
};

/** Sport label map */
export const SPORT_LABEL: Record<SportType, string> = {
  football: 'Futebol',
  basketball: 'Basquete',
  tennis: 'Tênis',
  f1: 'F1',
  mma: 'MMA',
  volleyball: 'Vôlei',
};

/** Detect sport type from competition name */
export function detectSportType(competition: string): SportType {
  const c = competition.toLowerCase();
  if (/\b(nba|nbb|euroleague|wnba|basquete)\b/i.test(c)) return 'basketball';
  if (/\b(atp|wta|roland garros|wimbledon|us open|australian open|tênis|tenis)\b/i.test(c)) return 'tennis';
  if (/\b(fórmula 1|formula 1|f1|grande prêmio|grande premio|\bgp\b)\b/i.test(c)) return 'f1';
  if (/\b(ufc|bellator|pfl|mma)\b/i.test(c)) return 'mma';
  if (/\b(superliga|liga das nações.*vôlei|liga das nacoes.*volei|vôlei|volei)\b/i.test(c)) return 'volleyball';
  return 'football';
}

/**
 * Returns today's date as YYYY-MM-DD in the browser's local timezone.
 */
export function getLocalDateString(date?: Date): string {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Checks if a game is currently live based on its scheduled time and sport duration.
 */
export function isGameCurrentlyLive(gameTime: string, gameDate: string, sportType: SportType = 'football'): boolean {
  const now = new Date();
  if (gameDate !== getLocalDateString(now)) return false;

  const [gh, gm] = (gameTime || "00:00").split(":").map(Number);
  const gameMinutes = gh * 60 + gm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const duration = SPORT_DURATION[sportType] || 90;

  return nowMinutes >= gameMinutes && nowMinutes < gameMinutes + duration;
}

/**
 * Returns elapsed minutes since game start, or null if game hasn't started
 * or duration has passed.
 */
export function getElapsedMinutes(gameTime: string, gameDate: string, sportType: SportType = 'football'): number | null {
  const now = new Date();
  if (gameDate !== getLocalDateString(now)) return null;

  const [gh, gm] = (gameTime || "00:00").split(":").map(Number);
  const gameMinutes = gh * 60 + gm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const duration = SPORT_DURATION[sportType] || 90;

  const elapsed = nowMinutes - gameMinutes;
  if (elapsed < 0 || elapsed >= duration) return null;
  return elapsed;
}
