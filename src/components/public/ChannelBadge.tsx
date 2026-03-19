import React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type ChannelConfig = {
  emoji: string;
  bg: string;
  text: string;
  border: string;
  short?: string;
};

const CHANNEL_MAP: Record<string, ChannelConfig> = {
  espn:         { emoji: "📺", bg: "bg-red-600/20",     text: "text-red-400",     border: "border-red-500/30" },
  sportv:       { emoji: "⚽", bg: "bg-emerald-600/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  globo:        { emoji: "🌐", bg: "bg-slate-200/15",   text: "text-foreground/80", border: "border-foreground/20" },
  premiere:     { emoji: "⭐", bg: "bg-yellow-500/20",  text: "text-yellow-400",  border: "border-yellow-500/30" },
  "disney+":    { emoji: "✨", bg: "bg-blue-800/25",    text: "text-blue-300",    border: "border-blue-600/30" },
  cazétv:       { emoji: "🎮", bg: "bg-lime-500/20",    text: "text-lime-400",    border: "border-lime-500/30" },
  cazetv:       { emoji: "🎮", bg: "bg-lime-500/20",    text: "text-lime-400",    border: "border-lime-500/30" },
  tnt:          { emoji: "💥", bg: "bg-blue-600/20",    text: "text-blue-400",    border: "border-blue-500/30" },
  "prime video":{ emoji: "▶️", bg: "bg-sky-500/20",     text: "text-sky-400",     border: "border-sky-500/30", short: "Prime" },
  band:         { emoji: "📡", bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  bandsports:   { emoji: "📡", bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", short: "BandSp" },
  bandplay:     { emoji: "📡", bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  max:          { emoji: "🎬", bg: "bg-purple-700/20",  text: "text-purple-400",  border: "border-purple-500/30" },
  "hbo max":    { emoji: "🎬", bg: "bg-purple-700/20",  text: "text-purple-400",  border: "border-purple-500/30", short: "HBO" },
  record:       { emoji: "📺", bg: "bg-blue-500/20",    text: "text-blue-400",    border: "border-blue-500/30" },
  "canal goat": { emoji: "🐐", bg: "bg-amber-500/20",  text: "text-amber-400",   border: "border-amber-500/30", short: "GOAT" },
  "ge tv":      { emoji: "📱", bg: "bg-orange-500/20",  text: "text-orange-400",  border: "border-orange-500/30", short: "ge" },
  space:        { emoji: "🚀", bg: "bg-indigo-500/20",  text: "text-indigo-400",  border: "border-indigo-500/30" },
  "esporte na band": { emoji: "📡", bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", short: "Band YT" },
};

const FALLBACK: ChannelConfig = {
  emoji: "📺",
  bg: "bg-secondary/40",
  text: "text-muted-foreground",
  border: "border-border/20",
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
  return name.toLowerCase().includes("canal do brito") || name.toLowerCase().includes("brito");
}

interface ChannelBadgeProps {
  name: string;
  className?: string;
}

export const ChannelBadge = ({ name, className }: ChannelBadgeProps) => {
  const isMobile = useIsMobile();

  if (isCanalDoBrito(name)) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg shrink-0",
          "bg-gradient-to-r from-red-600/25 to-amber-500/20 text-amber-300",
          "border border-amber-500/40 shadow-[0_0_8px_hsl(40,80%,50%,0.15)]",
          className
        )}
      >
        <img
          src="/canal_do_brito_logo.png"
          alt="Canal do Brito"
          className="h-3.5 w-3.5 rounded-sm object-contain"
        />
        {isMobile ? "Brito" : name}
      </span>
    );
  }

  const config = matchChannel(name);
  const displayName = isMobile && config.short ? config.short : name;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg shrink-0 border",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className="text-[9px] leading-none">{config.emoji}</span>
      {displayName}
    </span>
  );
};
