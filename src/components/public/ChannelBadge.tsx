import React, { useState } from "react";
import { cn } from "@/lib/utils";

// ── Vite-imported logos: hashed filenames → cache-busting permanente.
// Trocar uma logo? Substitua o arquivo em src/assets/brand-logos/ — Vite gera novo hash automaticamente.
import bandLogo from "@/assets/brand-logos/band.png";
import cazetvLogo from "@/assets/brand-logos/cazetv.png";
import daznLogo from "@/assets/brand-logos/dazn.png";
import disneyLogo from "@/assets/brand-logos/disneyplus.png";
import espnLogo from "@/assets/brand-logos/espn.png";
import globoLogo from "@/assets/brand-logos/globo.png";
import globoplayLogo from "@/assets/brand-logos/globoplay.png";
import goatLogo from "@/assets/brand-logos/goat.png";
import maxLogo from "@/assets/brand-logos/max.png";
import netflixLogo from "@/assets/brand-logos/netflix.png";
import paramountLogo from "@/assets/brand-logos/paramountplus.png";
import premiereLogo from "@/assets/brand-logos/premiere.png";
import primeLogo from "@/assets/brand-logos/primevideo.png";
import recordLogo from "@/assets/brand-logos/record.png";
import spaceLogo from "@/assets/brand-logos/space.png";
import sportvLogo from "@/assets/brand-logos/sportv.png";
import tntLogo from "@/assets/brand-logos/tntsports.png";
import youtubeLogo from "@/assets/brand-logos/youtube.png";
import xsportsLogo from "@/assets/brand-logos/xsports.png";
import appletvLogo from "@/assets/brand-logos/appletv.svg";

type ChannelConfig = {
  emoji: string;
  text: string;
  border: string;
  gradient: string;
  glow: string;
  short?: string;
  /** Imported logo asset (Vite-hashed). Priority over emoji. */
  localLogo?: string;
  /** When true, render logo without white background (for already-light or white logos). */
  darkBg?: boolean;
};

