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

const carouselItems = [...categories, ...categories, ...categories];

export const CategoryIconsCarousel = () => (
  <section className="py-4 space-y-3">
    {/* Premium message — Dual Tone branding */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="px-4 sm:px-6 space-y-1.5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight font-body">
          <span className="text-foreground">Brito </span>
          <span className="text-primary">Solutions</span>
        </h3>
        <a
          href={`https://wa.me/5511940759046?text=${encodeURIComponent("Olá! Tenho interesse em assinar o plano Brito Solutions 📺")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(142,70%,38%)] hover:bg-[hsl(142,70%,33%)] text-white px-4 py-2 text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-[hsl(142,70%,30%,0.3)] min-h-[44px] animate-pulse [animation-duration:3s] hover:[animation-play-state:paused]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Assine Já
        </a>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground/80 font-body leading-relaxed max-w-md line-clamp-1 sm:line-clamp-2">
        Sua experiência premium de streaming — esportes, filmes e séries
      </p>
    </motion.div>

    {/* Auto-scroll marquee */}
    <div className="overflow-hidden marquee-container marquee-mask">
      <div className="marquee-track flex gap-3 w-max">
        {tripled.map((cat, i) => (
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
