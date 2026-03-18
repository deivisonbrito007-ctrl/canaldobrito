import { motion } from "framer-motion";
import { Tv, Clock, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const InfoSection = () => {
  const today = new Date();
  const dayName = format(today, "EEEE", { locale: ptBR });
  const dateStr = format(today, "d 'de' MMMM", { locale: ptBR });

  const infoCards = [
    {
      icon: <Tv className="h-5 w-5 text-primary" />,
      title: "Programação do Dia",
      description: `Confira todos os jogos e transmissões de ${dayName}, ${dateStr}.`,
    },
    {
      icon: <Clock className="h-5 w-5 text-[hsl(var(--warning))]" />,
      title: "Atualizado em Tempo Real",
      description: "As imagens de programação são atualizadas diariamente pela nossa equipe.",
    },
    {
      icon: <Zap className="h-5 w-5 text-[hsl(142,70%,45%)]" />,
      title: "Compartilhe",
      description: "Use o botão de compartilhar para enviar a programação no WhatsApp ou baixar a imagem para seu Status.",
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="font-display text-sm sm:text-base font-bold text-foreground px-1">
        ℹ️ Informações
      </h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {infoCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            className="rounded-xl border border-border/50 bg-card p-4 space-y-2"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                {card.icon}
              </div>
              <h3 className="font-display text-sm font-bold text-foreground">{card.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
