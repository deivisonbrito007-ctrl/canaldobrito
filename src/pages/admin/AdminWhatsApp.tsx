import { useState, useRef, useCallback } from "react";
import { useDailyGames } from "@/hooks/useDailyGames";
import { useActiveMovies } from "@/hooks/useMovies";
import { useActiveSeries } from "@/hooks/useSeries";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, MessageCircle, Zap, Play, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const formattedDate = format(today, "dd/MM/yyyy");
const dayName = format(today, "EEEE", { locale: ptBR });

// ─── WhatsApp message templates ───
const MESSAGE_TEMPLATES = [
  {
    id: "geral",
    label: "📺 Geral do Dia",
    icon: "📺",
    text: `📺 *Programação do Dia*\n\n📅 ${dayName}, ${formattedDate}\n\nConfira os jogos, novidades e indicações de hoje no portal da Brito Solutions.\n\n👉 LINK_PLACEHOLDER`,
  },
  {
    id: "jogos",
    label: "⚽ Jogos",
    icon: "⚽",
    text: `⚽ *Jogos de Hoje Atualizados*\n\n📅 ${formattedDate}\n\nVeja horários, canais e destaques do dia.\n\n👉 LINK_PLACEHOLDER`,
  },
  {
    id: "entretenimento",
    label: "🍿 Entretenimento",
    icon: "🍿",
    text: `🍿 *Assista Hoje*\n\nFilmes, séries, novidades e lançamentos do dia em um só lugar.\n\n👉 LINK_PLACEHOLDER`,
  },
  {
    id: "aovivo",
    label: "🔴 Ao Vivo",
    icon: "🔴",
    text: `🔴 *Ao Vivo Agora*\n\nVeja os jogos que estão rolando neste momento.\n\n👉 LINK_PLACEHOLDER`,
  },
];

const MessageCard = ({ template, siteUrl }: { template: typeof MESSAGE_TEMPLATES[0]; siteUrl: string }) => {
  const [copied, setCopied] = useState(false);
  const finalText = template.text.replace("LINK_PLACEHOLDER", siteUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalText);
    setCopied(true);
    toast.success("Texto copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(finalText)}`, "_blank");
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 border border-border/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">{template.label}</span>
      </div>
      <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 rounded-lg p-3 max-h-[140px] overflow-y-auto">
        {finalText}
      </pre>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1 gap-1.5 text-xs min-h-[40px]">
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <Button size="sm" onClick={handleSendWhatsApp} className="flex-1 gap-1.5 text-xs bg-[hsl(142,70%,38%)] hover:bg-[hsl(142,70%,32%)] text-white min-h-[40px]">
          <MessageCircle className="h-3.5 w-3.5" />
          Enviar
        </Button>
      </div>
    </div>
  );
};

// ─── Status image templates (rendered as canvas) ───

type StatusTemplate = "programacao" | "aovivo" | "assista";

interface GameData {
  home_team: string;
  away_team: string;
  game_time: string;
  competition: string;
}

interface ContentData {
  title: string;
  type: "movie" | "series";
}

