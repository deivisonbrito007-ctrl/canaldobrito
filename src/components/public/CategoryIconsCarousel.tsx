import { motion } from "framer-motion";
import { Trophy, Clapperboard, Tv, Swords, Dribbble, Flame, Medal } from "lucide-react";

const categories = [
  { icon: Trophy, label: "Futebol", color: "from-emerald-500/20 to-emerald-600/10" },
  { icon: Dribbble, label: "Basquete", color: "from-orange-500/20 to-orange-600/10" },
  { icon: Swords, label: "UFC / MMA", color: "from-red-500/20 to-red-600/10" },
  { icon: Clapperboard, label: "Filmes", color: "from-blue-500/20 to-blue-600/10" },
  { icon: Tv, label: "Séries", color: "from-violet-500/20 to-violet-600/10" },
  { icon: Medal, label: "Esportes", color: "from-yellow-500/20 to-yellow-600/10" },
  { icon: Flame, label: "Em Alta", color: "from-pink-500/20 to-pink-600/10" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } },
};

const pill = {
  hidden: { opacity: 0, y: 16, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

export const CategoryIconsCarousel = () => (
  <section className="px-4 sm:px-6 py-6 space-y-5">
    {/* Premium message */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-1.5"
    >
      <h3 className="text-lg sm:text-xl font-extrabold tracking-tight font-body">
        <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
          Brito Solutions
        </span>
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground/80 font-body leading-relaxed max-w-md">
        Sua experiência premium de streaming com o canal informativo que você precisa dos seus esportes, filmes e séries favoritos
      </p>
    </motion.div>

    {/* Icons carousel */}
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
    >
      {categories.map((cat) => (
        <motion.div
          key={cat.label}
          variants={pill}
          className={`shrink-0 snap-start flex items-center gap-2.5 px-4 py-3 rounded-xl
            bg-gradient-to-br ${cat.color}
            border border-border/20 backdrop-blur-md
            hover:border-primary/30 hover:shadow-[0_0_16px_hsl(var(--primary)/0.12)]
            transition-all duration-300 cursor-default select-none
            min-h-[44px]`}
        >
          <cat.icon className="h-[18px] w-[18px] text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground/90 font-body whitespace-nowrap">
            {cat.label}
          </span>
        </motion.div>
      ))}
    </motion.div>
  </section>
);
