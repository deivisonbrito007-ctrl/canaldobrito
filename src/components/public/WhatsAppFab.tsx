import { MessageCircle } from "lucide-react";

export const WhatsAppFab = () => {
  const handleShare = () => {
    const url = window.location.href;
    const msg = encodeURIComponent(
      `📺 Confira a programação de hoje! Filmes, séries e esportes ao vivo: ${url} - Brito Solutions`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <button
      onClick={handleShare}
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-[hsl(142,70%,40%)] text-white shadow-lg shadow-[hsl(142,70%,30%,0.4)] hover:scale-110 active:scale-95 transition-transform"
      aria-label="Compartilhar no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};