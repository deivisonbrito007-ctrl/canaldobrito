import { useState, useRef } from "react";
import { detectSportType, SPORT_EMOJI, type SportType } from "@/lib/gameUtils";
import { gameKey } from "@/lib/dedup";
import { getLocalDateString } from "@/lib/gameUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useInsertDailyGames, useDeleteDailyGamesByDate, fetchExistingGameKeys } from "@/hooks/useDailyGames";
import { Loader2, FileText, Trash2, Check, Pencil, X, Clipboard, Clock, CheckSquare, Square, AlertTriangle, Camera, Copy } from "lucide-react";
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
}

const PLACEHOLDER = `📅**Dia 18/03**

Flamengo x Palmeiras
🏆 Brasileirão (oitavas de final) / ⏰ 19h00
📺 Sportv, Premiere

ATP e WTA
🎾 Tênis (Indian Wells) / ⏰ 20h00
📺 ESPN 2

GP da Arábia Saudita
🏎️ Fórmula 1 (Classificação) / ⏰ 13h00
📺 Band, BandSports

UFC 315 (Card Principal)
🥊 MMA / ⏰ 23h00
📺 Combate`;

const COMP_LINE_RE = /(?:🏆|🎾|🏎️|🏎|🥊|🏀|🏐|[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]|\/)/;

/** Map emoji at start of competition line to sport_type */
function detectSportFromEmoji(compLine: string): SportType | null {
  if (/^🎾/.test(compLine)) return 'tennis';
  if (/^(?:🏎️|🏎)/.test(compLine)) return 'f1';
  if (/^🥊/.test(compLine)) return 'mma';
  if (/^🏀/.test(compLine)) return 'basketball';
  if (/^🏐/.test(compLine)) return 'volleyball';
  if (/^🏆/.test(compLine)) return 'football';
  return null;
}

function isCompetitionLine(line: string): boolean {
  return COMP_LINE_RE.test(line);
}

