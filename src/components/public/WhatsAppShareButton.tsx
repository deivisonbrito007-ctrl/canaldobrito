import { MessageCircle } from "lucide-react";

export const WhatsAppShareButton = () => {
  const handleShare = () => {
    const url = window.location.href;
    const msg = encodeURIComponent(
      `📺 Programação esportiva de hoje! Veja os jogos e indicações: ${url} - Brito Solutions (11) 94075-9046`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs sm:text-sm font-medium transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      Compartilhar no WhatsApp
    </button>
  );
};
