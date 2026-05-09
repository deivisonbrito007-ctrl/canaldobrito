import { useState, useRef, useEffect, useMemo } from "react";
import { detectSportType, SPORT_EMOJI, SPORT_LABEL, type SportType } from "@/lib/gameUtils";
import { gameKey } from "@/lib/dedup";
import { getLocalDateString, midnightInSaoPaulo } from "@/lib/gameUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useInsertDailyGames, useDeleteDailyGamesByDate, fetchExistingGameKeys } from "@/hooks/useDailyGames";
import { Loader2, FileText, Trash2, Check, Pencil, X, Clipboard, Clock, CheckSquare, Square, AlertTriangle, Camera, Copy, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ParsedGame {
  home_team: string;
  away_team: string;
  competition: string;
  competition_detail: string;
  game_time: string;
  channels: string[];
  is_womens: boolean;
  date: string;
  selected: boolean;
  sport_type?: SportType;
  dateBumped?: boolean;
}

const PLACEHOLDER = `Cole aqui a programação do dia...

Exemplo:
📅**Dia 20/03**

Flamengo x Palmeiras
🏆 Brasileirão / ⏰ 19h00
📺 Sportv, Premiere`;

const COMP_LINE_RE = /(?:🏆|🎾|🏎️|🏎|🥊|🏀|🏐|🏒|⚾|🏉|🏄|🚴|⛳|🏊|[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]|\/)/;

/** Map emoji at start of competition line to sport_type */
function detectSportFromEmoji(compLine: string): SportType | null {
  if (/^🎾/.test(compLine)) return 'tennis';
  if (/^(?:🏎️|🏎)/.test(compLine)) return 'f1';
  if (/^🏀/.test(compLine)) return 'basketball';
  if (/^🏐/.test(compLine)) return 'volleyball';
  if (/^🏒/.test(compLine)) return 'hockey';
  if (/^⚾/.test(compLine)) return 'baseball';
  if (/^🏉/.test(compLine)) return 'rugby';
  if (/^🏄/.test(compLine)) return 'surf';
  if (/^🚴/.test(compLine)) return 'cycling';
  if (/^⛳/.test(compLine)) return 'golf';
  if (/^🏊/.test(compLine)) return 'swimming';
  if (/^🥊/.test(compLine)) return null; // boxing or mma — let detectSportType decide
  if (/^🏆/.test(compLine)) return null; // generic trophy — skip
  return null;
}

function isCompetitionLine(line: string): boolean {
  return COMP_LINE_RE.test(line);
}

function parseCompAndTime(compLine: string) {
  let competition = "";
  let competition_detail = "";
  let game_time = "00:00";

  const cleaned = compLine.replace(/[🏆🎾🏎🏎️🥊🏀🏐🏒⚾🏉🏄🚴⛳🏊]/g, "");
  const beforeSlash = cleaned.split("/")[0].trim();

  const detailMatch = beforeSlash.match(/\(([^)]+)\)/);
  if (detailMatch) {
    competition_detail = detailMatch[1];
    competition = beforeSlash.replace(/\([^)]+\)/, "").trim();
  } else {
    competition = beforeSlash;
  }
  competition = competition.replace(/[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛📺]/g, "").trim();

  const timeMatch = compLine.match(/(?:[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]\s*)?(\d{1,2})[hH:](\d{2})/);
  if (timeMatch) {
    game_time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  } else {
    const timeMatchShort = compLine.match(/(?:[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]\s*)?(\d{1,2})[hH]\b/);
    if (timeMatchShort) {
      game_time = `${timeMatchShort[1].padStart(2, "0")}:00`;
    }
  }

  return { competition, competition_detail, game_time };
}

/** Strip markdown bold, residual emojis, surrogates, double spaces */
function cleanText(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")  // **bold** → bold
    .replace(/\*/g, "")                  // stray asterisks
    .replace(/[🏆🎾🏎️🏎🥊🏀🏐🏒⚾🏉🏄🚴⛳🏊📺⏰]/g, "") // residual sport/channel emojis
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")  // remove flag emojis (🇧🇷, 🇫🇷, etc.)
    .replace(/[\u{1F3F4}\u{E0067}-\u{E007F}]/gu, "") // remove subdivision flags
    .replace(/[\uD800-\uDFFF]/g, "")     // remove broken UTF-16 surrogates
    .replace(/\s{2,}/g, " ")             // double spaces
    .trim();
}

