export type SportType = 'football' | 'basketball' | 'tennis' | 'f1' | 'mma' | 'volleyball' | 'hockey' | 'baseball';

/** Realistic duration in minutes per sport (includes halftime, timeouts, stoppages) */
export const SPORT_DURATION: Record<SportType, number> = {
  football: 105,   // 90 + 15 halftime (sem acréscimos)
  basketball: 150, // 48 game + intervals + timeouts
  tennis: 210,     // covers long matches
  f1: 130,         // race + safety car margin
  mma: 180,        // full card (prelims or main) ~3h
  volleyball: 120, // sets + tie-break margin
  hockey: 150,     // 60 game + intervals + overtime
  baseball: 210,   // 9 innings + extras
};

/** Extra buffer after duration ends to cover delays/overtime */
export const LIVE_BUFFER_MINUTES = 15;

/** Sport emoji map */
export const SPORT_EMOJI: Record<SportType, string> = {
  football: '⚽',
  basketball: '🏀',
  tennis: '🎾',
  f1: '🏎️',
  mma: '🥊',
  volleyball: '🏐',
  hockey: '🏒',
  baseball: '⚾',
};

/** Sport label map */
export const SPORT_LABEL: Record<SportType, string> = {
  football: 'Futebol',
  basketball: 'Basquete',
  tennis: 'Tênis',
  f1: 'F1',
  mma: 'MMA',
  volleyball: 'Vôlei',
  hockey: 'Hóquei',
  baseball: 'Baseball',
};

/** Sports that don't have two adversarial teams (e.g. motorsport) */
const NON_ADVERSARIAL: SportType[] = ['f1', 'tennis', 'mma'];
export const isNonAdversarial = (st: SportType): boolean => NON_ADVERSARIAL.includes(st);

/** Detect sport type from competition name and optional team names */
export function detectSportType(competition: string, teamNames?: string): SportType {
  const c = `${competition} ${teamNames || ''}`.toLowerCase();
  if (/\b(nba|nbb|euroleague|wnba|basquete)\b/i.test(c)) return 'basketball';
  if (/\b(nhl|h[oó]quei|hockey)\b/i.test(c) || /\b(maple leafs|bruins|penguins|canadiens|blackhawks|red wings|flyers|capitals|lightning|avalanche|oilers|canucks|senators|islanders|hurricanes|predators|blue jackets|sharks|ducks|coyotes|kraken|devils|sabres)\b/i.test(c)) return 'hockey';
  if (/\b(mlb|baseball|beisebol)\b/i.test(c) || /\b(yankees|red sox|dodgers|cubs|mets|astros|braves|phillies|padres|brewers|guardians|orioles|twins|rays|mariners|diamondbacks|rockies|pirates|royals|tigers|white sox|marlins)\b/i.test(c)) return 'baseball';
  if (/\b(rugby|sevens|svns|world rugby|super rugby)\b/i.test(c)) return 'rugby';
  if (/\b(atp|wta|roland garros|wimbledon|us open|australian open)\b/i.test(c) || /t[eê]nis/i.test(c)) return 'tennis';
  if (/\b(f[oó]rmula[ -]?[1e]|f1|grande pr[eê]mio|automobilismo|motogp|moto2|moto3|indycar|stock car|e-prix|superbike|porsche|carrera cup)\b/i.test(c) || /\bgp\b/i.test(c)) return 'f1';
  if (/\b(ufc|bellator|pfl|mma)\b/i.test(c)) return 'mma';
  if (/\b(box[e]?|wbc|wba|wbo|ibf)\b/i.test(c)) return 'boxing';
  if (/\b(superliga)\b/i.test(c) || /v[oô]lei/i.test(c) || /liga das na[çc][oõ]es.*v[oô]lei/i.test(c)) return 'volleyball';
  if (/\b(wsl|surf|pipeline|tahiti pro)\b/i.test(c)) return 'surf';
  if (/\b(tour de france|giro|vuelta|ciclismo|cycling|paris.roubaix|uci)\b/i.test(c)) return 'cycling';
  if (/\b(nata[çc][aã]o|swimming|fina|world aquatics)\b/i.test(c)) return 'swimming';
  if (/\b(golf|golfe|pga|masters|ryder cup|the open)\b/i.test(c)) return 'golf';
  return 'football';
}

/**
 * Returns today's date as YYYY-MM-DD in America/Sao_Paulo timezone.
 * Falls back to browser local timezone if Intl is unavailable.
 */
export function getLocalDateString(date?: Date): string {
  const d = date ?? new Date();
  try {
    // Format in São Paulo timezone
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d); // returns YYYY-MM-DD in en-CA locale
    return parts;
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

/**
 * Returns current hours and minutes in America/Sao_Paulo timezone.
 */
function getNowInSaoPaulo(): { hours: number; minutes: number } {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now);
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return { hours: h, minutes: m };
  } catch {
    return { hours: now.getHours(), minutes: now.getMinutes() };
  }
}

/**
 * Checks if a game is currently live based on its scheduled time and sport duration.
 */
export function isGameCurrentlyLive(gameTime: string, gameDate: string, sportType: SportType = 'football'): boolean {
  const now = new Date();
  if (gameDate !== getLocalDateString(now)) return false;

  const [gh, gm] = (gameTime || "00:00").split(":").map(Number);
  const gameMinutes = gh * 60 + gm;
  const sp = getNowInSaoPaulo();
  const nowMinutes = sp.hours * 60 + sp.minutes;
  const duration = (SPORT_DURATION[sportType] || 115) + LIVE_BUFFER_MINUTES;

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
  const sp = getNowInSaoPaulo();
  const nowMinutes = sp.hours * 60 + sp.minutes;
  const duration = (SPORT_DURATION[sportType] || 115) + LIVE_BUFFER_MINUTES;

  const elapsed = nowMinutes - gameMinutes;
  if (elapsed < 0 || elapsed >= duration) return null;
  return elapsed;
}

/**
 * Returns minutes until a game starts, or null if game already started or passed.
 */
export function getMinutesUntilStart(gameTime: string, gameDate: string): number | null {
  const now = new Date();
  if (gameDate !== getLocalDateString(now)) return null;

  const [gh, gm] = (gameTime || "00:00").split(":").map(Number);
  const gameMinutes = gh * 60 + gm;
  const sp = getNowInSaoPaulo();
  const nowMinutes = sp.hours * 60 + sp.minutes;

  const diff = gameMinutes - nowMinutes;
  if (diff <= 0) return null;
  return diff;
}

/**
 * Formats minutes into a human-readable countdown string (pt-BR).
 */
/**
 * Returns a Date object representing midnight of the given date in São Paulo (UTC-3).
 */
export function midnightInSaoPaulo(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00-03:00`);
}

export function formatCountdown(minutes: number): string {
  if (minutes < 1) return "Agora!";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
