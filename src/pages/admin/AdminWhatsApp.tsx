import { useState } from "react";
import { useDailyGames } from "@/hooks/useDailyGames";
import { useSiteUrl } from "@/hooks/useSiteUrl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, MessageCircle, Link2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const formattedDate = format(today, "dd/MM/yyyy");
const dayName = format(today, "EEEE", { locale: ptBR });

const MESSAGE_TEMPLATES = [
  {
    id: "geral",
    label: "📺 Geral do Dia",
    text: `📺 *Programação do Dia*\n\n📅 ${dayName}, ${formattedDate}\n\nConfira os jogos, novidades e indicações de hoje no portal da Brito Solutions.\n\n👉 LINK_PLACEHOLDER`,
  },
  {
    id: "jogos",
    label: "⚽ Jogos",
    text: `⚽ *Jogos de Hoje Atualizados*\n\n📅 ${formattedDate}\n\nVeja horários, canais e destaques do dia.\n\n👉 LINK_PLACEHOLDER`,
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
];

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

const MessageCard = ({ template, siteUrl }: { template: typeof MESSAGE_TEMPLATES[0]; siteUrl: string }) => {
  const finalText = template.text.replace("LINK_PLACEHOLDER", siteUrl);

  const handleSendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(finalText)}`, "_blank");
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 border border-border/20">
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

const AdminWhatsApp = () => {
  const { data: games } = useDailyGames(todayStr);
  const siteUrl = useSiteUrl();
  const [customMsg, setCustomMsg] = useState("");

  // Build games-of-the-day text
  const gamesText = (games ?? []).length > 0
    ? `⚽ *Jogos de Hoje — ${formattedDate}*\n\n` +
      (games ?? []).map(g => `⏰ ${g.game_time.slice(0, 5)} — ${g.home_team} x ${g.away_team} (${g.competition})`).join("\n") +
      `\n\n👉 ${siteUrl}`
    : null;

  const customFinal = customMsg.trim()
    ? `${customMsg.trim()}\n\n👉 ${siteUrl}`
    : "";

  return (
    <div className="space-y-8 animate-float-in">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          WhatsApp — Compartilhamento
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Copie textos prontos ou personalize sua mensagem para compartilhar.
        </p>
      </div>

      {/* Quick Link Copy */}
      <div className="glass-card rounded-xl p-4 space-y-3 border border-border/20">
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Link do Site
        </span>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2.5 truncate">{siteUrl}</code>
          <CopyButton text={siteUrl} label="Copiar Link" />
        </div>
      </div>

      {/* Games of the Day */}
      {gamesText && (
        <div className="glass-card rounded-xl p-4 space-y-3 border border-border/20">
          <span className="text-sm font-bold text-foreground">⚽ Jogos do Dia ({(games ?? []).length})</span>
          <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 rounded-lg p-3 max-h-[200px] overflow-y-auto">
            {gamesText}
          </pre>
          <div className="flex gap-2">
            <CopyButton text={gamesText} label="Copiar" />
            <Button size="sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(gamesText)}`, "_blank")} className="flex-1 gap-1.5 text-xs bg-[hsl(142,70%,38%)] hover:bg-[hsl(142,70%,32%)] text-white min-h-[40px]">
              <MessageCircle className="h-3.5 w-3.5" />
              Enviar
            </Button>
          </div>
        </div>
      )}

      {/* Custom Message */}
      <div className="glass-card rounded-xl p-4 space-y-3 border border-border/20">
        <span className="text-sm font-bold text-foreground">✏️ Mensagem Personalizada</span>
        <Textarea
          placeholder="Digite sua mensagem aqui… o link será adicionado automaticamente."
          value={customMsg}
          onChange={(e) => setCustomMsg(e.target.value)}
          className="text-xs min-h-[80px] bg-background/50 border-border/30"
        />
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
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Copy className="h-4 w-4 text-primary" />
          Textos Prontos
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {MESSAGE_TEMPLATES.map((t) => (
            <MessageCard key={t.id} template={t} siteUrl={siteUrl} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsApp;
