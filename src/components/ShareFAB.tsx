import { useState } from "react";
import { MessageCircle, Download, X, Share2, Image } from "lucide-react";
import { useBanners } from "@/hooks/useBanners";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const ShareFAB = () => {
  const [open, setOpen] = useState(false);
  const { data: coverBanners = [] } = useBanners("cover", true);

  const handleShareText = () => {
    const msg = encodeURIComponent(
      `📺 *Brito Solutions TV*\n\nConfira a programação esportiva de hoje!\n\n🌐 ${window.location.href}\n\n_Powered by Brito Solutions TV_ ⚡`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
    setOpen(false);
  };

  const handleDownloadImage = async () => {
    if (coverBanners.length === 0) {
      toast.error("Nenhum banner de capa disponível.");
      return;
    }

    const imageUrl = coverBanners[0].image_url;

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
      } catch {
        // Fall through to download
      }
    }

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "programacao-brito-solutions.jpg";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Imagem baixada! Poste no seu Status.");
    setOpen(false);
  };

  const fabActions = [
    {
      icon: <Image className="h-4 w-4 text-primary" />,
      label: "Imagem p/ Status",
      onClick: handleDownloadImage,
      delay: 0.08,
    },
    {
      icon: <MessageCircle className="h-4 w-4 text-[hsl(142,70%,45%)]" />,
      label: "Enviar Texto",
      onClick: handleShareText,
      delay: 0,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2.5"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <AnimatePresence>
          {open &&
            fabActions.map((action) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 12, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.85 }}
                transition={{ duration: 0.18, delay: action.delay }}
                onClick={action.onClick}
                className="flex items-center gap-2.5 rounded-full bg-card border border-border/60 px-4 py-3 text-sm font-medium text-foreground shadow-xl active:scale-95 transition-transform min-h-[44px]"
              >
                {action.icon}
                {action.label}
              </motion.button>
            ))}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(!open)}
          animate={open ? { rotate: 45 } : { rotate: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-colors duration-200 active:scale-95",
            open
              ? "bg-card border border-border/60 text-foreground"
              : "bg-[hsl(142,70%,45%)] text-white"
          )}
          aria-label="Compartilhar"
        >
          {open ? <X className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        </motion.button>
      </div>
    </>
  );
};
