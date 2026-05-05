import { useState, useMemo } from "react";
import { useAllDailyGames, type DailyGame } from "@/hooks/useDailyGames";
import { useSiteUrl } from "@/hooks/useSiteUrl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy, Check, MessageCircle, Link2, FileText, AlertTriangle,
  CheckCircle2, Tv, Radio, Sparkles, Star, CalendarDays, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { SPORT_EMOJI, SPORT_LABEL, type SportType, getLocalDateString, midnightInSaoPaulo, detectSportType } from "@/lib/gameUtils";
import { buildDeepLink, TAB_SLUGS, type PublicTab } from "@/lib/utils";

type DeepTab = PublicTab;

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
        {template.tab && (
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


const AdminWhatsApp = () => {
  const { todayStr, templates } = useMemo(() => {
    const now = new Date();
    const tStr = getLocalDateString(now);
    const fDate = format(now, "dd/MM/yyyy");
    const dName = format(now, "EEEE", { locale: ptBR });

    return {
      todayStr: tStr,
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

  const { data: todayGames } = useAllDailyGames(todayStr);
  const siteUrl = useSiteUrl();
  const [customMsg, setCustomMsg] = useState("");
  const [withUtm, setWithUtm] = useState(true);

  const todayText = useMemo(() => buildDayText(todayGames ?? [], todayStr, siteUrl), [todayGames, todayStr, siteUrl]);
  const todayValidation = useMemo(() => validateDay(todayGames ?? []), [todayGames]);

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
              Pré-visualize, valide e compartilhe a programação manual de hoje.
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

      {/* Quick Tab Links */}
      <div className="glass-panel rounded-xl p-4 space-y-3 admin-stagger-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Links rápidos por aba</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Compartilhe um link que abre o portal direto na aba escolhida — ideal para o status do WhatsApp.
        </p>
        <label className="flex items-center justify-between gap-2 rounded-lg border border-border/30 bg-background/40 px-3 py-2 cursor-pointer">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">Adicionar UTM (rastrear no Analytics)</span>
            <span className="text-[10px] text-muted-foreground">
              Acrescenta <code className="font-mono">utm_source=whatsapp</code> e <code className="font-mono">utm_campaign=share-&lt;aba&gt;</code>
            </span>
          </div>
          <input
            type="checkbox"
            checked={withUtm}
            onChange={(e) => setWithUtm(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            {
              tab: "live" as DeepTab,
              label: "Ao Vivo",
              emoji: "🔴",
              Icon: Radio,
              accent: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-300",
              title: "Ao Vivo agora",
              description: "Veja em tempo real o que está rolando no portal.",
              msg: "🔴 Ao Vivo agora no portal! Veja o que está rolando 👇",
            },
            {
              tab: "novidades" as DeepTab,
              label: "Novidades",
              emoji: "🆕",
              Icon: Sparkles,
              accent: "from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-300",
              title: "Novidades da semana",
              description: "Filmes, séries e lançamentos recém-adicionados.",
              msg: "🆕 Novidades da semana — confira os lançamentos 👇",
            },
            {
              tab: "highlights" as DeepTab,
              label: "Sugestões",
              emoji: "⭐",
              Icon: Star,
              accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300",
              title: "Sugestões pra hoje",
              description: "Indicações selecionadas de filmes e séries.",
              msg: "⭐ Sugestões de filmes e séries pra hoje 👇",
            },
            {
              tab: "schedule" as DeepTab,
              label: "Programação",
              emoji: "📅",
              Icon: CalendarDays,
              accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
              title: "Programação de hoje",
              description: "Horários, canais e jogos do dia, organizados.",
              msg: "📅 Programação completa de hoje no portal 👇",
            },
          ]).map(({ tab, label, emoji, Icon, accent, title, description, msg }) => {
            const link = buildDeepLink(siteUrl, tab, { utm: withUtm });
            const text = `${msg}\n\n${link}`;
            let host = siteUrl;
            try { host = new URL(link).host; } catch { /* noop */ }
            return (
              <div key={tab} className="rounded-xl border border-border/30 bg-background/40 overflow-hidden">
                {/* WhatsApp-style link preview */}
                <div className={`relative bg-gradient-to-br ${accent} border-b border-border/30 p-3 flex items-start gap-3`}>
                  <div className="shrink-0 h-12 w-12 rounded-lg bg-background/60 border border-border/40 flex items-center justify-center">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">
                        {emoji} {label}
                      </span>
                      <span className="text-[9px] font-mono opacity-60 bg-background/40 rounded px-1.5 py-0.5">
                        /{TAB_SLUGS[tab]}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground leading-tight mt-1 truncate">
                      {title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                      {description}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/80 truncate">
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{host}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <code className="block text-[10px] text-muted-foreground bg-background/60 rounded px-2 py-1.5 truncate">
                    {link}
                  </code>
                  <div className="flex gap-2">
                    <CopyButton text={link} label="Link" />
                    <Button
                      size="sm"
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")}
                      className="flex-1 gap-1.5 text-xs bg-[hsl(142,70%,38%)] hover:bg-[hsl(142,70%,32%)] text-white min-h-[40px]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Status
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-stagger-4">
        <DayPreviewCard
          title="Hoje"
          dateStr={todayStr}
          games={todayGames}
          text={todayText}
          validation={todayValidation}
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