function parseCompAndTime(compLine: string) {
  let competition = "";
  let competition_detail = "";
  let game_time = "00:00";

  const cleaned = compLine.replace(/[🏆🎾🏎🏎️🥊🏀🏐]/g, "");
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

/** Strip markdown bold, residual emojis, double spaces, placeholder chars */
function cleanText(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")  // **bold** → bold
    .replace(/\*/g, "")                  // stray asterisks
    .replace(/[🏆🎾🏎️🏎🥊🏀🏐📺⏰]/g, "") // residual sport/channel emojis
    .replace(/\s{2,}/g, " ")             // double spaces
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

export function parseScheduleText(text: string, fallbackDate: string): ParsedGame[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const games: ParsedGame[] = [];
  let currentDate = fallbackDate;

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
      i++;
      continue;
    }

    const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
    const channelLine = i + 2 < lines.length ? lines[i + 2] : "";

    // FORMAT A: line has " x " → two teams
    if (/\sx\s/i.test(line)) {
      const teamParts = line.split(/\sx\s/i).map((t) => t.trim());
      const home_team = teamParts[0] || "";
      const away_team = teamParts[1] || "";
      const is_womens = /\(F\)/i.test(line);

      const { competition, competition_detail, game_time } = isCompetitionLine(nextLine)
        ? parseCompAndTime(nextLine)
        : { competition: "", competition_detail: "", game_time: "00:00" };

      const sport_type = isCompetitionLine(nextLine) ? detectSportFromEmoji(nextLine) : null;

      let channels: string[] = [];
      if (channelLine.includes("📺")) {
        const afterTv = channelLine.split("📺").pop() || "";
        channels = afterTv.split(",").flatMap((part) => part.split(/ e (?=[A-Z])/)).map((c) => c.trim()).filter(Boolean);
      }

      games.push(cleanupGame({
        home_team, away_team, competition, competition_detail, game_time,
        channels, is_womens, date: currentDate, selected: true,
        sport_type: sport_type || undefined,
      }));
      i += 3;
      continue;
    }

    // FORMAT B: line has NO " x " but next line is a competition line → event/individual sport
    if (isCompetitionLine(nextLine)) {
      const home_team = line;
      const { competition, competition_detail, game_time } = parseCompAndTime(nextLine);
      const sport_type = detectSportFromEmoji(nextLine);

      let channels: string[] = [];
      if (channelLine.includes("📺")) {
        const afterTv = channelLine.split("📺").pop() || "";
        channels = afterTv.split(",").flatMap((part) => part.split(/ e (?=[A-Z])/)).map((c) => c.trim()).filter(Boolean);
      }

      games.push(cleanupGame({
        home_team, away_team: "", competition, competition_detail, game_time,
        channels, is_womens: false, date: currentDate, selected: true,
        sport_type: sport_type || undefined,
      }));
      i += 3;
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
  if (game.game_time === "00:00") warnings.push("Horário não detectado");
  if (!game.channels.length) warnings.push("Sem canal");
  if (!game.competition) warnings.push("Sem competição");
  return warnings;
}

export const ProgramacaoTexto = () => {
  const today = getLocalDateString();
  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [parsed, setParsed] = useState<ParsedGame[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [scheduleMidnight, setScheduleMidnight] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
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
    const games = parseScheduleText(text, selectedDate);
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

    // Auto-deselect duplicates
    let dupCount = 0;
    const markedGames = games.map((g) => {
      const isDup = allKeys.has(gameKey(g));
      if (isDup) dupCount++;
      return { ...g, selected: isDup ? false : g.selected };
    });

    setParsed(markedGames);
    if (dupCount > 0) {
      toast.warning(`${dupCount} jogo(s) já existente(s) — desmarcados automaticamente`);
    } else {
      toast.success(`${games.length} jogo(s) detectado(s)!`);
    }
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleFillExample = () => {
    setText(PLACEHOLDER);
    toast.info("Texto de exemplo preenchido");
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
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("read-schedule-image", {
        body: { image: base64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const extracted = data?.text?.trim();
      if (!extracted) {
        toast.error("Não foi possível extrair texto da imagem");
        return;
      }

      setText((prev) => (prev ? prev + "\n\n" + extracted : extracted));
      toast.success("Programação extraída da imagem!");
    } catch (err: any) {
      console.error("Image read error:", err);
      toast.error(err.message || "Erro ao ler imagem");
    } finally {
      setReadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isDateInPast = (dateStr: string): boolean => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const midnight = new Date(y, m - 1, d, 0, 0, 0);
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
    return selected.map(({ selected: _, sport_type: parsedSport, ...g }) => {
      let publishAt: string | null = null;
      let active = true;

      if (scheduleMidnight) {
        const [y, m, d] = g.date.split("-").map(Number);
        const midnight = new Date(y, m - 1, d, 0, 0, 0);
        if (midnight.getTime() > Date.now()) {
          publishAt = midnight.toISOString();
          active = false;
        }
      }

      // Use emoji-detected sport_type if available, otherwise fall back to detectSportType
      const finalSportType = parsedSport || detectSportType(g.competition);

      return {
        ...g,
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

  const handlePublish = async () => {
    const selected = parsed.filter((g) => g.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um jogo");
      return;
    }
    try {
      const toInsert = buildInsertPayload(selected);
      await insertGames.mutateAsync(toInsert);
      toast.success(scheduleMidnight
        ? `${selected.length} jogos agendados para meia-noite!`
        : `${selected.length} jogos publicados!`);
      setParsed([]);
      setText("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao publicar");
    }
  };

  const handleRepublish = async () => {
    if (!confirm("Isso vai apagar todos os jogos do dia e publicar os novos. Continuar?")) return;
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
      toast.error(err.message || "Erro ao republicar");
    }
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
          <p className="text-[10px] text-muted-foreground/60">💡 Cole uma imagem (Ctrl+V) ou texto do WhatsApp para extrair a programação</p>

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
                      const resolvedSport = game.sport_type || detectSportType(game.competition);
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
                                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-white/[0.1] text-muted-foreground">
                                    {sportEmoji} {resolvedSport}
                                  </Badge>
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
              <Button
                onClick={handlePublish}
                disabled={insertGames.isPending || selectedCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8"
              >
                {insertGames.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {scheduleMidnight ? `Agendar ${selectedCount}` : `Publicar ${selectedCount}`}
              </Button>
              <Button
                onClick={handleRepublish}
                variant="outline"
                disabled={deleteByDate.isPending || selectedCount === 0}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                Limpar e Republicar
              </Button>
            </div>
          </div>
        </div>
      )}
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

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input value={home} onChange={(e) => setHome(e.target.value)} placeholder="Time casa / Evento" className="h-8 text-xs" />
        <Input value={away} onChange={(e) => setAway(e.target.value)} placeholder="Time visitante (vazio = evento)" className="h-8 text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={comp} onChange={(e) => setComp(e.target.value)} placeholder="Competição" className="h-8 text-xs" />
        <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:MM" className="h-8 text-xs" />
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
              channels: channels.split(",").map((c) => c.trim()).filter(Boolean),
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
