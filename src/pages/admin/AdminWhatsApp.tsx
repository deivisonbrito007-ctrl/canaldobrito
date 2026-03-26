import { useState, useMemo } from "react";
import { useAllDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useSiteUrl } from "@/hooks/useSiteUrl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, MessageCircle, Link2, FileText } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { SPORT_EMOJI, SPORT_LABEL, type SportType, getLocalDateString, midnightInSaoPaulo } from "@/lib/gameUtils";

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

const MessageCard = ({ template, siteUrl }: { template: { id: string; label: string; text: string }; siteUrl: string }) => {
  const finalText = template.text.replace("LINK_PLACEHOLDER", siteUrl);

  const handleSendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(finalText)}`, "_blank");
  };

  return (
    <div className="glass-panel rounded-xl p-4 space-y-3">
      <span className="text-sm font-bold text-foreground">{template.label}</span>
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
    const key = g.sport_type || "football";
    if (!bySport[key]) bySport[key] = [];
    bySport[key].push(g);
  });

  const sportOrder: string[] = ['football', 'basketball', 'volleyball', 'tennis', 'mma', 'f1'];
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

  lines.push(`👉 ${siteUrl}`);
  return lines.join("\n").trim();
}

const AdminWhatsApp = () => {
  const { todayStr, tomorrowStr, templates } = useMemo(() => {
    const now = new Date();
    const tStr = getLocalDateString(now);
    const spNow = midnightInSaoPaulo(tStr);
    const tomorrowDate = addDays(spNow, 1);
    const tmStr = getLocalDateString(tomorrowDate);
    const fDate = format(now, "dd/MM/yyyy");
    const dName = format(now, "EEEE", { locale: ptBR });

    return {
      todayStr: tStr,
      tomorrowStr: tmStr,
      templates: [
        {
          id: "geral",
          label: "📺 Geral do Dia",
          text: `📺 *Programação do Dia*\n\n📅 ${dName}, ${fDate}\n\nConfira os jogos, novidades e indicações de hoje no portal da Brito Solutions.\n\n👉 LINK_PLACEHOLDER`,
        },
        {
          id: "jogos",
          label: "⚽ Jogos",
          text: `⚽ *Jogos de Hoje Atualizados*\n\n📅 ${fDate}\n\nVeja horários, canais e destaques do dia.\n\n👉 LINK_PLACEHOLDER`,
        },
        {
          id: "entretenimento",
          label: "🍿 Entretenimento",
          text: `🍿 *Assista Hoje*\n\nFilmes, séries, novidades e lançamentos do dia em um só lugar.\n\n👉 LINK_PLACEHOLDER`,
        },
        {
          id: "aovivo",
          label: "🔴 Ao Vivo",
          text: `🔴 *Ao Vivo Agora*\n\nVeja os jogos que estão rolando neste momento.\n\n👉 LINK_PLACEHOLDER`,
        },
      ],
    };
  }, []);

  const { data: todayGames } = useAllDailyGames(todayStr);
  const { data: tomorrowGames } = useAllDailyGames(tomorrowStr);
  const siteUrl = useSiteUrl();
  const [customMsg, setCustomMsg] = useState("");

  const todayText = useMemo(() => buildDayText(todayGames ?? [], todayStr, siteUrl), [todayGames, todayStr, siteUrl]);
  const tomorrowText = useMemo(() => buildDayText(tomorrowGames ?? [], tomorrowStr, siteUrl), [tomorrowGames, tomorrowStr, siteUrl]);

  const todayCount = todayGames?.length ?? 0;
  const tomorrowCount = tomorrowGames?.length ?? 0;

  const customFinal = customMsg.trim()
    ? `${customMsg.trim()}\n\n👉 ${siteUrl}`
    : "";

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
              Copie textos prontos ou personalize sua mensagem para compartilhar.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Link Copy */}
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

      {/* Games Schedule with Tabs */}
      <div className="glass-panel rounded-xl p-4 space-y-3 admin-stagger-3">
        <Tabs defaultValue="today">
          <TabsList className="w-full">
            <TabsTrigger value="today" className="flex-1 text-xs">
              Hoje ({todayCount})
            </TabsTrigger>
            <TabsTrigger value="tomorrow" className="flex-1 text-xs">
              Amanhã ({tomorrowCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3 mt-3">
            {todayText ? (
              <>
                <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 rounded-lg p-3 max-h-[240px] overflow-y-auto">
                  {todayText}
                </pre>
                <div className="flex gap-2">
                  <CopyButton text={todayText} label="Copiar" />
                  <Button size="sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(todayText)}`, "_blank")} className="flex-1 gap-1.5 text-xs bg-[hsl(142,70%,38%)] hover:bg-[hsl(142,70%,32%)] text-white min-h-[40px]">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enviar
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum jogo agendado para hoje.</p>
            )}
          </TabsContent>

          <TabsContent value="tomorrow" className="space-y-3 mt-3">
            {tomorrowText ? (
              <>
                <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 rounded-lg p-3 max-h-[240px] overflow-y-auto">
                  {tomorrowText}
                </pre>
                <div className="flex gap-2">
                  <CopyButton text={tomorrowText} label="Copiar" />
                  <Button size="sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(tomorrowText)}`, "_blank")} className="flex-1 gap-1.5 text-xs bg-[hsl(142,70%,38%)] hover:bg-[hsl(142,70%,32%)] text-white min-h-[40px]">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enviar
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum jogo agendado para amanhã.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Custom Message */}
      <div className="glass-panel rounded-xl p-4 space-y-3 admin-stagger-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Mensagem Personalizada</span>
        </div>
        <Textarea
          placeholder="Digite sua mensagem aqui… o link será adicionado automaticamente."
          value={customMsg}
          onChange={(e) => setCustomMsg(e.target.value)}
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
