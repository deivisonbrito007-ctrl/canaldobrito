import { useState, useMemo } from "react";
import { useAllDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useSiteUrl } from "@/hooks/useSiteUrl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Copy, Check, MessageCircle, Link2, FileText, CopyPlus, AlertTriangle,
  CheckCircle2, Loader2, Tv,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { SPORT_EMOJI, SPORT_LABEL, type SportType, getLocalDateString, midnightInSaoPaulo, detectSportType } from "@/lib/gameUtils";
import { buildDeepLink } from "@/lib/utils";

type DeepTab = "live" | "schedule" | "highlights" | "novidades" | "home";

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1 gap-1.5 text-xs min-h-[40px]">
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : label}
    </Button>
  );
};

const MessageCard = ({ template, siteUrl }: { template: { id: string; label: string; text: string; tab?: DeepTab }; siteUrl: string }) => {
  const link = buildDeepLink(siteUrl, template.tab);
  const finalText = template.text.replace("LINK_PLACEHOLDER", link);

  const handleSendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(finalText)}`, "_blank");
  };

  return (
    <div className="glass-panel rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-foreground">{template.label}</span>
        {template.tab && template.tab !== "home" && (
          <span className="text-[9px] font-mono text-muted-foreground/70 bg-background/50 rounded px-1.5 py-0.5">
            ?tab={template.tab}
          </span>
        )}
      </div>
      <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 rounded-lg p-3 max-h-[140px] overflow-y-auto">
        {finalText}
      </pre>
      <div className="flex gap-2">
        <CopyButton text={finalText} label="Copiar" />
        <Button size="sm" onClick={handleSendWhatsApp} className="flex-1 gap-1.5 text-xs bg-[hsl(142,70%,38%)] hover:bg-[hsl(142,70%,32%)] text-white min-h-[40px]">
          <MessageCircle className="h-3.5 w-3.5" />
          Enviar
        </Button>
      </div>
    </div>
  );
};

/** Build WhatsApp-ready text for a list of games on a given date */
function buildDayText(games: DailyGame[], dateStr: string, siteUrl: string): string | null {
  const filtered = games.filter(g => !g.archived);
  if (!filtered || filtered.length === 0) return null;

  const spDate = midnightInSaoPaulo(dateStr);
  const dayLabel = format(spDate, "EEEE", { locale: ptBR });
  const [, m, d] = dateStr.split("-");

  const lines: string[] = [];
  lines.push(`📅 *${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}, ${d}/${m}*`);
  lines.push("");

  const bySport: Record<string, DailyGame[]> = {};
  filtered.forEach((g) => {
    const saved = g.sport_type || "football";
    const detected = detectSportType(`${g.competition} ${g.home_team} ${g.away_team}`);
    const key = detected !== "football" ? detected : saved;
    if (!bySport[key]) bySport[key] = [];
    bySport[key].push(g);
  });

  const sportOrder: string[] = ['football', 'basketball', 'volleyball', 'tennis', 'hockey', 'baseball', 'mma', 'f1'];
  const sortedSports = Object.keys(bySport).sort((a, b) => {
    const ia = sportOrder.indexOf(a);
    const ib = sportOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  for (const sport of sortedSports) {
    const sportGames = bySport[sport];
    const emoji = SPORT_EMOJI[sport as SportType] ?? "⚽";
    const label = SPORT_LABEL[sport as SportType] ?? sport.toUpperCase();
    lines.push(`${emoji} *${label.toUpperCase()}*`);

    const sorted = [...sportGames].sort((a, b) => a.game_time.localeCompare(b.game_time));
    for (const g of sorted) {
      const time = g.game_time.slice(0, 5);
      const teams = g.away_team ? `${g.home_team} x ${g.away_team}` : g.home_team;
      lines.push(`${time} — ${teams}`);

      const details: string[] = [];
      if (g.competition) {
        details.push(g.competition_detail ? `🏆 ${g.competition} · ${g.competition_detail}` : `🏆 ${g.competition}`);
      }
      if (g.channels && g.channels.length > 0) details.push(`📺 ${g.channels.join(", ")}`);
      if (details.length > 0) lines.push(details.join(" | "));
      lines.push("");
    }
  }

  lines.push(`👉 ${buildDeepLink(siteUrl, "schedule")}`);
  return lines.join("\n").trim();
}

/** Validation results for a day's games */
interface DayValidation {
  total: number;
  active: number;
  noChannel: number;
  zeroTime: number;
  duplicates: number;
  duplicateKeys: string[];
}

function validateDay(games: DailyGame[]): DayValidation {
  const active = games.filter((g) => !g.archived);
  const noChannel = active.filter((g) => !g.channels || g.channels.length === 0).length;
  const zeroTime = active.filter((g) => !g.game_time || g.game_time.startsWith("00:00")).length;
  const seen = new Map<string, number>();
  for (const g of active) {
    const k = `${g.home_team}|${g.away_team}|${g.game_time}`;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  const duplicateKeys = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
  return {
    total: games.length,
    active: active.length,
    noChannel,
    zeroTime,
    duplicates: duplicateKeys.length,
    duplicateKeys,
  };
}

/** Side-by-side day card with preview + validation */
const DayPreviewCard = ({
  title,
  dateStr,
  games,
  text,
  validation,
}: {
  title: string;
  dateStr: string;
  games: DailyGame[] | undefined;
  text: string | null;
  validation: DayValidation;
}) => {
  const [, m, d] = dateStr.split("-");
  const hasIssues = validation.noChannel > 0 || validation.zeroTime > 0 || validation.duplicates > 0;
  const allOk = validation.active > 0 && !hasIssues;

  return (
    <div className="glass-panel rounded-xl p-4 space-y-3 flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{d}/{m} · {validation.active} jogo(s)</p>
        </div>
        {validation.active > 0 && (
          allOk
            ? <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Sem problemas" />
            : <AlertTriangle className="h-4 w-4 text-amber-400" aria-label="Verificar avisos" />
        )}
      </div>

      {validation.active > 0 && (
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {validation.noChannel > 0 && (
            <span className="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200">
              <Tv className="inline h-3 w-3 mr-1" />{validation.noChannel} sem canal
            </span>
          )}
          {validation.zeroTime > 0 && (
            <span className="px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-200">
              {validation.zeroTime} com horário 00:00
            </span>
          )}
          {validation.duplicates > 0 && (
            <span className="px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-200">
              {validation.duplicates} duplicado(s)
            </span>
          )}
          {allOk && (
            <span className="px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
              Tudo certo
            </span>
          )}
        </div>
      )}

      {text ? (
        <pre className="flex-1 text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 rounded-lg p-3 max-h-[320px] overflow-y-auto">
          {text}
        </pre>
      ) : (
        <div className="flex-1 text-xs text-muted-foreground text-center py-8 bg-background/30 rounded-lg">
          Nenhum jogo agendado.
        </div>
      )}

      {text && (
        <div className="flex gap-2">
          <CopyButton text={text} label="Copiar" />
          <Button
            size="sm"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")}
            className="flex-1 gap-1.5 text-xs bg-[hsl(142,70%,38%)] hover:bg-[hsl(142,70%,32%)] text-white min-h-[40px]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Enviar
          </Button>
        </div>
      )}
    </div>
  );
};

/** Hook: clone all manual games from one date to another */
function useDuplicateDay() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const run = async (fromDate: string, toDate: string) => {
    setBusy(true);
    try {
      const { data: src, error: e1 } = await supabase
        .from("daily_games")
        .select("*")
        .eq("date", fromDate)
        .eq("source", "manual")
        .eq("archived", false);
      if (e1) throw e1;
      if (!src || src.length === 0) {
        toast.warning("Nenhum jogo na data de origem.");
        return;
      }

      const { data: existing } = await supabase
        .from("daily_games")
        .select("home_team, away_team, game_time")
        .eq("date", toDate);
      const existingKeys = new Set(
        (existing || []).map((e: any) => `${e.home_team}|${e.away_team}|${e.game_time}`)
      );

      const rows = src
        .map((g: any) => {
          const { id, created_at, ...rest } = g;
          return { ...rest, date: toDate, is_live: false, status_short: "NS", elapsed_minutes: null };
        })
        .filter((g: any) => !existingKeys.has(`${g.home_team}|${g.away_team}|${g.game_time}`));

      if (rows.length === 0) {
        toast.info("Todos os jogos já existem na data de destino.");
        return;
      }

      const { error: e2 } = await supabase.from("daily_games").insert(rows as any);
      if (e2) throw e2;

      toast.success(`${rows.length} jogo(s) duplicado(s) (${src.length - rows.length} já existiam)`);
      qc.invalidateQueries({ queryKey: ["daily_games"] });
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao duplicar");
    } finally {
      setBusy(false);
    }
  };

  return { run, busy };
}

const AdminWhatsApp = () => {
  const { yesterdayStr, todayStr, tomorrowStr, templates } = useMemo(() => {
    const now = new Date();
    const tStr = getLocalDateString(now);
    const spNow = midnightInSaoPaulo(tStr);
    const tomorrowDate = addDays(spNow, 1);
    const yesterdayDate = addDays(spNow, -1);
    const tmStr = getLocalDateString(tomorrowDate);
    const yStr = getLocalDateString(yesterdayDate);
    const fDate = format(now, "dd/MM/yyyy");
    const dName = format(now, "EEEE", { locale: ptBR });

    return {
      yesterdayStr: yStr,
      todayStr: tStr,
      tomorrowStr: tmStr,
      templates: [
        { id: "geral", label: "📺 Geral do Dia",
          text: `📺 *Programação do Dia*\n\n📅 ${dName}, ${fDate}\n\nConfira os jogos, novidades e indicações de hoje no portal da Brito Solutions.\n\n👉 LINK_PLACEHOLDER` },
        { id: "jogos", label: "⚽ Jogos", tab: "schedule" as DeepTab,
          text: `⚽ *Jogos de Hoje Atualizados*\n\n📅 ${fDate}\n\nVeja horários, canais e destaques do dia.\n\n👉 LINK_PLACEHOLDER` },
        { id: "entretenimento", label: "🍿 Entretenimento", tab: "highlights" as DeepTab,
          text: `🍿 *Assista Hoje*\n\nFilmes, séries, novidades e lançamentos do dia em um só lugar.\n\n👉 LINK_PLACEHOLDER` },
        { id: "aovivo", label: "🔴 Ao Vivo", tab: "live" as DeepTab,
          text: `🔴 *Ao Vivo Agora*\n\nVeja os jogos que estão rolando neste momento.\n\n👉 LINK_PLACEHOLDER` },
        { id: "novidades", label: "🆕 Novidades", tab: "novidades" as DeepTab,
          text: `🆕 *Novidades da Semana*\n\nFilmes, séries e lançamentos recém-adicionados.\n\n👉 LINK_PLACEHOLDER` },
      ],
    };
  }, []);

  const { data: yesterdayGames } = useAllDailyGames(yesterdayStr);
  const { data: todayGames } = useAllDailyGames(todayStr);
  const { data: tomorrowGames } = useAllDailyGames(tomorrowStr);
  const siteUrl = useSiteUrl();
  const [customMsg, setCustomMsg] = useState("");
  const { run: duplicate, busy: duplicating } = useDuplicateDay();

  const todayText = useMemo(() => buildDayText(todayGames ?? [], todayStr, siteUrl), [todayGames, todayStr, siteUrl]);
  const tomorrowText = useMemo(() => buildDayText(tomorrowGames ?? [], tomorrowStr, siteUrl), [tomorrowGames, tomorrowStr, siteUrl]);

  const todayValidation = useMemo(() => validateDay(todayGames ?? []), [todayGames]);
  const tomorrowValidation = useMemo(() => validateDay(tomorrowGames ?? []), [tomorrowGames]);

  const yesterdayCount = (yesterdayGames ?? []).filter((g) => !g.archived).length;
  const todayCount = todayValidation.active;

  const customFinal = customMsg.trim() ? `${customMsg.trim()}\n\n👉 ${siteUrl}` : "";
  const charCount = customFinal.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-xl p-4 sm:p-5 admin-stagger-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">WhatsApp — Compartilhamento</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Pré-visualize, valide e compartilhe a programação manual do dia.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Link */}
      <div className="glass-panel rounded-xl p-4 space-y-3 admin-stagger-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Link do Site</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2.5 truncate">{siteUrl}</code>
          <CopyButton text={siteUrl} label="Copiar Link" />
        </div>
      </div>

      {/* Duplicate day actions */}
      <div className="glass-panel rounded-xl p-4 space-y-3 admin-stagger-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <CopyPlus className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Duplicar programação</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Copia todos os jogos manuais de uma data para outra. Jogos com mesmo time + horário não são duplicados.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={duplicating || yesterdayCount === 0} className="min-h-[44px] gap-2">
                {duplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
                Ontem ({yesterdayCount}) → Hoje
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Duplicar jogos de ontem para hoje?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vai copiar {yesterdayCount} jogo(s) de ontem ({yesterdayStr}) para hoje ({todayStr}). Duplicatas (mesmo time + horário) são ignoradas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => duplicate(yesterdayStr, todayStr)}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={duplicating || todayCount === 0} className="min-h-[44px] gap-2">
                {duplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
                Hoje ({todayCount}) → Amanhã
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Duplicar jogos de hoje para amanhã?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vai copiar {todayCount} jogo(s) de hoje ({todayStr}) para amanhã ({tomorrowStr}). Duplicatas (mesmo time + horário) são ignoradas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => duplicate(todayStr, tomorrowStr)}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Side-by-side preview */}
      <div className="grid gap-4 lg:grid-cols-2 admin-stagger-4">
        <DayPreviewCard
          title="Hoje"
          dateStr={todayStr}
          games={todayGames}
          text={todayText}
          validation={todayValidation}
        />
        <DayPreviewCard
          title="Amanhã"
          dateStr={tomorrowStr}
          games={tomorrowGames}
          text={tomorrowText}
          validation={tomorrowValidation}
        />
      </div>

      {/* Custom Message */}
      <div className="glass-panel rounded-xl p-4 space-y-3 admin-stagger-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Mensagem Personalizada</span>
        </div>
        <Textarea
          placeholder="Digite sua mensagem aqui… o link será adicionado automaticamente."
          value={customMsg}
          onChange={(e) => setCustomMsg(e.target.value.slice(0, 4096))}
          maxLength={4096}
          className="text-xs min-h-[80px] bg-background/50 border-border/30"
        />
        <div className="flex items-center justify-between">
          <span className={`text-[10px] ${charCount > 1024 ? "text-destructive" : "text-muted-foreground/50"}`}>
            {charCount > 0 ? `${charCount} caracteres` : ""}
          </span>
          {charCount > 1024 && (
            <span className="text-[10px] text-destructive">Preview do WhatsApp pode ser cortado</span>
          )}
        </div>
        {customFinal && (
          <pre className="text-[10px] text-muted-foreground/70 whitespace-pre-wrap bg-background/30 rounded-lg p-2">
            Preview: {customFinal}
          </pre>
        )}
        <div className="flex gap-2">
          <CopyButton text={customFinal || siteUrl} label="Copiar" />
          <Button
            size="sm"
            disabled={!customMsg.trim()}
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(customFinal)}`, "_blank")}
            className="flex-1 gap-1.5 text-xs bg-[hsl(142,70%,38%)] hover:bg-[hsl(142,70%,32%)] text-white min-h-[40px]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Enviar
          </Button>
        </div>
      </div>

      {/* Pre-built Templates */}
      <div className="admin-stagger-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Copy className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Textos Prontos</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <MessageCard key={t.id} template={t} siteUrl={siteUrl} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsApp;
