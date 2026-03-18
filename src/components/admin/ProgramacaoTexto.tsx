import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useInsertDailyGames, useDeleteDailyGamesByDate } from "@/hooks/useDailyGames";
import { Loader2, FileText, Trash2, Check, Pencil, X, Clipboard } from "lucide-react";
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
}

const PLACEHOLDER = `📅**Dia 18/03**

Flamengo x Palmeiras
🏆 Brasileirão (oitavas de final) / ⏰ 19h00
📺 Sportv, Premiere

Barcelona x Real Madrid
🏆 La Liga / ⏰ 16h30
📺 ESPN, Star+`;

function parseScheduleText(text: string, fallbackDate: string): ParsedGame[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const games: ParsedGame[] = [];
  let currentDate = fallbackDate;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check for date line — accept many emoji variants and "Dia dd/mm" patterns
    const dateMatch = line.match(/(?:📅|📺|🗓|🗓️|\*\*Dia|Dia)\s*\**\s*(?:Dia\s*)?\**\s*(\d{1,2})\/(\d{1,2})/i);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, "0");
      const month = dateMatch[2].padStart(2, "0");
      const year = new Date().getFullYear();
      currentDate = `${year}-${month}-${day}`;
      i++;
      continue;
    }

    // Look for team line with " x " or " X "
    if (!/\sx\s/i.test(line)) {
      i++;
      continue;
    }

    const teamLine = line;
    const compLine = i + 1 < lines.length ? lines[i + 1] : "";
    const channelLine = i + 2 < lines.length ? lines[i + 2] : "";

    // Parse teams (case-insensitive x)
    const teamParts = teamLine.split(/\sx\s/i).map((t) => t.trim());
    const home_team = teamParts[0] || "";
    const away_team = teamParts[1] || "";
    const is_womens = /\(F\)/i.test(teamLine);

    // Parse competition and time — flexible emoji matching
    let competition = "";
    let competition_detail = "";
    let game_time = "00:00";

    // Accept line with trophy emoji OR time emoji OR slash-separated format
    if (compLine.includes("🏆") || /[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]/.test(compLine) || compLine.includes("/")) {
      // Extract competition — after 🏆 or start of line
      const afterTrophy = compLine.includes("🏆") ? (compLine.split("🏆").pop() || "") : compLine;
      const beforeSlash = afterTrophy.split("/")[0].trim();
      
      // Check for detail in parentheses
      const detailMatch = beforeSlash.match(/\(([^)]+)\)/);
      if (detailMatch) {
        competition_detail = detailMatch[1];
        competition = beforeSlash.replace(/\([^)]+\)/, "").trim();
      } else {
        competition = beforeSlash;
      }
      // Clean leftover emojis from competition name
      competition = competition.replace(/[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛📺🏆]/g, "").trim();

      // Extract time — supports "14h", "14h30", "14:30", or just digits after time emoji
      const timeMatch = compLine.match(/(?:[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]\s*)?(\d{1,2})[hH:](\d{2})/);
      if (timeMatch) {
        const hours = timeMatch[1].padStart(2, "0");
        const minutes = timeMatch[2] || "00";
        game_time = `${hours}:${minutes}`;
      } else {
        // Try "14h" without minutes
        const timeMatchShort = compLine.match(/(?:[⏰🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛]\s*)?(\d{1,2})[hH]\b/);
        if (timeMatchShort) {
          game_time = `${timeMatchShort[1].padStart(2, "0")}:00`;
        }
      }
    }

    // Parse channels — handles ", " and " e " separators
    let channels: string[] = [];
    if (channelLine.includes("📺")) {
      const afterTv = channelLine.split("📺").pop() || "";
      channels = afterTv
        .split(",")
        .flatMap((part) => part.split(/ e (?=[A-Z])/))
        .map((c) => c.trim())
        .filter(Boolean);
    }

    games.push({
      home_team,
      away_team,
      competition,
      competition_detail,
      game_time,
      channels,
      is_womens,
      date: currentDate,
      selected: true,
    });

    i += 3;
  }

  return games;
}

