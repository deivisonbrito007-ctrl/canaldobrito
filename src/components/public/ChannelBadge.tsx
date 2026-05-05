import React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type ChannelConfig = {
  emoji: string;
  text: string;
  border: string;
  gradient: string;
  glow: string;
  short?: string;
};

const CHANNEL_MAP: Record<string, ChannelConfig> = {
  espn:         { emoji: "📺", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-red-700/20",         glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]" },
  sportv:       { emoji: "⚽", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-600/30 to-emerald-700/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]" },
  globo:        { emoji: "🌐", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-300/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]" },
  premiere:     { emoji: "⭐", text: "text-yellow-300",  border: "border-yellow-500/40",  gradient: "from-yellow-500/30 to-amber-600/20",    glow: "shadow-[0_0_14px_rgba(234,179,8,0.25)]" },
  "disney+":    { emoji: "✨", text: "text-blue-300",    border: "border-blue-600/40",    gradient: "from-blue-700/35 to-indigo-800/25",     glow: "shadow-[0_0_12px_rgba(29,78,216,0.2)]" },
  cazétv:       { emoji: "🎮", text: "text-lime-300",    border: "border-lime-500/40",    gradient: "from-lime-500/30 to-green-600/20",      glow: "shadow-[0_0_12px_rgba(132,204,22,0.2)]" },
  cazetv:       { emoji: "🎮", text: "text-lime-300",    border: "border-lime-500/40",    gradient: "from-lime-500/30 to-green-600/20",      glow: "shadow-[0_0_12px_rgba(132,204,22,0.2)]" },
  tnt:          { emoji: "💥", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-cyan-700/20",       glow: "shadow-[0_0_12px_rgba(37,99,235,0.2)]" },
  "prime video":{ emoji: "▶️", text: "text-sky-300",     border: "border-sky-500/40",     gradient: "from-sky-500/30 to-blue-600/20",        glow: "shadow-[0_0_12px_rgba(14,165,233,0.2)]", short: "Prime" },
  band:         { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]" },
  bandsports:   { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", short: "BandSp" },
  bandplay:     { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]" },
  max:          { emoji: "🎬", text: "text-purple-300",  border: "border-purple-500/40",  gradient: "from-purple-700/30 to-violet-800/20",   glow: "shadow-[0_0_12px_rgba(147,51,234,0.2)]" },
  "hbo max":    { emoji: "🎬", text: "text-purple-300",  border: "border-purple-500/40",  gradient: "from-purple-700/30 to-violet-800/20",   glow: "shadow-[0_0_12px_rgba(147,51,234,0.2)]", short: "HBO" },
  record:       { emoji: "📺", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-500/30 to-indigo-600/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]" },
  "canal goat": { emoji: "🐐", text: "text-amber-300",   border: "border-amber-500/40",   gradient: "from-amber-500/30 to-orange-600/20",    glow: "shadow-[0_0_12px_rgba(245,158,11,0.2)]", short: "GOAT" },
  "ge tv":      { emoji: "📱", text: "text-orange-300",  border: "border-orange-500/40",  gradient: "from-orange-500/30 to-amber-600/20",    glow: "shadow-[0_0_12px_rgba(249,115,22,0.2)]", short: "ge" },
  space:        { emoji: "🚀", text: "text-indigo-300",  border: "border-indigo-500/40",  gradient: "from-indigo-500/30 to-purple-600/20",   glow: "shadow-[0_0_12px_rgba(99,102,241,0.2)]" },
  "esporte na band": { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", short: "Band YT" },
  youtube:      { emoji: "▶️", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-red-700/20",         glow: "shadow-[0_0_12px_rgba(239,68,68,0.25)]", short: "YT" },
  dazn:         { emoji: "🥊", text: "text-yellow-300",  border: "border-yellow-500/40",  gradient: "from-yellow-500/30 to-amber-600/20",    glow: "shadow-[0_0_12px_rgba(234,179,8,0.2)]" },
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
  sm: "text-[9px] px-1.5 py-0.5 gap-0.5 rounded-md",
  md: "text-[10px] px-2 py-1 gap-1 rounded-lg",
  lg: "text-[11px] px-2.5 py-1.5 gap-1.5 rounded-lg",
};

interface ChannelBadgeProps {
  name: string;
  size?: BadgeSize;
  className?: string;
}

export const ChannelBadge = React.forwardRef<HTMLSpanElement, ChannelBadgeProps>(
  ({ name, size = "md", className }, ref) => {
    const isMobile = useIsMobile();
    const sizeCls = SIZE_CLASSES[size];

    if (isCanalDoBrito(name)) {
      const logoSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
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
            className={cn("rounded-sm object-contain", logoSize)}
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
        <span className="leading-none">{config.emoji}</span>
        {displayName}
      </span>
    );
  }
);

ChannelBadge.displayName = "ChannelBadge";
