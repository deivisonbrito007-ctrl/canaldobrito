import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Tv, Film, Trophy, Star, Smartphone, Monitor, Tablet, Laptop, Zap, CheckCircle2, Gift, AlertTriangle, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSettings } from "@/hooks/useSettings";
import logo from "@/assets/canal_do_brito_logo.png";

import netflixIcon from "@/assets/app-icons/netflix.png";
import primeIcon from "@/assets/app-icons/prime-video.png";
import disneyIcon from "@/assets/app-icons/disney-plus.png";
import hboIcon from "@/assets/app-icons/hbo-max.png";
import globoplayIcon from "@/assets/app-icons/globoplay.png";
import paramountIcon from "@/assets/app-icons/paramount.png";
import appleTvIcon from "@/assets/app-icons/apple-tv.png";
import starzIcon from "@/assets/app-icons/starz.png";

const STREAMING_APPS = [
  { name: "Netflix", icon: netflixIcon },
  { name: "Prime Video", icon: primeIcon },
  { name: "Disney+", icon: disneyIcon },
  { name: "HBO Max", icon: hboIcon },
  { name: "Globoplay", icon: globoplayIcon },
  { name: "Paramount+", icon: paramountIcon },
  { name: "Apple TV+", icon: appleTvIcon },
  { name: "Starz", icon: starzIcon },
];

type ChannelTileItem = {
  name: string;
  domain?: string;
  localLogo?: string;
  emoji: string;
  bg: string;
  text: string;
  border: string;
};

