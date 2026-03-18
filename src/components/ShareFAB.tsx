import { useState } from "react";
import { Game, SPORTS } from "@/types/sports";
import { MessageCircle, Download, X, Share2 } from "lucide-react";
import { format } from "date-fns";
import { useBanners } from "@/hooks/useBanners";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ShareFABProps {
  games: Game[];
}

export const ShareFAB = ({ games }: ShareFABProps) => {
  const [open, setOpen] = useState(false);
  const { data: coverBanners = [] } = useBanners("cover", true);

  const buildMessage = () => {
    const today = format(new Date(), "dd/MM/yyyy");
    let msg = `📺 *Agenda Brito Solutions TV* — ${today}\n\n`;

    const liveGames = games.filter((g) => g.status === "live");
    const scheduledGames = games.filter((g) => g.status === "scheduled");

    if (liveGames.length > 0) {
      msg += `🔴 *AO VIVO AGORA:*\n`;
      liveGames.forEach((g) => {
        const sport = SPORTS.find((s) => s.type === g.sport);
        msg += `${sport?.icon} ${g.homeTeam.name} ${g.homeTeam.score ?? 0} × ${g.awayTeam.score ?? 0} ${g.awayTeam.name}`;
        if (g.broadcastChannel) msg += ` 📺 ${g.broadcastChannel}`;
        msg += `\n`;
      });
      msg += `\n`;
    }

    if (scheduledGames.length > 0) {
      msg += `📅 *PRÓXIMOS JOGOS:*\n`;
      scheduledGames.forEach((g) => {
        const sport = SPORTS.find((s) => s.type === g.sport);
        const time = format(new Date(g.startTime), "HH:mm");
        msg += `${sport?.icon} ${time} — ${g.homeTeam.name} vs ${g.awayTeam.name}`;
        if (g.broadcastChannel) msg += ` 📺 ${g.broadcastChannel}`;
        msg += `\n`;
      });
      msg += `\n`;
    }

    msg += `🌐 Acesse: ${window.location.href}\n`;
    msg += `\n_Powered by Brito Solutions TV_ ⚡`;
    return encodeURIComponent(msg);
  };

  const handleShareText = () => {
    window.open(`https://wa.me/?text=${buildMessage()}`, "_blank");
    setOpen(false);
  };

  const handleDownloadImage = async () => {
    if (coverBanners.length === 0) {
      toast.error("Nenhum banner de capa disponível para baixar.");
      return;
    }

    const imageUrl = coverBanners[0].image_url;

    // Try Web Share API first (mobile)
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "programacao-brito-solutions.jpg", { type: blob.type });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Programação Brito Solutions TV",
            files: [file],
          });
          setOpen(false);
          return;
        }
      } catch (err) {
        // User cancelled or not supported, fall through to download
      }
    }

    // Fallback: direct download
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "programacao-brito-solutions.jpg";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Imagem baixada! Poste no seu Status do WhatsApp.");
    setOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <AnimatePresence>
        {open && (
          <>
            {/* Download image option */}
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              onClick={handleDownloadImage}
              className="flex items-center gap-2 rounded-full bg-card border border-border/50 px-4 py-2.5 text-sm font-medium text-foreground shadow-lg active:scale-95 transition-transform"
            >
              <Download className="h-4 w-4 text-primary" />
              Imagem p/ Status
            </motion.button>

            {/* Send text option */}
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleShareText}
              className="flex items-center gap-2 rounded-full bg-card border border-border/50 px-4 py-2.5 text-sm font-medium text-foreground shadow-lg active:scale-95 transition-transform"
            >
              <MessageCircle className="h-4 w-4 text-[hsl(142,70%,45%)]" />
              Enviar Texto
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95",
          open
            ? "bg-card border border-border/50 text-foreground"
            : "bg-[hsl(142,70%,45%)] text-white"
        )}
        aria-label="Compartilhar"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Share2 className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};
