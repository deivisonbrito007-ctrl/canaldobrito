import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Tv, Film, Trophy, Star, Smartphone, Monitor, Tablet, Laptop, Zap, Users, CheckCircle2, Gift, AlertTriangle, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  { nth: "1ª", reward: "1 mês grátis", color: "text-primary" },
  { nth: "2ª", reward: "2 meses grátis", color: "text-primary" },
  { nth: "3ª+", reward: "Desconto vitalício", color: "text-primary" },
];

const FAQ_ITEMS = [
  { q: "Como funciona o serviço?", a: "Após a assinatura, você recebe acesso ao app com login e senha exclusivos. Basta instalar no seu dispositivo e aproveitar todo o conteúdo." },
  { q: "Posso usar em quantas telas?", a: "O plano permite uso em até 2 telas simultâneas. Para mais telas, consulte nossos planos família." },
  { q: "Tem fidelidade ou multa?", a: "Não! Sem fidelidade, sem multa. Cancele quando quiser, sem burocracia." },
  { q: "Funciona em Smart TV?", a: "Sim! Compatível com Smart TVs Samsung, LG, Android TV, Fire Stick, Roku, Chromecast e TV Box." },
  { q: "Como é feito o pagamento?", a: "Pagamento mensal via Pix ou cartão. Você recebe o acesso em até 15 minutos após a confirmação." },
  { q: "E se eu tiver problemas técnicos?", a: "Nosso suporte via WhatsApp funciona 7 dias por semana. Resolvemos qualquer problema rapidamente." },
];

const Assinar = () => {
  const { h, m, s } = useCountdown();

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
          <div className="flex items-center justify-center gap-2">
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
            { val: "5.000+", label: "Canais" },
            { val: "4.9 ★", label: "Avaliação" },
          ].map(({ val, label }) => (
            <div key={label} className="glass-panel p-3 text-center">
              <p className="font-display text-xl sm:text-2xl text-primary">{val}</p>
              <p className="text-[10px] text-muted-foreground font-body mt-0.5">{label}</p>
            </div>
          ))}
        </section>

        {/* Streaming Apps */}
        <section className="glass-panel p-5 space-y-3">
          <h2 className="font-display text-xl text-foreground tracking-wide">STREAMING & TV AO VIVO</h2>
          <div className="flex flex-wrap gap-2">
            {["HBO Max", "Paramount+", "Apple TV+", "Starz", "Globoplay", "Star+", "Disney+", "Netflix"].map((app) => (
              <span key={app} className="text-[10px] font-body font-semibold bg-green-dim text-primary border border-green-border rounded-full px-2.5 py-1">
                {app}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] font-body font-bold bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">Full HD & 4K</span>
            <span className="text-[10px] font-body font-bold bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">Multi-telas</span>
          </div>
        </section>

        {/* Pricing */}
        <section className="glass-panel p-6 text-center space-y-3 border-primary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative space-y-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-primary/70 font-body">
              Brito Solutions · TV Completa
            </p>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground line-through font-body">De R$ 60/mês</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-display text-5xl sm:text-6xl text-primary">R$ 35</span>
                <span className="text-sm text-muted-foreground font-body">/mês</span>
              </div>
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
        <section className="glass-panel p-4 border-amber-400/20 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-sm font-bold text-foreground font-body">Informações importantes</h3>
          </div>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground font-body pl-6">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span>Ativação em até 15 minutos após confirmação do pagamento</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span>Taxa única de ativação de R$ 20 por dispositivo (apenas no primeiro acesso)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span>Suporte via WhatsApp 7 dias por semana</span>
            </li>
          </ul>
        </section>

        {/* Referral */}
        <section className="glass-panel p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl text-foreground tracking-wide">INDIQUE E GANHE</h2>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">Indique amigos e ganhe benefícios exclusivos!</p>
          <div className="grid grid-cols-3 gap-2">
            {REFERRAL_TIERS.map(({ nth, reward }) => (
              <div key={nth} className="text-center p-3 rounded-xl bg-green-dim border border-green-border">
                <p className="font-display text-lg text-primary">{nth}</p>
                <p className="text-[10px] text-foreground font-body font-semibold mt-1">{reward}</p>
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
            Acesso imediato a milhares de canais, filmes e séries
          </p>
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-6 py-3.5 rounded-full hover:brightness-110 transition-all shadow-lg shadow-primary/25 min-h-[48px]"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com consultor no WhatsApp
          </a>
          <p className="text-[10px] text-muted-foreground/50 font-body">
            Atendimento humanizado · Resposta em minutos
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-4 pb-8 text-center">
          <p className="text-[10px] text-muted-foreground/30 font-body">
            © {new Date().getFullYear()} Brito Solutions TV
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Assinar;
