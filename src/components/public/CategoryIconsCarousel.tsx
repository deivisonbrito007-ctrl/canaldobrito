const categories = [
  { emoji: "🔥", label: "Em Alta", badge: "8" },
  { emoji: "⚽", label: "Futebol" },
  { emoji: "🏀", label: "Basquete" },
  { emoji: "🥊", label: "UFC/MMA" },
  { emoji: "🎬", label: "Filmes" },
  { emoji: "📺", label: "Séries" },
  { emoji: "🏅", label: "Esportes" },
  { emoji: "🎾", label: "Tênis" },
  { emoji: "🏆", label: "Destaques" },
];

const carouselItems = [...categories, ...categories, ...categories];

export const CategoryIconsCarousel = () => (
  <section className="py-3 animate-fade-up stagger-3">
    <div className="overflow-hidden marquee-container marquee-mask">
      <div className="marquee-track flex gap-2.5 w-max">
        {carouselItems.map((cat, i) => {
          const isFirst = cat.label === "Em Alta";
          return (
            <div
              key={`${cat.label}-${i}`}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all duration-200 cursor-default select-none min-h-[40px] ${
                isFirst
                  ? "bg-green-dim border-green-border"
                  : "bg-surface border-border"
              }`}
            >
              <span className="text-sm">{cat.emoji}</span>
              <span
                className={`text-[11px] font-semibold whitespace-nowrap font-body ${
                  isFirst ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {cat.label}
              </span>
              {cat.badge && (
                <span className="text-[9px] font-bold bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-body">
                  {cat.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
