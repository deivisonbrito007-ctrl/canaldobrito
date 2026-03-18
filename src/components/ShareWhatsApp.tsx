import { Game, SPORTS } from "@/types/sports";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ShareWhatsAppProps {
  games: Game[];
}

export const ShareWhatsApp = ({ games }: ShareWhatsAppProps) => {
  const buildMessage = () => {
    const today = format(new Date(), "dd/MM/yyyy");
    let msg = `📺 *Agenda Brito Solutions TV* — ${today}\n\n`;

    const liveGames = games.filter((g) => g.status === "live");
    const scheduledGames = games.filter((g) => g.status === "scheduled");

    if (liveGames.length > 0) {
      msg += `🔴 *AO VIVO AGORA:*\n`;
      liveGames.forEach((g) => {
        const sport = SPORTS.find((s) => s.type === g.sport);
        msg += `${sport?.icon} ${g.homeTeam.name} ${g.homeTeam.score ?? 0} × ${g.awayTeam.score ?? 0} ${g.awayTeam.name}\n`;
      });
      msg += `\n`;
    }

    if (scheduledGames.length > 0) {
      msg += `📅 *PRÓXIMOS JOGOS:*\n`;
      scheduledGames.forEach((g) => {
        const sport = SPORTS.find((s) => s.type === g.sport);
        const time = format(new Date(g.startTime), "HH:mm");
        msg += `${sport?.icon} ${time} — ${g.homeTeam.name} vs ${g.awayTeam.name}\n`;
      });
      msg += `\n`;
    }

    msg += `🌐 Acesse: ${window.location.href}\n`;
    msg += `\n_Powered by Brito Solutions TV_ ⚡`;
    return encodeURIComponent(msg);
  };

  return (
    <a
      href={`https://wa.me/?text=${buildMessage()}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,70%,45%)] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      aria-label="Compartilhar no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};