/** Sanitize any string to be JSON-safe (remove surrogates + flag emojis) */
function sanitizeStr(s: string): string {
  return s
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/[\u{1F3F4}\u{E0067}-\u{E007F}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanupGame(game: ParsedGame): ParsedGame {
  let away = game.away_team.trim();
  // Remove placeholder-only away teams
  if (/^[\?\-–—\s]*$/.test(away) || away.toLowerCase() === "tbd" || away.toLowerCase() === "a definir") {
    away = "";
  }

  let home = game.home_team.replace(/\s*x\s*\?\s*$/i, "").trim();

  home = cleanText(home);
  away = cleanText(away);
  const competition = cleanText(game.competition);
  const competition_detail = cleanText(game.competition_detail);

  return { ...game, home_team: home, away_team: away, competition, competition_detail };
}

/** Check if a line is a metadata line (🏆, 📍, ⏰, 📺) */
function isMetadataLine(line: string): boolean {
  return /^(?:🏆|🎾|🏎️|🏎|🥊|🏀|🏐|🏒|⚾|🏉|🏄|🚴|⛳|🏊|📍|⏰|🕐|🕑|🕒|🕓|🕔|🕕|🕖|🕗|🕘|🕙|🕚|🕛|📺)/.test(line);
}

/** Check if a line is a section header (e.g. FUTEBOL, NBA, Brasileirão Feminino) */
function isSectionHeader(line: string, nextLine?: string): boolean {
  // Skip lines that are metadata
  if (isMetadataLine(line)) return false;
  // Skip date headers (handled separately)
  if (/(?:📅|🗓|🗓️|\*\*Dia|Dia)\s*\**\s*(?:Dia\s*)?\**\s*\d{1,2}\/\d{1,2}/i.test(line)) return false;
  // Skip lines with " x " (team matchups)
  if (/\sx\s/i.test(line)) return false;

  // All-caps text without metadata emoji → section header
  const stripped = line.replace(/[^a-zA-ZÀ-ÿ\s]/g, "").trim();
  if (stripped.length > 0 && stripped === stripped.toUpperCase()) return true;

  // Known section names (mixed case)
  const sectionPatterns = /^(FIFA Series|Amistosos? Internacion|Brasileir[aã]o|Copa Argentina|Liga das Na[çc][oõ]es|Superliga|LA Open|Miami Open|ATP|WTA|Horários de Brasília|AGENDA ESPORTIVA)/i;
  if (sectionPatterns.test(line)) {
    // Only a header if next line is NOT a metadata line (otherwise it's a game title)
    if (nextLine && isMetadataLine(nextLine)) return false;
    return true;
  }

  return false;
}

/** Split a channel list string by `,`, `/`, ` | `, ` e ` into individual channels.
 *  Ex: "Globo / Paramount+, ESPN e SporTV" -> ["Globo","Paramount+","ESPN","SporTV"] */
function splitChannels(raw: string): string[] {
  return raw
    .split(/[,/|]/)
    .flatMap((part) => part.split(/ e (?=[A-Za-z0-9])/))
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Collect metadata from lines following a game title */
function collectMetadata(lines: string[], startIdx: number): {
  competition: string;
  competition_detail: string;
  game_time: string;
  channels: string[];
  sport_type: SportType | null;
  linesConsumed: number;
} {
  let competition = "";
  let competition_detail = "";
  let game_time = "00:00";
  let channels: string[] = [];
  let sport_type: SportType | null = null;
  let consumed = 0;

  let j = startIdx;
  while (j < lines.length && isMetadataLine(lines[j])) {
    const ml = lines[j];

    // 🏆 or sport emoji → competition line
    if (/^(?:🏆|🎾|🏎️|🏎|🥊|🏀|🏐|🏒|⚾|🏉|🏄|🚴|⛳|🏊)/.test(ml)) {
      sport_type = detectSportFromEmoji(ml);
      const cleaned = ml.replace(/^(?:🏆|🎾|🏎️|🏎|🥊|🏀|🏐|🏒|⚾|🏉|🏄|🚴|⛳|🏊)\s*/, "").trim();
      // Check if this line also has time (old format: 🏆 Comp / ⏰ 19h00)
      if (/(?:⏰|🕐|🕑|🕒|🕓|🕔|🕕|🕖|🕗|🕘|🕙|🕚|🕛)/.test(ml)) {
        const parsed = parseCompAndTime(ml);
        competition = parsed.competition;
        competition_detail = parsed.competition_detail;
        game_time = parsed.game_time;
      } else {
        // Competition only — may have detail in parentheses
        const detailMatch = cleaned.match(/\(([^)]+)\)/);
        if (detailMatch) {
          competition_detail = detailMatch[1];
          competition = cleaned.replace(/\([^)]+\)/, "").trim();
        } else {
          competition = cleaned;
        }
      }
      // Also check if line has 📺 (old format all-in-one)
      if (/📺/.test(ml)) {
        const afterTv = ml.split("📺").pop() || "";
        channels = splitChannels(afterTv);
      }
    }
    // 📍 → competition detail
    else if (/^📍/.test(ml)) {
      competition_detail = ml.replace(/^📍\s*/, "").trim();
    }
    // ⏰ or clock emoji → time
    else if (/^(?:⏰|🕐|🕑|🕒|🕓|🕔|🕕|🕖|🕗|🕘|🕙|🕚|🕛)/.test(ml)) {
      const timeMatch = ml.match(/(\d{1,2})[hH:](\d{2})/);
      if (timeMatch) {
        game_time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
      } else {
        const timeMatchShort = ml.match(/(\d{1,2})[hH]\b/);
        if (timeMatchShort) {
          game_time = `${timeMatchShort[1].padStart(2, "0")}:00`;
        }
      }
    }
    // 📺 → channels
    else if (/^📺/.test(ml)) {
      const afterTv = ml.replace(/^📺\s*/, "");
      channels = splitChannels(afterTv);
    }

    consumed++;
    j++;
  }

  return { competition, competition_detail, game_time, channels, sport_type, linesConsumed: consumed };
}

/** Advance a YYYY-MM-DD date by 1 day */
function bumpDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid DST issues
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ============================================================
// FORMAT C — inline pre-processor
// Converts WhatsApp messages that look like:
//   🏀 Basquete — Jogos do Dia (09/05)
//   WNBA
//   Dallas Wings x Indiana Fever — ESPN 3 — 14:00
// into the canonical Format A that parseScheduleText already understands.
// ============================================================

const EM_DASH_SPLIT_RE = /\s+[—–]\s+/;
const EM_DASH_TEST_RE = /\s+[—–]\s+/;
const SECTION_DATE_RE = /\((\d{1,2})\/(\d{1,2})\)/;
const TIME_TOKEN_RE = /^(\d{1,2})[h:](\d{2})$/;
const TIME_ANYWHERE_RE = /\b(\d{1,2})[h:](\d{2})\b/;

const KNOWN_SUBSECTIONS_RE =
  /^(WNBA|NBA|NBB|NBL|EuroLeague|MotoGP|Moto2|Moto3|F1|Fórmula 1|Formula 1|IndyCar|Stock Car|Formula E|UFC|Bellator|Boxe|Boxing|MMA|ATP|WTA|PGA Tour|LPGA|Italian Open|Roland Garros|Wimbledon|US Open|Australian Open|Masters|Brasileir[aã]o(?: Feminino)?|Champions League|Premier League|La Liga|Bundesliga|Serie A|Libertadores|Sul-Americana|Copa do Brasil|Eurocopa|Liga das Na[çc][oõ]es)$/i;

const SPORT_EMOJI_LIST = ["🏀", "🎾", "🏎️", "🏎", "🥊", "🏐", "🏒", "⚾", "🏉", "🏄", "🚴", "⛳", "🏊", "🏆", "🏁", "⚽"];

function startsWithSportEmoji(s: string): { emoji: string; rest: string } | null {
  for (const e of SPORT_EMOJI_LIST) {
    if (s.startsWith(e)) return { emoji: e, rest: s.slice(e.length).trim() };
  }
  return null;
}

function normalizeSportEmoji(e: string): string {
  // Map flag/automobilismo emoji to the canonical 🏎️
  if (e === "🏁" || e === "🏎") return "🏎️";
  if (e === "⚽") return "🏆";
  return e;
}

export function preprocessInlineFormatC(text: string): string {
  const rawLines = text.split("\n");
  const out: string[] = [];

  let currentSportEmoji = "🏆";
  let currentCompetition = "";
  let currentEvent = "";
  let currentDetail = "";
  let lastDateEmitted = "";
  let producedAnyGame = false;

  const emitDateIfNeeded = (dayMonth: string) => {
    if (lastDateEmitted !== dayMonth) {
      if (out.length > 0) out.push("");
      out.push(`📅**Dia ${dayMonth}**`);
      out.push("");
      lastDateEmitted = dayMonth;
    }
  };

  for (const raw of rawLines) {
    const line = raw.trim();
    if (!line) {
      out.push("");
      continue;
    }

    // Strip dividers and WhatsApp footer noise
    if (/^[-—–=*_]{3,}$/.test(line)) continue;
    if (/^📞/.test(line)) continue;

    // Section header with leading sport emoji (may carry a date in parens)
    // e.g. "🏀 Basquete — Jogos do Dia (09/05)" or "🥊 Combate"
    const sport = startsWithSportEmoji(line);
    const isFormatALikeMeta = isMetadataLine(line);
    const lineWithoutDate = line.replace(SECTION_DATE_RE, "");
    const looksLikeSectionHeader =
      !!sport &&
      !TIME_ANYWHERE_RE.test(line) &&
      !lineWithoutDate.includes("/") &&
      !/\sx\s/i.test(line) &&
      (EM_DASH_TEST_RE.test(line) || SECTION_DATE_RE.test(line) || sport.rest.length <= 30);

    if (looksLikeSectionHeader && sport) {
      currentSportEmoji = normalizeSportEmoji(sport.emoji);
      const dateM = line.match(SECTION_DATE_RE);
      if (dateM) {
        const day = dateM[1].padStart(2, "0");
        const month = dateM[2].padStart(2, "0");
        emitDateIfNeeded(`${day}/${month}`);
      }
      const headerName = sport.rest.split(EM_DASH_SPLIT_RE)[0].replace(/\s*\(.*?\)\s*/g, "").trim();
      currentCompetition = headerName;
      currentEvent = headerName;
      currentDetail = "";
      continue;
    }

    // Pass Format A metadata lines through untouched
    if (isFormatALikeMeta) {
      out.push(line);
      continue;
    }

    // Inline em-dash lines = Format C candidates
    if (EM_DASH_TEST_RE.test(line)) {
      const parts = line.split(EM_DASH_SPLIT_RE).map((p) => p.trim()).filter(Boolean);

      // Time as the LAST segment
      const last = parts[parts.length - 1];
      const lastTime = last.match(TIME_TOKEN_RE);

      if (lastTime && parts.length >= 2) {
        const time = `${lastTime[1].padStart(2, "0")}h${lastTime[2]}`;
        const middle = parts.slice(0, -1);

        let title = middle[0];
        let detail = "";
        let channel = "";

        if (middle.length >= 2) {
          channel = middle[middle.length - 1];
          if (middle.length >= 3) {
            detail = middle.slice(1, -1).join(" — ");
          }
        } else {
          // Only [title, time] — no channel info
          channel = "";
        }

        const isMatch = /\sx\s/i.test(title);
        const compName = currentCompetition || (isMatch ? "" : title);
        const compFull = detail ? (compName ? `${compName} (${detail})` : `(${detail})`) : compName;

        out.push(title);
        const compLine = compFull
          ? `${currentSportEmoji} ${compFull} / ⏰ ${time}`
          : `${currentSportEmoji} ⏰ ${time}`;
        out.push(compLine);
        if (channel) out.push(`📺 ${channel}`);
        out.push("");

        if (!isMatch) currentEvent = title;
        producedAnyGame = true;
        continue;
      }

      // Time as the FIRST segment, e.g. "06:00 — ESPN 2"
      const firstTime = parts[0].match(TIME_TOKEN_RE);
      if (firstTime && parts.length >= 2 && currentEvent) {
        const time = `${firstTime[1].padStart(2, "0")}h${firstTime[2]}`;
        const channel = parts.slice(1).join(" — ");
        out.push(currentEvent);
        const baseComp = currentCompetition || currentEvent;
        const compFull = currentDetail ? `${baseComp} (${currentDetail})` : baseComp;
        out.push(`${currentSportEmoji} ${compFull} / ⏰ ${time}`);
        out.push(`📺 ${channel}`);
        out.push("");
        producedAnyGame = true;
        continue;
      }

      // Em-dash line with no time → competition / event header with detail
      // e.g. "PGA Tour — Terceira Rodada"
      if (!TIME_ANYWHERE_RE.test(line)) {
        currentCompetition = parts[0];
        currentEvent = parts[0];
        currentDetail = parts.slice(1).join(" — ");
        continue;
      }
    }

    // Plain subsection competition (no separator, no time, no " x ")
    if (!EM_DASH_TEST_RE.test(line) && !/\sx\s/i.test(line) && !TIME_ANYWHERE_RE.test(line)) {
      // Known competition or short-ish title-case label
      const isKnown = KNOWN_SUBSECTIONS_RE.test(line);
      const looksLikeLabel = line.length <= 40 && /^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 .'+\-/]*$/.test(line);
      if (isKnown || looksLikeLabel) {
        currentCompetition = line.replace(/^[#*\s]+/, "").trim();
        currentEvent = currentCompetition;
        currentDetail = "";
        continue;
      }
    }

    // Default: keep line as-is
    out.push(line);
  }

  // If no Format C games were produced, return the original text unchanged
  // so we don't risk breaking pure Format A inputs.
  return producedAnyGame ? out.join("\n") : text;
}

export function parseScheduleText(
  text: string,
  fallbackDate: string,
  options: { autoBumpMidnight?: boolean } = {}
): ParsedGame[] {
  const { autoBumpMidnight = false } = options;
  const preprocessed = preprocessInlineFormatC(text);
  const lines = preprocessed.split("\n").map((l) => l.trim()).filter(Boolean);
  const games: ParsedGame[] = [];
  let currentDate = fallbackDate;
  let dateFromHeader = false; // track if currentDate came from a 📅 header
  let currentSectionSport: SportType | null = null;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Date detection
    const dateMatch = line.match(/(?:📅|📺|🗓|🗓️|\*\*Dia|Dia)\s*\**\s*(?:Dia\s*)?\**\s*(\d{1,2})\/(\d{1,2})/i);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, "0");
      const month = dateMatch[2].padStart(2, "0");
      const year = new Date().getFullYear();
      currentDate = `${year}-${month}-${day}`;
      dateFromHeader = true;
      i++;
      continue;
    }

    // Date detection for "SEXTA 27/03" style headers
    const headerDateMatch = line.match(/(\d{1,2})\/(\d{1,2})$/);
    if (headerDateMatch && !isMetadataLine(line) && !/\sx\s/i.test(line)) {
      const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
      if (!isMetadataLine(nextLine)) {
        const day = headerDateMatch[1].padStart(2, "0");
        const month = headerDateMatch[2].padStart(2, "0");
        const year = new Date().getFullYear();
        currentDate = `${year}-${month}-${day}`;
        dateFromHeader = true;
        i++;
        continue;
      }
    }

    const nextLine = i + 1 < lines.length ? lines[i + 1] : "";

    // Capture section header sport and skip
    if (isSectionHeader(line, nextLine)) {
      currentSectionSport = detectSportType(line, "");
      i++;
      continue;
    }

    // Check if this line is a game/event title (has metadata lines following)
    const hasMetadataAfter = i + 1 < lines.length && isMetadataLine(lines[i + 1]);
    // Also support old format: line with " x " followed by comp+time line
    const isOldFormatTeamLine = /\sx\s/i.test(line) && isCompetitionLine(nextLine);

    if (hasMetadataAfter || isOldFormatTeamLine) {
      // Parse teams
      let home_team = "";
      let away_team = "";
      let is_womens = false;

      if (/\sx\s/i.test(line)) {
        const teamParts = line.split(/\sx\s/i).map((t) => t.trim());
        home_team = teamParts[0] || "";
        away_team = teamParts[1] || "";
        is_womens = /\(F\)/i.test(line);
      } else {
        home_team = line;
        is_womens = /\(F\)/i.test(line);
      }

      // Collect metadata from following lines
      const meta = collectMetadata(lines, i + 1);

      // For old format compatibility: if no metadata lines consumed but nextLine is comp line
      if (meta.linesConsumed === 0 && isCompetitionLine(nextLine)) {
        const parsed = parseCompAndTime(nextLine);
        meta.competition = parsed.competition;
        meta.competition_detail = parsed.competition_detail;
        meta.game_time = parsed.game_time;
        meta.sport_type = detectSportFromEmoji(nextLine);
        meta.linesConsumed = 1;
        // Check channel line
        const channelLine = i + 2 < lines.length ? lines[i + 2] : "";
        if (channelLine.includes("📺")) {
          const afterTv = channelLine.split("📺").pop() || "";
          meta.channels = splitChannels(afterTv);
          meta.linesConsumed = 2;
        }
      }

      // Use detectSportType with competition + team names for accurate detection
      const autoSport = detectSportType(
        meta.competition || "",
        `${home_team} ${away_team}`
      );
      // Priority: emoji (non-generic) > detectSportType > section header > football
      const finalSport = (meta.sport_type && meta.sport_type !== 'football')
        ? meta.sport_type
        : (autoSport !== 'football')
          ? autoSport
          : currentSectionSport || 'football';

      // Auto-bump: opt-in. Só avança a data se o usuário ligou explicitamente
      // o toggle "Madrugada conta para o dia anterior" no admin.
      let gameDate = currentDate;
      let dateBumped = false;
      if (autoBumpMidnight && dateFromHeader && meta.game_time < "05:00") {
        gameDate = bumpDate(currentDate);
        dateBumped = true;
      }

      games.push(cleanupGame({
        home_team, away_team,
        competition: meta.competition,
        competition_detail: meta.competition_detail,
        game_time: meta.game_time,
        channels: meta.channels,
        is_womens, date: gameDate, selected: true,
        sport_type: finalSport,
        dateBumped,
      }));
      i += 1 + meta.linesConsumed;
      continue;
    }

    i++;
  }

  return games;
}

