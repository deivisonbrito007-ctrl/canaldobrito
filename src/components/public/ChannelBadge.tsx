import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type ChannelConfig = {
  emoji: string;
  text: string;
  border: string;
  gradient: string;
  glow: string;
  short?: string;
  /** Domain used to fetch the official favicon via Google/DuckDuckGo CDN */
  domain?: string;
  /** Local SVG/PNG path under /public — priority over CDN favicons */
  localLogo?: string;
};

const CHANNEL_MAP: Record<string, ChannelConfig> = {
  espn:         { emoji: "📺", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-red-700/20",         glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]",  domain: "espn.com", localLogo: "/channels/espn.svg" },
  sportv:       { emoji: "⚽", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-600/30 to-emerald-700/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", domain: "sportv.globo.com" },
  globo:        { emoji: "🌐", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-300/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]", domain: "globo.com" },
  premiere:     { emoji: "⭐", text: "text-yellow-300",  border: "border-yellow-500/40",  gradient: "from-yellow-500/30 to-amber-600/20",    glow: "shadow-[0_0_14px_rgba(234,179,8,0.25)]", domain: "premiere.globo.com" },
  "disney+":    { emoji: "✨", text: "text-blue-300",    border: "border-blue-600/40",    gradient: "from-blue-700/35 to-indigo-800/25",     glow: "shadow-[0_0_12px_rgba(29,78,216,0.2)]",  domain: "disneyplus.com" },
  cazétv:       { emoji: "🎮", text: "text-lime-300",    border: "border-lime-500/40",    gradient: "from-lime-500/30 to-green-600/20",      glow: "shadow-[0_0_12px_rgba(132,204,22,0.2)]", short: "Cazé", domain: "cazetv.com.br", localLogo: "/channels/cazetv.svg" },
  cazetv:       { emoji: "🎮", text: "text-lime-300",    border: "border-lime-500/40",    gradient: "from-lime-500/30 to-green-600/20",      glow: "shadow-[0_0_12px_rgba(132,204,22,0.2)]", short: "Cazé", domain: "cazetv.com.br", localLogo: "/channels/cazetv.svg" },
  tnt:          { emoji: "💥", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-cyan-700/20",       glow: "shadow-[0_0_12px_rgba(37,99,235,0.2)]",  domain: "tntsports.com.br" },
  "prime video":{ emoji: "▶️", text: "text-sky-300",     border: "border-sky-500/40",     gradient: "from-sky-500/30 to-blue-600/20",        glow: "shadow-[0_0_12px_rgba(14,165,233,0.2)]", short: "Prime", domain: "primevideo.com" },
  paramount:    { emoji: "⛰️", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-indigo-700/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "Param+", domain: "paramountplus.com" },
  "paramount+": { emoji: "⛰️", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-indigo-700/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "Param+", domain: "paramountplus.com" },
  netflix:      { emoji: "🎞️", text: "text-red-300",     border: "border-red-600/40",     gradient: "from-red-700/30 to-red-900/20",         glow: "shadow-[0_0_12px_rgba(220,38,38,0.25)]", domain: "netflix.com" },
  apple:        { emoji: "🍎", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-200/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]", short: "Apple TV", domain: "apple.com" },
  "apple tv":   { emoji: "🍎", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-200/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]", short: "Apple", domain: "tv.apple.com" },
  globoplay:    { emoji: "▶️", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-rose-700/20",        glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]", short: "Gplay", domain: "globoplay.globo.com" },
  band:         { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", domain: "band.uol.com.br" },
  bandsports:   { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", short: "BandSp", domain: "band.uol.com.br" },
  bandplay:     { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", domain: "band.uol.com.br" },
  max:          { emoji: "🎬", text: "text-purple-300",  border: "border-purple-500/40",  gradient: "from-purple-700/30 to-violet-800/20",   glow: "shadow-[0_0_12px_rgba(147,51,234,0.2)]", domain: "max.com" },
  "hbo max":    { emoji: "🎬", text: "text-purple-300",  border: "border-purple-500/40",  gradient: "from-purple-700/30 to-violet-800/20",   glow: "shadow-[0_0_12px_rgba(147,51,234,0.2)]", short: "HBO", domain: "max.com" },
  record:       { emoji: "📺", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-500/30 to-indigo-600/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", domain: "recordtv.r7.com" },
  sbt:          { emoji: "📺", text: "text-pink-300",    border: "border-pink-500/40",    gradient: "from-pink-500/30 to-fuchsia-600/20",    glow: "shadow-[0_0_12px_rgba(236,72,153,0.2)]", domain: "sbt.com.br" },
  "canal goat": { emoji: "🐐", text: "text-amber-300",   border: "border-amber-500/40",   gradient: "from-amber-500/30 to-orange-600/20",    glow: "shadow-[0_0_12px_rgba(245,158,11,0.2)]", short: "GOAT", domain: "canalgoat.com", localLogo: "/channels/goat.svg" },
  "ge tv":      { emoji: "📱", text: "text-orange-300",  border: "border-orange-500/40",  gradient: "from-orange-500/30 to-amber-600/20",    glow: "shadow-[0_0_12px_rgba(249,115,22,0.2)]", short: "ge", domain: "ge.globo.com" },
  space:        { emoji: "🚀", text: "text-indigo-300",  border: "border-indigo-500/40",  gradient: "from-indigo-500/30 to-purple-600/20",   glow: "shadow-[0_0_12px_rgba(99,102,241,0.2)]", domain: "tntsports.com.br" },
  "esporte na band": { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", short: "Band YT", domain: "band.uol.com.br" },
  youtube:      { emoji: "▶️", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-red-700/20",         glow: "shadow-[0_0_12px_rgba(239,68,68,0.25)]", short: "YT", domain: "youtube.com", localLogo: "/channels/youtube.svg" },
  dazn:         { emoji: "🥊", text: "text-yellow-300",  border: "border-yellow-500/40",  gradient: "from-yellow-500/30 to-amber-600/20",    glow: "shadow-[0_0_12px_rgba(234,179,8,0.2)]", domain: "dazn.com" },
  nsports:      { emoji: "🏆", text: "text-cyan-300",    border: "border-cyan-500/40",    gradient: "from-cyan-500/30 to-sky-600/20",        glow: "shadow-[0_0_12px_rgba(6,182,212,0.2)]", domain: "nsports.com.br" },
};

const FALLBACK: ChannelConfig = {
  emoji: "📺",
  text: "text-muted-foreground",
  border: "border-border/30",
  gradient: "from-secondary/40 to-secondary/20",
  glow: "",
};

function matchChannel(name: string): ChannelConfig {
  const key = name.toLowerCase().trim();
  if (CHANNEL_MAP[key]) return CHANNEL_MAP[key];
  for (const [k, v] of Object.entries(CHANNEL_MAP)) {
    if (key.includes(k)) return v;
  }
  return FALLBACK;
}

function isCanalDoBrito(name: string) {
  const n = name.toLowerCase();
  return n.includes("canal do brito") || n.includes("brito");
}

type BadgeSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "text-[9px] px-1.5 py-0.5 gap-1 rounded-md",
  md: "text-[10px] px-2 py-1 gap-1.5 rounded-lg",
  lg: "text-[11px] px-2.5 py-1.5 gap-1.5 rounded-lg",
};

const ICON_SIZE: Record<BadgeSize, string> = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

interface ChannelBadgeProps {
  name: string;
  size?: BadgeSize;
  className?: string;
}

/** Tries the official favicon via DuckDuckGo Icons; falls back to emoji on error */
const ChannelIcon = ({
  domain,
  emoji,
  size,
  alt,
}: { domain?: string; emoji: string; size: BadgeSize; alt: string }) => {
  const [stage, setStage] = useState<0 | 1 | 2>(0); // 0: google, 1: ddg, 2: emoji

  if (!domain || stage === 2) {
    return <span className="leading-none">{emoji}</span>;
  }

  const src =
    stage === 0
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      : `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setStage((s) => (s === 0 ? 1 : 2))}
      className={cn("rounded-sm object-contain shrink-0", ICON_SIZE[size])}
    />
  );
};

export const ChannelBadge = React.forwardRef<HTMLSpanElement, ChannelBadgeProps>(
  ({ name, size = "md", className }, ref) => {
    const isMobile = useIsMobile();
    const sizeCls = SIZE_CLASSES[size];

    if (isCanalDoBrito(name)) {
      return (
        <span
          ref={ref}
          className={cn(
            "inline-flex items-center font-bold shrink-0 border bg-gradient-to-r transition-all duration-200 hover:scale-105 hover:brightness-110",
            sizeCls,
            "from-red-600/30 via-orange-600/25 to-amber-500/25 text-amber-200 border-amber-500/40 shadow-[0_0_14px_rgba(251,191,36,0.25)]",
            className
          )}
        >
          <img
            src="/canal_do_brito_logo.png"
            alt="Canal do Brito"
            className={cn("rounded-sm object-contain shrink-0", ICON_SIZE[size])}
          />
          {isMobile ? "Brito" : name}
        </span>
      );
    }

    const config = matchChannel(name);
    const displayName = isMobile && config.short ? config.short : name;

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-bold shrink-0 border bg-gradient-to-r transition-all duration-200 hover:scale-105 hover:brightness-110",
          sizeCls,
          config.gradient,
          config.text,
          config.border,
          config.glow,
          className
        )}
      >
        <ChannelIcon domain={config.domain} emoji={config.emoji} size={size} alt={`${name} logo`} />
        {displayName}
      </span>
    );
  }
);

ChannelBadge.displayName = "ChannelBadge";