export const ProgramacaoTexto = () => {
  const today = new Date().toISOString().split("T")[0];
  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [parsed, setParsed] = useState<ParsedGame[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const insertGames = useInsertDailyGames();
  const deleteByDate = useDeleteDailyGamesByDate();

  const handleProcess = () => {
    if (!text.trim()) {
      toast.error("Cole o texto da programação primeiro");
      return;
    }
    const games = parseScheduleText(text, selectedDate);
    if (games.length === 0) {
      toast.error("Nenhum jogo detectado. Verifique se o texto contém 'Time A x Time B'.");
      return;
    }
    setParsed(games);
    toast.success(`${games.length} jogo(s) detectado(s)!`);
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleFillExample = () => {
    setText(PLACEHOLDER);
    toast.info("Texto de exemplo preenchido");
  };

  const handlePublish = async () => {
    const selected = parsed.filter((g) => g.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um jogo");
      return;
    }
    try {
      const toInsert = selected.map(({ selected: _, ...g }) => ({
        ...g,
        active: true,
        is_live: false,
        status_short: "NS",
        elapsed_minutes: null,
      }));
      await insertGames.mutateAsync(toInsert);
      toast.success(`${selected.length} jogos publicados!`);
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
      // Get unique dates
      const dates = [...new Set(selected.map((g) => g.date))];
      for (const d of dates) {
        await deleteByDate.mutateAsync(d);
      }
      const toInsert = selected.map(({ selected: _, ...g }) => ({
        ...g,
        active: true,
        is_live: false,
      }));
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

  const updateGame = (idx: number, updates: Partial<ParsedGame>) => {
    setParsed((prev) => prev.map((g, i) => (i === idx ? { ...g, ...updates } : g)));
  };

  const selectedCount = parsed.filter((g) => g.selected).length;

  return (
    <div className="space-y-5">
      {/* Input Section */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-base font-bold text-foreground">Programação por Texto</h3>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Data padrão:</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto text-xs h-9 glass-panel border-white/[0.1]"
          />
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          className="min-h-[240px] bg-secondary/30 border-border/30 text-sm font-mono"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleProcess}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 min-h-[44px]"
          >
            <FileText className="h-4 w-4 mr-2" />
            Processar Texto
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
        </div>
      </div>

      {/* Preview Section */}
      {parsed.length > 0 && (
        <div ref={previewRef} className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              Preview — <span className="text-emerald-400">{selectedCount}</span> de {parsed.length} jogos selecionados
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parsed.map((game, idx) => (
              <div
                key={idx}
                className={`rounded-xl glass-panel p-3 space-y-2 transition-all duration-200 ${
                  !game.selected ? "opacity-40" : ""
                }`}
              >
                {editingIdx === idx ? (
                  <EditGameForm
                    game={game}
                    onSave={(updates) => { updateGame(idx, updates); setEditingIdx(null); }}
                    onCancel={() => setEditingIdx(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {game.home_team} x {game.away_team}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          ⏰ {game.game_time} • {game.competition}
                          {game.competition_detail ? ` · ${game.competition_detail}` : ""}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60">
                          📺 {game.channels.join(", ") || "—"}
                        </p>
                        {game.is_womens && (
                          <span className="text-[10px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-semibold">
                            Feminino
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingIdx(idx)}
                          className="p-1 rounded hover:bg-white/[0.06] text-muted-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <Switch
                          checked={game.selected}
                          onCheckedChange={() => toggleGame(idx)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
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
              Publicar {selectedCount} Jogos
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
        <Input value={home} onChange={(e) => setHome(e.target.value)} placeholder="Time casa" className="h-8 text-xs" />
        <Input value={away} onChange={(e) => setAway(e.target.value)} placeholder="Time visitante" className="h-8 text-xs" />
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
