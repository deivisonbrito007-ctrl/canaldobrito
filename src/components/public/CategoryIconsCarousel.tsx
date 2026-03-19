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

const doubled = [...categories, ...categories];

export const CategoryIconsCarousel = () => (
  <section className="px-4 sm:px-6 py-4 space-y-3">
    {/* Premium message — Dual Tone branding */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-1.5"
    >
      <h3 className="text-lg sm:text-xl font-extrabold tracking-tight font-body">
        <span className="text-foreground">Brito </span>
        <span className="text-primary">Solutions</span>
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground/80 font-body leading-relaxed max-w-md line-clamp-1 sm:line-clamp-2">
        Sua experiência premium de streaming — esportes, filmes e séries
      </p>
    </motion.div>

    {/* Auto-scroll marquee */}
    <div className="overflow-hidden marquee-container">
      <div className="marquee-track flex gap-3 w-max">
        {doubled.map((cat, i) => (
          <div
            key={`${cat.label}-${i}`}
            className={`shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl
              bg-gradient-to-br ${cat.color}
              border border-border/20 backdrop-blur-md
              transition-all duration-300 cursor-default select-none
              min-h-[44px]`}
          >
            <cat.icon className="h-[18px] w-[18px] text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground/90 font-body whitespace-nowrap">
              {cat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
);