const DEFAULT_TV_CHANNELS: ChannelTileItem[] = [
  { name: "ESPN",       domain: "espn.com",           localLogo: "/channels/espn.svg",       emoji: "📺", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "SporTV",     domain: "sportv.globo.com",   localLogo: "/channels/sportv.svg",     emoji: "⚽", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "Globo",      domain: "globo.com",          localLogo: "/channels/globo.svg",      emoji: "🌐", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "Premiere",   domain: "premiere.globo.com", localLogo: "/channels/premiere.svg",   emoji: "⭐", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "TNT Sports", domain: "tntsports.com.br",   localLogo: "/channels/tnt-sports.svg", emoji: "💥", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "Band",       domain: "band.uol.com.br",    localLogo: "/channels/band.svg",       emoji: "📡", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "CazéTV",     domain: "cazetv.com.br",      localLogo: "/channels/cazetv.svg",     emoji: "🎮", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "Record",     domain: "recordtv.r7.com",    localLogo: "/channels/record.svg",     emoji: "📺", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "Canal GOAT", domain: "canalgoat.com",      localLogo: "/channels/goat.svg",       emoji: "🐐", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "Space",      domain: "tntsports.com.br",   localLogo: "/channels/space.svg",      emoji: "🚀", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "DAZN",       domain: "dazn.com",           localLogo: "/channels/dazn.svg",       emoji: "🥊", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
  { name: "YouTube",    domain: "youtube.com",        localLogo: "/channels/youtube.svg",    emoji: "▶️", bg: "bg-white",          text: "text-foreground/85", border: "border-white/10" },
];

const buildMarqueeItems = (channels: ChannelTileItem[]) => {
  const base = [
    ...STREAMING_APPS.map(a => ({ type: "app" as const, ...a })),
    ...channels.map(c => ({ type: "channel" as const, ...c })),
  ];
  return [...base, ...base, ...base];
};

const WA_NUMBER = "5511940759046";
const WA_LINK = (msg: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

function useCountdown() {
  const getRemaining = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  };
  const [secs, setSecs] = useState(getRemaining);
  useEffect(() => {
    const t = setInterval(() => setSecs(getRemaining()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return { h, m, s };
}

const FEATURES = [
  { icon: Tv, label: "Canais ao vivo", desc: "5.000+ canais nacionais e internacionais" },
  { icon: Film, label: "Filmes & Séries", desc: "Catálogo completo atualizado diariamente" },
  { icon: Trophy, label: "Esportes", desc: "Futebol, UFC, NBA, F1 e muito mais" },
  { icon: Star, label: "Conteúdo Premium", desc: "HBO, Paramount+, Starz, Apple TV+" },
];

const DEVICES = [
  { icon: Monitor, label: "Smart TV" },
  { icon: Smartphone, label: "Celular" },
  { icon: Tablet, label: "Tablet" },
  { icon: Tv, label: "TV Box" },
  { icon: Laptop, label: "PC / Notebook" },
];

const REFERRAL_TIERS = [
  { nth: "1ª", label: "indicação", reward: "25% OFF", emoji: "💰", color: "text-amber-400" },
  { nth: "2ª", label: "indicação", reward: "50% OFF", emoji: "💰", color: "text-amber-500" },
  { nth: "3ª", label: "indicação", reward: "1 MÊS GRÁTIS", emoji: "🎁", color: "text-primary" },
];

const FAQ_ITEMS = [
  { q: "Como funciona o serviço?", a: "Você recebe acesso a um app com canais ao vivo, filmes, séries e esportes via internet. É necessário ter internet de no mínimo 10 Mbps para uma boa experiência." },
  { q: "Em quais dispositivos posso assistir?", a: "Smart TV, celular/tablet (Android e iPhone), TV Box, Fire Stick e computador. Cada assinatura funciona em 1 dispositivo por vez." },
  { q: "Posso cancelar quando quiser?", a: "Sim! Sem fidelidade e sem multa. Basta solicitar o cancelamento pelo WhatsApp. Seu acesso continua até o fim do período já pago." },
  { q: "Como é feito o pagamento?", a: "Via PIX: enviamos um link para você acessar e gerar o PIX para pagamento. Após a confirmação, seu acesso é liberado rapidamente." },
  { q: "Quanto tempo leva para ativar?", a: "A ativação é realizada rapidamente dentro do horário de atendimento. Se a solicitação for feita fora do horário, será realizada no próximo dia de atendimento." },
  { q: "O que acontece se eu indicar amigos?", a: "Você ganha descontos progressivos! 25% OFF na 1ª indicação, 50% OFF na 2ª e 1 mês grátis na 3ª. Após a 3ª, o ciclo recomeça." },
];

/** Logo do canal com cadeia de fallback: localLogo → Google Favicons → DuckDuckGo → emoji */
const ChannelLogo = ({
  localLogo,
  domain,
  emoji,
  alt,
}: { localLogo?: string; domain?: string; emoji: string; alt: string }) => {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(localLogo ? 0 : domain ? 1 : 3);
  if (stage === 3) return <span className="text-2xl leading-none" aria-hidden="true">{emoji}</span>;
  let src = "";
  if (stage === 0 && localLogo) src = localLogo;
  else if (stage === 1 && domain) src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  else if (stage === 2 && domain) src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  else return <span className="text-2xl leading-none" aria-hidden="true">{emoji}</span>;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={48}
      height={48}
      onError={() =>
        setStage((s) => {
          let next = (s + 1) as 0 | 1 | 2 | 3;
          if (next === 1 && !domain) next = 3;
          return next;
        })
      }
      className="w-full h-full object-contain"
    />
  );
};

const Assinar = () => {
  const { h, m, s } = useCountdown();
  const { data: settings } = useSettings();

  const tvChannels = useMemo<ChannelTileItem[]>(() => {
    const raw = settings?.tv_channels;
    if (!raw) return DEFAULT_TV_CHANNELS;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((c: Partial<ChannelTileItem>) => ({
          name: c.name || "",
          domain: c.domain,
          localLogo: c.localLogo,
          emoji: c.emoji || "📺",
          bg: c.bg || "bg-white",
          text: c.text || "text-foreground/85",
          border: c.border || "border-white/10",
        })).filter(c => c.name);
      }
    } catch {/* fallback */}
    return DEFAULT_TV_CHANNELS;
  }, [settings?.tv_channels]);

  const marqueeItems = useMemo(() => buildMarqueeItems(tvChannels), [tvChannels]);

  const trackRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  const pauseMarquee = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    trackRef.current?.classList.add("paused");
  }, []);

  const resumeMarquee = useCallback(() => {
    resumeTimer.current = setTimeout(() => {
      trackRef.current?.classList.remove("paused");
    }, 2000);
  }, []);

  useEffect(() => {
    if (!pricingRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(pricingRef.current);
    return () => observer.disconnect();
  }, []);

  const ctaUrl = useMemo(
    () => WA_LINK("Olá! Quero assinar o plano Brito Solutions TV 📺"),
    [],
  );

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, hsl(153 100% 50% / 0.06), transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-[240px] h-[240px] rounded-full" style={{ background: "radial-gradient(circle, hsl(153 100% 50% / 0.04), transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, hsl(153 100% 50% / 0.03), transparent 70%)" }} />
      </div>
      <div className="grain-overlay" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/5 shadow-[0_1px_3px_hsl(0,0%,0%,0.4)]">
        <div className="flex items-center justify-between px-4 py-2.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-body">Voltar</span>
          </Link>
          <img src={logo} alt="Canal do Brito" className="h-8 sm:h-10 w-auto" />
          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">

        {/* Urgency Banner */}
        <section className="glass-panel p-4 text-center space-y-2 border-primary/20">
          <p className="text-xs font-body text-primary font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Oferta por tempo limitado
          </p>
          <div
            className="flex items-center justify-center gap-2"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Tempo restante: ${h} horas, ${m} minutos e ${s} segundos`}
          >
            {[
              { val: h, label: "h" },
              { val: m, label: "m" },
              { val: s, label: "s" },
            ].map(({ val, label }) => (
              <div key={label} className="flex items-baseline gap-0.5">
                <span className="font-display text-3xl sm:text-4xl text-primary">{val}</span>
                <span className="text-[10px] text-muted-foreground font-body">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground font-body">Expira hoje à meia-noite</p>
        </section>

        {/* Social Proof */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { val: "5.000+", label: "Clientes" },
            { val: "+10 mil", label: "Títulos" },
            { val: "4.9 ★",  label: "Avaliação" },
          ].map(({ val, label }) => (
            <div key={label} className="glass-panel p-3 text-center">
              <p className="font-display text-xl sm:text-2xl text-primary">{val}</p>
              <p className="text-[10px] text-muted-foreground font-body mt-0.5">{label}</p>
            </div>
          ))}
        </section>

        {/* Streaming Apps - Carousel */}
        <section className="glass-panel p-5 space-y-4 overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse-live" />
                <h2 className="font-display text-xl text-foreground tracking-wide">Streaming &amp; TV ao Vivo</h2>
              </div>
              <p className="text-[11px] text-muted-foreground font-body mt-1 ml-4">
                Tudo em um só lugar — sem precisar de várias contas.
              </p>
            </div>
            <span className="text-[10px] font-body font-bold bg-primary text-primary-foreground rounded-full px-2.5 py-1 shrink-0 mt-0.5">
              +10.000 títulos
            </span>
          </div>
          <div
            className="overflow-hidden marquee-container marquee-mask"
            role="region"
            aria-label="Plataformas e canais inclusos"
            onTouchStart={pauseMarquee}
            onTouchEnd={resumeMarquee}
          >
            <div ref={trackRef} className="marquee-track flex gap-3 w-max">
              {marqueeItems.map((item, i) => (
                item.type === "app" ? (
                  <div key={`app-${item.name}-${i}`} className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center p-2 relative shadow-[0_4px_12px_-6px_rgba(0,0,0,0.6)]">
                      <img src={(item as any).icon} alt={`Logo ${item.name}`} loading="lazy" width={48} height={48} decoding="async" className="w-full h-full object-contain" />
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-body text-center w-14 sm:w-16 leading-tight">{item.name}</span>
                  </div>
                ) : (
                  <div key={`ch-${item.name}-${i}`} className="flex flex-col items-center gap-2 shrink-0">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center p-2 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.6)] ${(item as any).bg} ${(item as any).border}`}>
                      <ChannelLogo
                        localLogo={(item as any).localLogo}
                        domain={(item as any).domain}
                        emoji={(item as any).emoji}
                        alt={`Logo ${item.name}`}
                      />
                    </div>
                    <span className={`text-[9px] font-body font-semibold text-center w-14 sm:w-16 leading-tight ${(item as any).text}`}>{item.name}</span>
                  </div>
                )
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { icon: CheckCircle2, label: "Atualizado diariamente", primary: true },
              { icon: Zap,          label: "Full HD & 4K",            primary: true },
              { icon: Monitor,      label: "Multi-telas",             primary: false },
            ].map(({ icon: Icon, label, primary }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2"
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${primary ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-[10px] text-muted-foreground font-body leading-tight text-center">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section ref={pricingRef} className="glass-panel p-6 text-center space-y-3 border-primary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="absolute -top-px left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-body font-bold bg-primary text-primary-foreground rounded-b-lg px-4 py-1">
              ⭐ MAIS POPULAR
            </span>
          </div>
          <div className="relative space-y-3 pt-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-primary/70 font-body">
              Brito Solutions · TV Completa
            </p>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground line-through font-body">De R$ 60/mês</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-display text-5xl sm:text-6xl text-primary">R$ 35</span>
                <span className="text-sm text-muted-foreground font-body">/mês</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-body">
                Equivale a <span className="text-primary font-bold">R$ 1,17/dia</span> · menos que um café
              </p>
            </div>
            <span className="inline-block text-[10px] font-body font-bold bg-primary text-primary-foreground rounded-full px-3 py-1">
              Sem fidelidade · Cancele quando quiser
            </span>
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-6 py-3.5 rounded-full hover:brightness-110 transition-all shadow-lg shadow-primary/25 min-h-[48px]"
            >
              <MessageCircle className="w-4 h-4" />
              Assinar agora
            </a>
            <div className="flex items-center justify-center gap-4 pt-2">
              {[
                { icon: "🔓", label: "Sem fidelidade" },
                { icon: "💬", label: "Suporte WhatsApp" },
                { icon: "👥", label: "+5000 clientes" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="text-sm">{icon}</span>
                  <span className="text-[9px] text-muted-foreground font-body">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="space-y-3">
          <h2 className="font-display text-xl text-foreground tracking-wide px-1">O QUE ESTÁ INCLUSO</h2>
          <div className="grid grid-cols-1 gap-2.5">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-panel p-4 flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-green-dim border border-green-border flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground font-body">{label}</p>
                  <p className="text-[11px] text-muted-foreground font-body">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Devices */}
        <section className="space-y-3">
          <h2 className="font-display text-xl text-foreground tracking-wide px-1">ASSISTA ONDE QUISER</h2>
          <div className="flex flex-wrap gap-2">
            {DEVICES.map(({ icon: Icon, label }) => (
              <div key={label} className="glass-panel px-4 py-2.5 flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-body font-semibold text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Important Info */}
        <section className="glass-panel p-4 border-amber-400/20 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-sm font-bold text-foreground font-body">Informações importantes:</h3>
          </div>

          {/* 1 dispositivo */}
          <div className="flex items-start gap-3 text-sm text-foreground font-body">
            <span className="shrink-0 w-5 h-5 rounded bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">1</span>
            <span>Cada assinatura funciona em <strong>somente 1 dispositivo</strong>.</span>
          </div>

          {/* Taxa */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 text-sm text-foreground font-body">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center">i</span>
              <span>Sobre a taxa de R$ 25/ano:</span>
            </div>

            {/* Smart TV / Apple / Computador */}
            <div className="ml-8 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-1">
              <p className="text-xs font-body text-foreground">
                <span className="font-bold">🖥️ Smart TV, Apple ou Computador:</span> A loja de apps cobra <strong className="text-foreground">R$ 25/ano</strong> para ativar o player. Valor pago <strong className="text-primary">direto à loja</strong>, apenas 1x ao ano.
              </p>
            </div>

            {/* Android */}
            <div className="ml-8 rounded-xl bg-primary/10 border border-primary/20 p-3 space-y-1">
              <p className="text-xs font-body text-foreground">
                <span className="font-bold">✅ Android (celular, tablet ou TV Box):</span> Não precisa pagar! Temos <strong className="text-primary">aplicativo próprio</strong> sem custos adicionais.
              </p>
            </div>
          </div>
        </section>

        {/* Referral */}
        <section className="glass-panel p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl text-foreground tracking-wide">VOCÊ TAMBÉM PODE GANHAR!</h2>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">Após assinar, você recebe seu link exclusivo e ganha:</p>
          <div className="grid grid-cols-3 gap-2">
            {REFERRAL_TIERS.map(({ nth, label, reward, emoji, color }) => (
              <div key={nth} className="text-center p-3 rounded-xl bg-surface-2 border border-border">
                <p className="text-2xl mb-1">{emoji}</p>
                <p className="text-xs font-bold text-foreground font-body">{nth} {label}</p>
                <p className={`text-xs font-bold mt-1 font-body ${color}`}>{reward}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-3">
          <h2 className="font-display text-xl text-foreground tracking-wide px-1">PERGUNTAS FREQUENTES</h2>
          <div className="glass-panel p-4">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border/30">
                  <AccordionTrigger className="text-sm font-body text-foreground hover:no-underline py-3">
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[12px] text-muted-foreground font-body">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="glass-panel p-6 text-center space-y-4 border-primary/20">
          <h2 className="font-display text-2xl text-foreground tracking-wide">COMECE AGORA</h2>
          <p className="text-xs text-muted-foreground font-body">
            Qualidade, variedade e economia em um só lugar.<br />
            Acesso imediato após a confirmação do pagamento.
          </p>
          <div className="flex items-center justify-center gap-4 pt-1">
            {[
              { icon: "🔓", label: "Sem fidelidade" },
              { icon: "⚡", label: "Ativação rápida" },
              { icon: "❌", label: "Cancele quando quiser" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="text-sm">{icon}</span>
                <span className="text-[9px] text-muted-foreground font-body">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-4 pb-8 text-center" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}>
          <p className="text-[10px] text-muted-foreground/30 font-body">
            © {new Date().getFullYear()} Brito Solutions TV
          </p>
        </footer>
      </main>

      {/* Sticky CTA */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/10 px-4 py-3 transition-all duration-300 ${showSticky ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))" }}
      >
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-lg mx-auto w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-6 py-3 rounded-full hover:brightness-110 transition-all shadow-lg shadow-primary/25 min-h-[48px]"
        >
          <MessageCircle className="w-4 h-4" />
          Assinar agora · R$ 35/mês
        </a>
      </div>
    </div>
  );
};

export default Assinar;