function formatDatePt(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

/** Get validation warnings for a parsed game */
function getGameWarnings(game: ParsedGame): string[] {
  const warnings: string[] = [];
  if (game.dateBumped) {
    const [, m, d] = game.date.split("-");
    warnings.push(`⏰ Horário ${game.game_time} (madrugada) — data avançada para ${d}/${m}`);
  } else if (game.game_time === "00:00") {
    warnings.push("⏰ Horário 00:00 — verifique se a data está correta");
  }
  if (!game.channels.length) warnings.push("Sem canal");
  if (!game.competition) warnings.push("Sem competição");
  return warnings;
}

function generateWhatsAppSummary(games: ParsedGame[]): string {
  const selected = games.filter((g) => g.selected);
  if (selected.length === 0) return "";

  // Group by date, then by sport
  const byDate: Record<string, ParsedGame[]> = {};
  for (const g of selected) {
    if (!byDate[g.date]) byDate[g.date] = [];
    byDate[g.date].push(g);
  }

  const lines: string[] = [];
  const sortedDates = Object.keys(byDate).sort();

  for (const date of sortedDates) {
    const [, m, d] = date.split("-");
    lines.push(`📅 Programação ${d}/${m}`);
    lines.push("");

    const dateGames = byDate[date];
    const bySport: Record<string, ParsedGame[]> = {};
    for (const g of dateGames) {
      const sport = g.sport_type || detectSportType(g.competition, `${g.home_team} ${g.away_team}`);
      if (!bySport[sport]) bySport[sport] = [];
      bySport[sport].push(g);
    }

    for (const [sport, sportGames] of Object.entries(bySport)) {
      const emoji = SPORT_EMOJI[sport as SportType] || "⚽";
      const label = SPORT_LABEL[sport as SportType] || sport.toUpperCase();
      lines.push(`${emoji} ${label.toUpperCase()}`);

      // Sort by time
      const sorted = [...sportGames].sort((a, b) => a.game_time.localeCompare(b.game_time));
      for (const g of sorted) {
        const matchLine = g.away_team
          ? `${g.game_time} — ${g.home_team} x ${g.away_team}`
          : `${g.game_time} — ${g.home_team}`;
        lines.push(matchLine);

        const details: string[] = [];
        if (g.competition) details.push(`🏆 ${g.competition}${g.competition_detail ? ` · ${g.competition_detail}` : ""}`);
        if (g.channels.length > 0) details.push(`📺 ${g.channels.join(", ")}`);
        if (details.length > 0) lines.push(details.join(" | "));
        lines.push("");
      }
    }
  }

  return lines.join("\n").trim();
}

export const ProgramacaoTexto = () => {
  const today = getLocalDateString();
  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [parsed, setParsed] = useState<ParsedGame[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [scheduleMidnight, setScheduleMidnight] = useState(false);
  // Auto-bump default OFF — empurrar madrugada para +1 dia só quando o WhatsApp
  // realmente usa a convenção de "dia esportivo". Persiste a preferência local.
  const [autoBumpMidnight, setAutoBumpMidnight] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin_auto_bump_midnight") === "true";
  });
  const [readingImage, setReadingImage] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const insertGames = useInsertDailyGames();
  const deleteByDate = useDeleteDailyGamesByDate();

  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());

  const handleProcess = async () => {
    if (!text.trim()) {
      toast.error("Cole o texto da programação primeiro");
      return;
    }
    const games = parseScheduleText(text, selectedDate, { autoBumpMidnight });
    if (games.length === 0) {
      toast.error("Nenhum jogo detectado. Verifique o formato do texto.");
      return;
    }

    // Fetch existing games for all dates to mark duplicates
    const dates = [...new Set(games.map((g) => g.date))];
    const allKeys = new Set<string>();
    for (const d of dates) {
      const keys = await fetchExistingGameKeys(d);
      keys.forEach((k) => allKeys.add(k));
    }
    setExistingKeys(allKeys);

    // Auto-deselect duplicates AGAINST DB and INTERNAL duplicates inside the
    // pasted text itself (root cause of 28/04 publish error: same game listed
    // twice in the WhatsApp message).
    let dbDupCount = 0;
    let internalDupCount = 0;
    const seenInternal = new Set<string>();
    const markedGames = games.map((g) => {
      const key = gameKey(g);
      const isDbDup = allKeys.has(key);
      const isInternalDup = seenInternal.has(key);
      if (!isInternalDup) seenInternal.add(key);
      if (isDbDup) dbDupCount++;
      if (isInternalDup) internalDupCount++;
      const shouldDeselect = isDbDup || isInternalDup;
      return { ...g, selected: shouldDeselect ? false : g.selected };
    });

    setParsed(markedGames);
    if (internalDupCount > 0) {
      toast.warning(
        `${internalDupCount} duplicata(s) interna(s) no texto — desmarcadas para evitar erro`
      );
    }
    if (dbDupCount > 0) {
      toast.warning(`${dbDupCount} jogo(s) já existente(s) — desmarcados automaticamente`);
    }
    if (internalDupCount === 0 && dbDupCount === 0) {
      toast.success(`${games.length} jogo(s) detectado(s)!`);
    }
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleFillExample = () => {
    setText(PLACEHOLDER);
    toast.info("Texto de exemplo preenchido");
  };

  const compressImage = async (file: File, maxDim = 1600, quality = 0.82): Promise<string> => {
    // Always returns a JPEG data URL, downsized so the longest side ≤ maxDim
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Skip canvas re-encode for already-small images
    if (file.size < 800 * 1024) return dataUrl;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });

    const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  };

  const handleReadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 10MB)");
      return;
    }

    setReadingImage(true);
    const toastId = toast.loading("Preparando imagem…");
    try {
      const base64 = await compressImage(file);
      toast.loading("Lendo com IA…", { id: toastId });

      const { data, error } = await supabase.functions.invoke("read-schedule-image", {
        body: { image: base64 },
      });

      // supabase-js wraps non-2xx as `error` but keeps the JSON body in `data`
      const friendly =
        (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) ||
        (error && (error as { message?: string }).message) ||
        null;

      if (error || (data && typeof data === "object" && "error" in data)) {
        console.error("read-schedule-image failed:", { error, data });
        throw new Error(friendly || "Edge function retornou erro");
      }

      const extracted = (data?.text ?? "").trim();
      if (!extracted) {
        toast.error(data?.warning || "Não foi possível extrair texto da imagem", { id: toastId });
        return;
      }

      setText((prev) => (prev ? prev + "\n\n" + extracted : extracted));
      toast.success("Programação extraída da imagem!", { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao ler imagem";
      console.error("Image read error:", err);
      toast.error(msg, {
        id: toastId,
        action: {
          label: "Tentar novamente",
          onClick: () => handleReadImage(file),
        },
      });
    } finally {
      setReadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [normalizing, setNormalizing] = useState(false);
  const handleNormalizeWithAI = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Cole um texto primeiro");
      return;
    }
    setNormalizing(true);
    const toastId = toast.loading("Normalizando com IA…");
    try {
      const { data, error } = await supabase.functions.invoke("read-schedule-image", {
        body: { text: trimmed },
      });
      const friendly =
        (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) ||
        (error && (error as { message?: string }).message) ||
        null;
      if (error || (data && typeof data === "object" && "error" in data)) {
        throw new Error(friendly || "Edge function retornou erro");
      }
      const formatted = (data?.text ?? "").trim();
      if (!formatted) {
        toast.error(data?.warning || "A IA não retornou texto", { id: toastId });
        return;
      }
      setText(formatted);
      toast.success("Texto normalizado! Clique em Processar.", { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao normalizar";
      console.error("Normalize error:", err);
      toast.error(msg, {
        id: toastId,
        action: { label: "Tentar novamente", onClick: () => handleNormalizeWithAI() },
      });
    } finally {
      setNormalizing(false);
    }
  };

  // Live preview counter — debounced parse to show "X jogos detectados" as user types/pastes
  const [liveCount, setLiveCount] = useState(0);
  useEffect(() => {
    if (!text.trim()) { setLiveCount(0); return; }
    const t = setTimeout(() => {
      try {
        const games = parseScheduleText(text, selectedDate, { autoBumpMidnight });
        setLiveCount(games.length);
      } catch { setLiveCount(0); }
    }, 400);
    return () => clearTimeout(t);
  }, [text, selectedDate, autoBumpMidnight]);

  const isDateInPast = (dateStr: string): boolean => {
    const midnight = midnightInSaoPaulo(dateStr);
    return midnight.getTime() <= Date.now();
  };

  const getScheduleLabel = (): { text: string; isPast: boolean } => {
    const [, m, d] = selectedDate.split("-");
    const past = isDateInPast(selectedDate);
    return {
      text: past
        ? "⚠️ Data no passado — será publicado imediatamente"
        : `Ativa em ${d}/${m} às 00:00`,
      isPast: past,
    };
  };

  const buildInsertPayload = (selected: ParsedGame[]) => {
    return selected.map(({ selected: _, sport_type: parsedSport, dateBumped: _bump, ...g }) => {
      let publishAt: string | null = null;
      let active = true;

      if (scheduleMidnight) {
        const midnight = midnightInSaoPaulo(g.date);
        if (midnight.getTime() > Date.now()) {
          publishAt = midnight.toISOString();
          active = false;
        }
      }

      const finalSportType = parsedSport || detectSportType(g.competition, `${g.home_team} ${g.away_team}`);

      // Second barrier: sanitize all string fields before insert
      return {
        ...g,
        home_team: sanitizeStr(g.home_team),
        away_team: sanitizeStr(g.away_team),
        competition: sanitizeStr(g.competition),
        competition_detail: sanitizeStr(g.competition_detail),
        channels: g.channels.map(sanitizeStr),
        active,
        archived: false,
        is_live: false,
        status_short: "NS",
        elapsed_minutes: null,
        publish_at: publishAt,
        sport_type: finalSportType,
      };
    });
  };

  const [midnightConfirmOpen, setMidnightConfirmOpen] = useState(false);
  const [pendingPublishAction, setPendingPublishAction] = useState<"publish" | "republish" | null>(null);

  const midnightGamesCount = parsed.filter((g) => g.selected && g.game_time < "05:00" && !g.dateBumped).length;
  const bumpedGamesCount = parsed.filter((g) => g.selected && g.dateBumped).length;

  const executePublish = async () => {
    const selected = parsed.filter((g) => g.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um jogo");
      return;
    }

    // Warn if scheduling is ON but all dates are in the past
    if (scheduleMidnight) {
      const allPast = [...new Set(selected.map((g) => g.date))].every(isDateInPast);
      if (allPast) {
        toast.warning("Agendamento ativo, mas todas as datas são passadas — publicando imediatamente");
      }
    }

    try {
      const toInsert = buildInsertPayload(selected);
      const result = await insertGames.mutateAsync(toInsert);
      const { inserted, skipped } = result;

      if (inserted === 0 && skipped > 0) {
        toast.warning(`Todos os ${skipped} jogos já existem no banco`);
      } else if (skipped > 0) {
        toast.success(`${inserted} jogo(s) publicado(s), ${skipped} duplicata(s) ignorada(s)`);
      } else {
        const hasScheduled = toInsert.some((g) => g.publish_at);
        const msg = hasScheduled
          ? `${inserted} jogo(s) agendado(s) para meia-noite!`
          : `${inserted} jogo(s) publicado(s)!`;
        toast.success(msg, {
          action: {
            label: "Ver no público",
            onClick: () => window.open("/", "_blank"),
          },
        });
      }

      setParsed([]);
      setText("");
    } catch (err: any) {
      const code = err?.code || err?.cause?.code;
      if (code === "23505") {
        toast.error("Jogos duplicados detectados (mesma data/horário/times). Nada foi publicado.");
      } else {
        toast.error(err.message || "Erro ao publicar");
      }
    }
  };

  const handlePublish = () => {
    if (insertGames.isPending) return; // anti double-click guard
    const selected = parsed.filter((g) => g.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um jogo");
      return;
    }
    if (midnightGamesCount > 0 || bumpedGamesCount > 0) {
      setPendingPublishAction("publish");
      setMidnightConfirmOpen(true);
      return;
    }
    executePublish();
  };

  const executeRepublish = async () => {
    const selected = parsed.filter((g) => g.selected);
    if (selected.length === 0) return;
    try {
      const dates = [...new Set(selected.map((g) => g.date))];
      for (const d of dates) {
        await deleteByDate.mutateAsync(d);
      }
      const toInsert = buildInsertPayload(selected);
      await insertGames.mutateAsync(toInsert);
      toast.success(`Republicado! ${selected.length} jogos.`);
      setParsed([]);
      setText("");
    } catch (err: any) {
      const code = err?.code || err?.cause?.code;
      if (code === "23505") {
        toast.error("Jogos duplicados detectados (mesma data/horário/times). Republicação abortada.");
      } else {
        toast.error(err.message || "Erro ao republicar");
      }
    }
  };

  const handleRepublish = () => {
    if (insertGames.isPending || deleteByDate.isPending) return; // anti double-click guard
    const selected = parsed.filter((g) => g.selected);
    if (selected.length === 0) return;
    if (midnightGamesCount > 0 || bumpedGamesCount > 0) {
      setPendingPublishAction("republish");
      setMidnightConfirmOpen(true);
      return;
    }
    executeRepublish();
  };

  const toggleGame = (idx: number) => {
    setParsed((prev) => prev.map((g, i) => (i === idx ? { ...g, selected: !g.selected } : g)));
  };

  const toggleAll = (selectAll: boolean) => {
    setParsed((prev) => prev.map((g) => ({ ...g, selected: selectAll })));
  };

  const updateGame = (idx: number, updates: Partial<ParsedGame>) => {
    setParsed((prev) => prev.map((g, i) => (i === idx ? { ...g, ...updates } : g)));
  };

  const selectedCount = parsed.filter((g) => g.selected).length;

  // Group games by date for preview
  const gamesByDate = parsed.reduce<Record<string, { games: ParsedGame[]; indices: number[] }>>((acc, game, idx) => {
    if (!acc[game.date]) acc[game.date] = { games: [], indices: [] };
    acc[game.date].games.push(game);
    acc[game.date].indices.push(idx);
    return acc;
  }, {});

  const sortedDates = Object.keys(gamesByDate).sort();

  // Count total warnings
  const totalWarnings = parsed.reduce((acc, g) => acc + getGameWarnings(g).length, 0);

  return (
    <div className="space-y-5">
      {/* STEP 1 — Configuration */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold">1</span>
            <h3 className="text-sm font-bold text-foreground">Configuração</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Data dos jogos</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs h-10 glass-panel border-white/[0.1]"
              />
              <p className="text-[9px] text-muted-foreground">Usado quando o texto não contém 📅 com data</p>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl glass-panel border ${
              scheduleMidnight && getScheduleLabel().isPast
                ? "border-destructive/30 bg-destructive/[0.05]"
                : "border-amber-500/20 bg-amber-500/[0.03]"
            }`}>
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground">Agendar publicação</p>
                {scheduleMidnight ? (
                  <p className={`text-[9px] leading-tight font-medium ${
                    getScheduleLabel().isPast ? "text-destructive" : "text-emerald-400"
                  }`}>
                    {getScheduleLabel().text}
                  </p>
                ) : (
                  <p className="text-[9px] text-muted-foreground leading-tight">Publica à meia-noite da data dos jogos</p>
                )}
              </div>
              <Switch checked={scheduleMidnight} onCheckedChange={setScheduleMidnight} />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl glass-panel border border-white/[0.08]">
              <AlertTriangle className={`h-4 w-4 shrink-0 ${autoBumpMidnight ? "text-amber-400" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground">
                  Madrugada conta para o dia anterior
                </p>
                <p className="text-[9px] text-muted-foreground leading-tight">
                  {autoBumpMidnight
                    ? "Jogos < 05:00 sob um cabeçalho 📅 serão movidos para o dia seguinte (+1)."
                    : "OFF (recomendado): a data do cabeçalho 📅 é usada exatamente como está."}
                </p>
              </div>
              <Switch
                checked={autoBumpMidnight}
                onCheckedChange={(v) => {
                  setAutoBumpMidnight(v);
                  try { localStorage.setItem("admin_auto_bump_midnight", String(v)); } catch {}
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2 — Text input */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold">2</span>
            <h3 className="text-sm font-bold text-foreground">Texto da Programação</h3>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (!items) return;
              for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith("image/")) {
                  e.preventDefault();
                  const file = items[i].getAsFile();
                  if (file) {
                    toast.info("📷 Imagem detectada, processando...");
                    handleReadImage(file);
                  }
                  return;
                }
              }
            }}
            placeholder={PLACEHOLDER}
            className="min-h-[200px] bg-secondary/30 border-border/30 text-sm font-mono"
            disabled={readingImage}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground/60">💡 Cole uma imagem (Ctrl+V) ou texto do WhatsApp para extrair a programação</p>
            {liveCount > 0 && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] shrink-0">
                {liveCount} jogo{liveCount !== 1 ? "s" : ""} detectado{liveCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleProcess}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 min-h-[44px]"
            >
              <FileText className="h-4 w-4 mr-2" />
              Processar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText("");
                setParsed([]);
                setEditingIdx(null);
                toast.info("Campos limpos");
              }}
              className="text-muted-foreground min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button
              variant="outline"
              onClick={handleFillExample}
              className="text-muted-foreground min-h-[44px]"
            >
              <Clipboard className="h-4 w-4 mr-2" />
              Exemplo
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={readingImage}
              className="text-muted-foreground min-h-[44px]"
            >
              {readingImage ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {readingImage ? "Lendo..." : "📷 Ler Imagem"}
            </Button>
            <Button
              variant="outline"
              onClick={handleNormalizeWithAI}
              disabled={normalizing || !text.trim()}
              className="text-muted-foreground min-h-[44px]"
              title="Reformata qualquer texto livre no padrão canônico usando IA"
            >
              {normalizing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              {normalizing ? "Normalizando..." : "Normalizar com IA"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReadImage(file);
              }}
            />
          </div>
        </div>
      </div>

      {/* STEP 3 — Preview (only after processing) */}
      {parsed.length > 0 && (
        <div ref={previewRef} className="glass-panel rounded-2xl overflow-hidden">
          {/* Summary bar */}
          <div className="p-4 border-b border-white/[0.06] bg-secondary/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold">3</span>
              <h3 className="text-sm font-bold text-foreground">Preview</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Badge variant="outline" className="border-white/[0.1] text-foreground font-semibold">
                {parsed.length} jogos
              </Badge>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-semibold">
                {selectedCount} selecionados
              </Badge>
              {totalWarnings > 0 && (
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20">
                  <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                  {totalWarnings} alerta{totalWarnings !== 1 ? "s" : ""}
                </Badge>
              )}
              {scheduleMidnight && (
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  Agendado 00:00 ({sortedDates.map(d => {
                    const [, m, day] = d.split("-");
                    return `${day}/${m}`;
                  }).join(", ")})
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleAll(true)}
                  className="h-7 text-[10px] text-muted-foreground px-2"
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleAll(false)}
                  className="h-7 text-[10px] text-muted-foreground px-2"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Nenhum
                </Button>
              </div>
            </div>
          </div>

          {/* Games grouped by date */}
          <div className="p-4 sm:p-5 space-y-5">
            {sortedDates.map((date) => {
              const group = gamesByDate[date];
              const dateSelectedCount = group.games.filter((g) => g.selected).length;
              return (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-foreground">
                      📅 {formatDatePt(date)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      — {group.games.length} jogo{group.games.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      ({dateSelectedCount} selecionados)
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.games.map((game, localIdx) => {
                      const globalIdx = group.indices[localIdx];
                      const warnings = getGameWarnings(game);
                      const resolvedSport = game.sport_type || detectSportType(game.competition, `${game.home_team} ${game.away_team}`);
                      const sportEmoji = SPORT_EMOJI[resolvedSport] || '⚽';
                      return (
                        <div
                          key={globalIdx}
                          className={`rounded-xl glass-panel p-3 space-y-2 transition-all duration-200 ${
                            !game.selected ? "opacity-40" : ""
                          } ${warnings.length > 0 ? "ring-1 ring-amber-500/30" : ""}`}
                        >
                          {editingIdx === globalIdx ? (
                            <EditGameForm
                              game={game}
                              onSave={(updates) => { updateGame(globalIdx, updates); setEditingIdx(null); }}
                              onCancel={() => setEditingIdx(null)}
                            />
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">
                                  {game.away_team
                                    ? `${game.home_team} x ${game.away_team}`
                                    : game.home_team}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  ⏰ {game.game_time} • {game.competition}
                                  {game.competition_detail ? ` · ${game.competition_detail}` : ""}
                                </p>
                                <p className="text-[11px] text-muted-foreground/60">
                                  📺 {game.channels.join(", ") || "—"}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <select
                                    value={resolvedSport}
                                    onChange={(e) => updateGame(globalIdx, { sport_type: e.target.value as SportType })}
                                    className="text-[9px] py-0.5 px-1.5 rounded-md border border-white/[0.1] bg-secondary/50 text-foreground cursor-pointer appearance-none pr-4"
                                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center" }}
                                    title="Clique para corrigir o esporte"
                                  >
                                    {(Object.keys(SPORT_EMOJI) as SportType[]).map((st) => (
                                      <option key={st} value={st}>
                                        {SPORT_EMOJI[st]} {SPORT_LABEL[st]}
                                      </option>
                                    ))}
                                  </select>
                                  {game.is_womens && (
                                    <span className="text-[10px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-semibold">
                                      Feminino
                                    </span>
                                  )}
                                  {existingKeys.has(gameKey(game)) && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold">
                                      <Copy className="h-2.5 w-2.5" />
                                      Duplicado
                                    </span>
                                  )}
                                  {warnings.map((w, wi) => (
                                    <span key={wi} className="inline-flex items-center gap-0.5 text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                      <AlertTriangle className="h-2.5 w-2.5" />
                                      {w}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => setEditingIdx(globalIdx)}
                                  className="p-1 rounded hover:bg-white/[0.06] text-muted-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <Switch
                                  checked={game.selected}
                                  onCheckedChange={() => toggleGame(globalIdx)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky action bar */}
          <div className="p-4 border-t border-white/[0.06] bg-background/80 backdrop-blur-sm sticky bottom-0">
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={insertGames.isPending || selectedCount === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8"
                  >
                    {insertGames.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {scheduleMidnight && !getScheduleLabel().isPast
                      ? `Agendar ${selectedCount}`
                      : `Publicar ${selectedCount}`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-panel border-white/[0.08]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {scheduleMidnight && !getScheduleLabel().isPast ? "Confirmar agendamento" : "Confirmar publicação"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {scheduleMidnight && !getScheduleLabel().isPast
                        ? `Agendar ${selectedCount} jogo(s) para meia-noite? Eles ficarão visíveis automaticamente.`
                        : `Publicar ${selectedCount} jogo(s) imediatamente? Eles ficarão visíveis agora.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePublish} className="bg-emerald-600 hover:bg-emerald-700">
                      {scheduleMidnight && !getScheduleLabel().isPast ? "Agendar" : "Publicar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                disabled={selectedCount === 0}
                onClick={() => {
                  const summary = generateWhatsAppSummary(parsed);
                  navigator.clipboard.writeText(summary).then(() => {
                    toast.success("Resumo copiado!");
                  }).catch(() => {
                    toast.error("Erro ao copiar");
                  });
                }}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Copiar resumo
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={deleteByDate.isPending || selectedCount === 0}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    Limpar e Republicar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-panel border-white/[0.08]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar republicação</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso vai <strong>apagar todos os jogos existentes</strong> das datas selecionadas e publicar {selectedCount} novo(s). Essa ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRepublish} className="bg-amber-600 hover:bg-amber-700">
                      Limpar e Republicar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}

      {/* Midnight time confirmation dialog */}
      <AlertDialog open={midnightConfirmOpen} onOpenChange={setMidnightConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Jogos com horário 00:00
            </AlertDialogTitle>
            <AlertDialogDescription>
              {midnightGamesCount > 0 && (
                <>{midnightGamesCount} jogo(s) selecionado(s) com horário antes das <strong>05:00</strong> sem ajuste automático de data.
                Jogos de madrugada podem aparecer como "Ao Vivo" no dia errado.
                <br /><br /></>
              )}
              {bumpedGamesCount > 0 && (
                <>{bumpedGamesCount} jogo(s) tiveram a data avançada automaticamente (+1 dia) por serem de madrugada.
                <br /><br /></>
              )}
              <strong>Verifique as datas no preview</strong> antes de confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPublishAction(null)}>Voltar e corrigir</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setMidnightConfirmOpen(false);
                if (pendingPublishAction === "republish") executeRepublish();
                else executePublish();
                setPendingPublishAction(null);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Confirmar e publicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const EditGameForm = ({
  game,
  onSave,
  onCancel,
}: {
  game: ParsedGame;
  onSave: (updates: Partial<ParsedGame>) => void;
  onCancel: () => void;
}) => {
  const [home, setHome] = useState(game.home_team);
  const [away, setAway] = useState(game.away_team);
  const [comp, setComp] = useState(game.competition);
  const [detail, setDetail] = useState(game.competition_detail);
  const [time, setTime] = useState(game.game_time);
  const [channels, setChannels] = useState(game.channels.join(", "));
  const [sportType, setSportType] = useState<SportType>(
    game.sport_type || detectSportType(game.competition, `${game.home_team} ${game.away_team}`)
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input value={home} onChange={(e) => setHome(e.target.value)} placeholder="Time casa / Evento" className="h-8 text-xs" />
        <Input value={away} onChange={(e) => setAway(e.target.value)} placeholder="Time visitante (vazio = evento)" className="h-8 text-xs" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input value={comp} onChange={(e) => setComp(e.target.value)} placeholder="Competição" className="h-8 text-xs" />
        <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:MM" className="h-8 text-xs" />
        <select
          value={sportType}
          onChange={(e) => setSportType(e.target.value as SportType)}
          className="h-8 text-xs rounded-md border border-input bg-background px-2"
        >
          {(Object.keys(SPORT_EMOJI) as SportType[]).map((st) => (
            <option key={st} value={st}>{SPORT_EMOJI[st]} {SPORT_LABEL[st]}</option>
          ))}
        </select>
      </div>
      <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Fase (ex: oitavas)" className="h-8 text-xs" />
      <Input value={channels} onChange={(e) => setChannels(e.target.value)} placeholder="Canais separados por vírgula" className="h-8 text-xs" />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            onSave({
              home_team: home,
              away_team: away,
              competition: comp,
              competition_detail: detail,
              game_time: time,
              channels: splitChannels(channels),
              sport_type: sportType,
            })
          }
          className="h-7 text-xs bg-emerald-600"
        >
          <Check className="h-3 w-3 mr-1" /> Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">
          <X className="h-3 w-3 mr-1" /> Cancelar
        </Button>
      </div>
    </div>
  );
};
