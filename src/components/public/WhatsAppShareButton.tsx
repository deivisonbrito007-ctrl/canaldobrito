import { MessageCircle, Share2 } from "lucide-react";
import { useSiteUrl } from "@/hooks/useSiteUrl";

export const WhatsAppShareButton = () => {
  const siteUrl = useSiteUrl();

  const handleShare = () => {
    const msg = encodeURIComponent(
      `📺 Confira a programação de hoje! Filmes, séries e esportes ao vivo: ${siteUrl} - Brito Solutions (11) 94075-9046`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-[hsl(142,70%,40%,0.25)] min-h-[44px]"
    >
      <MessageCircle className="h-4 w-4" />
      Compartilhar no WhatsApp
      <Share2 className="h-3.5 w-3.5 opacity-60" />
    </button>
  );
};