const CHANNEL_MAP: Record<string, ChannelConfig> = {
  espn:         { emoji: "📺", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-red-700/20",         glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]",  localLogo: espnLogo },
  sportv:       { emoji: "⚽", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-600/30 to-emerald-700/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", localLogo: sportvLogo },
  globo:        { emoji: "🌐", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-300/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]", localLogo: globoLogo },
  premiere:     { emoji: "⭐", text: "text-yellow-300",  border: "border-yellow-500/40",  gradient: "from-yellow-500/30 to-amber-600/20",    glow: "shadow-[0_0_14px_rgba(234,179,8,0.25)]", localLogo: premiereLogo },
  "disney+":    { emoji: "✨", text: "text-blue-300",    border: "border-blue-600/40",    gradient: "from-blue-700/35 to-indigo-800/25",     glow: "shadow-[0_0_12px_rgba(29,78,216,0.2)]",  localLogo: disneyLogo, darkBg: true },
  cazétv:       { emoji: "🎮", text: "text-lime-300",    border: "border-lime-500/40",    gradient: "from-lime-500/30 to-green-600/20",      glow: "shadow-[0_0_12px_rgba(132,204,22,0.2)]", short: "Cazé", localLogo: cazetvLogo },
  cazetv:       { emoji: "🎮", text: "text-lime-300",    border: "border-lime-500/40",    gradient: "from-lime-500/30 to-green-600/20",      glow: "shadow-[0_0_12px_rgba(132,204,22,0.2)]", short: "Cazé", localLogo: cazetvLogo },
  tnt:          { emoji: "💥", text: "text-fuchsia-300", border: "border-fuchsia-500/40", gradient: "from-fuchsia-600/30 to-purple-700/20",  glow: "shadow-[0_0_12px_rgba(217,70,239,0.2)]", localLogo: tntLogo },
  "prime video":{ emoji: "▶️", text: "text-sky-300",     border: "border-sky-500/40",     gradient: "from-sky-500/30 to-blue-600/20",        glow: "shadow-[0_0_12px_rgba(14,165,233,0.2)]", short: "Prime", localLogo: primeLogo, darkBg: true },
  paramount:    { emoji: "⛰️", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-indigo-700/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "Param+", localLogo: paramountLogo, darkBg: true },
  "paramount+": { emoji: "⛰️", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-indigo-700/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "Param+", localLogo: paramountLogo, darkBg: true },
  netflix:      { emoji: "🎞️", text: "text-red-300",     border: "border-red-600/40",     gradient: "from-red-700/30 to-red-900/20",         glow: "shadow-[0_0_12px_rgba(220,38,38,0.25)]", localLogo: netflixLogo, darkBg: true },
  apple:        { emoji: "🍎", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-200/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]", short: "Apple TV", localLogo: appletvLogo, darkBg: true },
  "apple tv":   { emoji: "🍎", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-200/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]", short: "Apple", localLogo: appletvLogo, darkBg: true },
  globoplay:    { emoji: "▶️", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-rose-700/20",        glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]", short: "Gplay", localLogo: globoplayLogo, darkBg: true },
  band:         { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", localLogo: bandLogo },
  bandsports:   { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", short: "BandSp", localLogo: bandLogo },
  bandplay:     { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", localLogo: bandLogo },
  max:          { emoji: "🎬", text: "text-purple-300",  border: "border-purple-500/40",  gradient: "from-purple-700/30 to-violet-800/20",   glow: "shadow-[0_0_12px_rgba(147,51,234,0.2)]", localLogo: maxLogo, darkBg: true },
  "hbo max":    { emoji: "🎬", text: "text-purple-300",  border: "border-purple-500/40",  gradient: "from-purple-700/30 to-violet-800/20",   glow: "shadow-[0_0_12px_rgba(147,51,234,0.2)]", short: "HBO", localLogo: maxLogo, darkBg: true },
  record:       { emoji: "📺", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-500/30 to-indigo-600/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", localLogo: recordLogo },
  sbt:          { emoji: "📺", text: "text-pink-300",    border: "border-pink-500/40",    gradient: "from-pink-500/30 to-fuchsia-600/20",    glow: "shadow-[0_0_12px_rgba(236,72,153,0.2)]" },
  "canal goat": { emoji: "🐐", text: "text-amber-300",   border: "border-amber-500/40",   gradient: "from-amber-500/30 to-orange-600/20",    glow: "shadow-[0_0_12px_rgba(245,158,11,0.2)]", short: "GOAT", localLogo: goatLogo },
  "ge tv":      { emoji: "📱", text: "text-orange-300",  border: "border-orange-500/40",  gradient: "from-orange-500/30 to-amber-600/20",    glow: "shadow-[0_0_12px_rgba(249,115,22,0.2)]", short: "ge" },
  space:        { emoji: "🚀", text: "text-indigo-300",  border: "border-indigo-500/40",  gradient: "from-indigo-500/30 to-purple-600/20",   glow: "shadow-[0_0_12px_rgba(99,102,241,0.2)]", localLogo: spaceLogo, darkBg: true },
  "esporte na band": { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", short: "Band YT", localLogo: bandLogo },
  youtube:      { emoji: "▶️", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-red-700/20",         glow: "shadow-[0_0_12px_rgba(239,68,68,0.25)]", short: "YT", localLogo: youtubeLogo },
  dazn:         { emoji: "🥊", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-700/40 to-slate-900/30",   glow: "shadow-[0_0_12px_rgba(148,163,184,0.2)]", localLogo: daznLogo, darkBg: true },
  nsports:      { emoji: "🏆", text: "text-cyan-300",    border: "border-cyan-500/40",    gradient: "from-cyan-500/30 to-sky-600/20",        glow: "shadow-[0_0_12px_rgba(6,182,212,0.2)]" },
  "x sports":   { emoji: "❌", text: "text-red-400",     border: "border-red-500/40",     gradient: "from-red-600/30 to-rose-700/20",        glow: "shadow-[0_0_12px_rgba(239,68,68,0.25)]",  short: "X Sports", localLogo: xsportsLogo, darkBg: true },
  xsports:      { emoji: "❌", text: "text-red-400",     border: "border-red-500/40",     gradient: "from-red-600/30 to-rose-700/20",        glow: "shadow-[0_0_12px_rgba(239,68,68,0.25)]",  short: "X Sports", localLogo: xsportsLogo, darkBg: true },
  combate:      { emoji: "🥋", text: "text-red-300",     border: "border-red-600/40",     gradient: "from-red-700/30 to-rose-800/20",        glow: "shadow-[0_0_12px_rgba(220,38,38,0.25)]" },
  "canal do benja": { emoji: "🎙️", text: "text-orange-300", border: "border-orange-500/40", gradient: "from-orange-500/30 to-amber-600/20", glow: "shadow-[0_0_12px_rgba(249,115,22,0.2)]", short: "Benja", localLogo: youtubeLogo },
  onefootball:  { emoji: "⚽", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-600/30 to-teal-700/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", short: "OneFt" },
  redetv:       { emoji: "📺", text: "text-rose-300",    border: "border-rose-500/40",    gradient: "from-rose-500/30 to-red-600/20",        glow: "shadow-[0_0_12px_rgba(244,63,94,0.2)]", short: "RedeTV" },
  "redetv!":    { emoji: "📺", text: "text-rose-300",    border: "border-rose-500/40",    gradient: "from-rose-500/30 to-red-600/20",        glow: "shadow-[0_0_12px_rgba(244,63,94,0.2)]", short: "RedeTV" },
  "league pass":{ emoji: "🏀", text: "text-orange-300",  border: "border-orange-500/40",  gradient: "from-orange-500/30 to-red-600/20",      glow: "shadow-[0_0_12px_rgba(249,115,22,0.25)]", short: "NBA LP" },
  nba:          { emoji: "🏀", text: "text-orange-300",  border: "border-orange-500/40",  gradient: "from-orange-500/30 to-red-600/20",      glow: "shadow-[0_0_12px_rgba(249,115,22,0.25)]" },
  sportynet:    { emoji: "🏆", text: "text-cyan-300",    border: "border-cyan-500/40",    gradient: "from-cyan-500/30 to-sky-600/20",        glow: "shadow-[0_0_12px_rgba(6,182,212,0.2)]", short: "SNet" },
  snet:         { emoji: "🏆", text: "text-cyan-300",    border: "border-cyan-500/40",    gradient: "from-cyan-500/30 to-sky-600/20",        glow: "shadow-[0_0_12px_rgba(6,182,212,0.2)]" },
  "tv aratu":   { emoji: "📡", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-500/30 to-indigo-600/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "Aratu" },
  "tv jornal":  { emoji: "📡", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-500/30 to-indigo-600/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "TVJ" },
};

const FALLBACK: ChannelConfig = {
  emoji: "📺",
  text: "text-muted-foreground",
  border: "border-border/30",
  gradient: "from-secondary/40 to-secondary/20",
  glow: "",
};

const normalizeKey = (s: string) =>
  s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-_!+]/g, "")
    .trim();

const NORMALIZED_MAP: Record<string, ChannelConfig> = Object.fromEntries(
  Object.entries(CHANNEL_MAP).map(([k, v]) => [normalizeKey(k), v])
);

function matchChannel(name: string): ChannelConfig {
  const key = normalizeKey(name);
  if (!key) return FALLBACK;
  if (NORMALIZED_MAP[key]) return NORMALIZED_MAP[key];
  for (const [k, v] of Object.entries(NORMALIZED_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return FALLBACK;
}

function isCanalDoBrito(name: string) {
  const n = name.toLowerCase();
  return n.includes("canal do brito") || n.includes("brito");
}

type BadgeSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "text-[10px] px-2 py-1 gap-1.5 rounded-md",
  md: "text-[11px] px-2.5 py-1.5 gap-1.5 rounded-lg",
  lg: "text-xs px-3 py-2 gap-2 rounded-lg",
};

const ICON_SIZE: Record<BadgeSize, string> = {
  sm: "h-4 w-6",
  md: "h-5 w-8",
  lg: "h-7 w-11",
};

const ICON_WRAP: Record<BadgeSize, string> = {
  sm: "h-5 w-7 p-[2px] rounded-[5px]",
  md: "h-6 w-9 p-[2px] rounded-md",
  lg: "h-8 w-12 p-[2px] rounded-md",
};

interface ChannelBadgeProps {
  name: string;
  size?: BadgeSize;
  className?: string;
}

/** Determinístico: localLogo (hash do Vite) → emoji. Sem favicons externos. */
const ChannelIcon = ({
  localLogo,
  emoji,
  size,
  alt,
  darkBg,
}: { localLogo?: string; emoji: string; size: BadgeSize; alt: string; darkBg?: boolean }) => {
  const [failed, setFailed] = useState(false);

  if (!localLogo || failed) {
    return <span className="leading-none">{emoji}</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        ICON_WRAP[size],
        darkBg ? "bg-transparent" : "bg-white/95"
      )}
    >
      <img
        src={localLogo}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("object-contain", ICON_SIZE[size])}
      />
    </span>
  );
};

export const ChannelBadge = React.forwardRef<HTMLSpanElement, ChannelBadgeProps>(
  ({ name, size = "md", className }, ref) => {
    const sizeCls = SIZE_CLASSES[size];

    if (isCanalDoBrito(name)) {
      return (
        <span
          ref={ref}
          className={cn(
            "inline-flex items-center font-bold shrink-0 border bg-gradient-to-r transition-all duration-200 hover:scale-105 hover:brightness-110 whitespace-nowrap",
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
          Canal do Brito
        </span>
      );
    }

    const config = matchChannel(name);

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-bold shrink-0 border bg-gradient-to-r transition-all duration-200 hover:scale-105 hover:brightness-110 whitespace-nowrap",
          sizeCls,
          config.gradient,
          config.text,
          config.border,
          config.glow,
          className
        )}
      >
        <ChannelIcon
          localLogo={config.localLogo}
          emoji={config.emoji}
          size={size}
          alt={`${name} logo`}
          darkBg={config.darkBg}
        />
        {name}
      </span>
    );
  }
);

ChannelBadge.displayName = "ChannelBadge";