function drawStatusCanvas(
  canvas: HTMLCanvasElement,
  template: StatusTemplate,
  games: GameData[],
  content: ContentData[]
) {
  const ctx = canvas.getContext("2d")!;
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0a0a0f");
  grad.addColorStop(0.5, "#0d1117");
  grad.addColorStop(1, "#0a0a0f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Accent line top
  const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
  accentGrad.addColorStop(0, "transparent");
  accentGrad.addColorStop(0.5, "#22c55e");
  accentGrad.addColorStop(1, "transparent");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, W, 4);

  // Header
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BRITO SOLUTIONS", W / 2, 100);

  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 18px 'Space Grotesk', sans-serif";
  ctx.fillText(`${dayName.toUpperCase()}, ${formattedDate}`, W / 2, 140);

  let y = 220;

  if (template === "programacao") {
    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px 'Space Grotesk', sans-serif";
    ctx.fillText("📺 PROGRAMAÇÃO", W / 2, y);
    ctx.fillText("DO DIA", W / 2, y + 60);
    y += 140;

    // Divider
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(W / 2 - 60, y, 120, 3);
    y += 40;

    // Games list
    const displayGames = games.slice(0, 10);
    ctx.textAlign = "left";
    for (const game of displayGames) {
      // Time badge
      ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
      roundRect(ctx, 80, y - 20, 100, 36, 8);
      ctx.fill();
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 22px 'Inter', sans-serif";
      ctx.fillText(game.game_time.slice(0, 5), 95, y + 5);

      // Teams
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.fillText(`${game.home_team} x ${game.away_team}`, 210, y + 5);

      // Competition
      ctx.fillStyle = "#64748b";
      ctx.font = "16px 'Inter', sans-serif";
      ctx.fillText(game.competition, 210, y + 32);

      y += 75;
    }
  } else if (template === "aovivo") {
    // Title with red accent
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 52px 'Space Grotesk', sans-serif";
    ctx.fillText("🔴 AO VIVO", W / 2, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px 'Space Grotesk', sans-serif";
    ctx.fillText("AGORA", W / 2, y + 60);
    y += 140;

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(W / 2 - 60, y, 120, 3);
    y += 50;

    const liveGames = games.slice(0, 6);
    for (const game of liveGames) {
      // Card background
      ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
      roundRect(ctx, 60, y - 15, W - 120, 80, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
      ctx.lineWidth = 1;
      roundRect(ctx, 60, y - 15, W - 120, 80, 12);
      ctx.stroke();

      // Live dot
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(100, y + 25, 6, 0, Math.PI * 2);
      ctx.fill();

      // Teams
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${game.home_team} x ${game.away_team}`, W / 2, y + 30);

      // Competition
      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px 'Inter', sans-serif";
      ctx.fillText(game.competition, W / 2, y + 55);

      y += 110;
    }
    ctx.textAlign = "center";
  } else if (template === "assista") {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px 'Space Grotesk', sans-serif";
    ctx.fillText("🍿 ASSISTA HOJE", W / 2, y);
    y += 80;

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(W / 2 - 60, y, 120, 3);
    y += 50;

    const displayContent = content.slice(0, 8);
    for (const item of displayContent) {
      const badgeColor = item.type === "movie" ? "#22c55e" : "#3b82f6";
      const badgeText = item.type === "movie" ? "🎬 FILME" : "📺 SÉRIE";

      // Card
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      roundRect(ctx, 60, y - 10, W - 120, 65, 10);
      ctx.fill();

      // Badge
      ctx.fillStyle = badgeColor;
      ctx.font = "bold 14px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(badgeText, 90, y + 18);

      // Title
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 22px 'Inter', sans-serif";
      const maxWidth = W - 240;
      const title = item.title.length > 35 ? item.title.slice(0, 35) + "…" : item.title;
      ctx.fillText(title, 230, y + 20);

      y += 85;
    }
    ctx.textAlign = "center";
  }

  // CTA at bottom
  y = H - 200;
  ctx.fillStyle = "#22c55e";
  roundRect(ctx, W / 2 - 220, y, 440, 60, 30);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("👉 Veja tudo no portal", W / 2, y + 38);

  // Footer
  ctx.fillStyle = "#64748b";
  ctx.font = "16px 'Inter', sans-serif";
  ctx.fillText("Brito Solutions • britosolutions.com", W / 2, H - 80);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const StatusPreview = ({
  template,
  games,
  content,
}: {
  template: StatusTemplate;
  games: GameData[];
  content: ContentData[];
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  const render = useCallback(() => {
    if (!canvasRef.current) return;
    drawStatusCanvas(canvasRef.current, template, games, content);
    setRendered(true);
  }, [template, games, content]);

  const download = () => {
    if (!canvasRef.current) return;
    if (!rendered) render();
    setTimeout(() => {
      const link = document.createElement("a");
      link.download = `status-${template}-${todayStr}.png`;
      link.href = canvasRef.current!.toDataURL("image/png");
      link.click();
      toast.success("Imagem baixada!");
    }, 100);
  };

  const labels: Record<StatusTemplate, string> = {
    programacao: "📺 Programação do Dia",
    aovivo: "🔴 Ao Vivo Agora",
    assista: "🍿 Assista Hoje",
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 border border-border/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">{labels[template]}</span>
        <span className="text-[10px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">9:16</span>
      </div>

      <div className="relative bg-background/50 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: "9/16", maxHeight: 360 }}>
        <canvas ref={canvasRef} className="w-full h-full object-contain" style={{ display: rendered ? "block" : "none" }} />
        {!rendered && (
          <Button variant="outline" size="sm" onClick={render} className="gap-1.5 min-h-[40px]">
            <Zap className="h-3.5 w-3.5" />
            Gerar Preview
          </Button>
        )}
      </div>

      <Button size="sm" onClick={download} className="w-full gap-1.5 text-xs min-h-[40px]">
        <Download className="h-3.5 w-3.5" />
        Baixar para Status
      </Button>
    </div>
  );
};

const AdminWhatsApp = () => {
  const { data: games } = useDailyGames(todayStr);
  const { data: movies } = useActiveMovies();
  const { data: series } = useActiveSeries();

  const siteUrl = window.location.origin;

  const gameData: GameData[] = (games ?? []).map((g) => ({
    home_team: g.home_team,
    away_team: g.away_team,
    game_time: g.game_time,
    competition: g.competition,
  }));

  const contentData: ContentData[] = [
    ...(movies ?? []).map((m) => ({ title: m.title, type: "movie" as const })),
    ...(series ?? []).map((s) => ({ title: s.title, type: "series" as const })),
  ];

  return (
    <div className="space-y-8 animate-float-in">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          WhatsApp & Status
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Gere imagens para Status e textos prontos para compartilhar.
        </p>
      </div>

      {/* Status Images */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          Imagens para Status (9:16)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatusPreview template="programacao" games={gameData} content={contentData} />
          <StatusPreview template="aovivo" games={gameData} content={contentData} />
          <StatusPreview template="assista" games={gameData} content={contentData} />
        </div>
      </div>

      {/* Message Templates */}
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
