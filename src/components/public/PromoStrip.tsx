export const PromoStrip = () => (
  <section className="px-4 animate-fade-up stagger-7">
    <div className="rounded-[13px] bg-green-dim border border-green-border p-5 flex items-center justify-between gap-4">
      <div className="space-y-1.5 min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-bold text-primary/70 font-body">
          Brito Solutions · Premium
        </p>
        <h3 className="font-display text-xl sm:text-2xl text-foreground tracking-wide">
          ACESSE TUDO SEM LIMITES
        </h3>
        <p className="text-[11px] text-muted-foreground font-body">
          Esportes, filmes e séries · Cancele quando quiser
        </p>
      </div>
      <a
        href={`https://wa.me/5511940759046?text=${encodeURIComponent("Olá! Quero assinar o plano Brito Solutions 📺")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Assinar agora →
      </a>
    </div>
  </section>
);
