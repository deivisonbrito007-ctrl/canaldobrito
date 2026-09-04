import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { withCacheBust } from "@/lib/cacheBust";
import { LOGO_REGISTRY, normalizeChannelName, channelInitials, type LogoKey } from "./channelLogos";
import { useChannelMappings } from "@/hooks/useChannelMappings";

declare const __APP_VERSION__: string;

type ChannelConfig = {
  emoji: string;
  text: string;
  border: string;
  gradient: string;
  glow: string;
  short?: string;
  /** Chave da logo no LOGO_REGISTRY. */
  logoKey?: LogoKey;
};

const CHANNEL_MAP: Record<string, ChannelConfig> = {
  espn:         { emoji: "📺", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-red-700/20",         glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]",  logoKey: "espn" },
  sportv:       { emoji: "⚽", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-600/30 to-emerald-700/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", logoKey: "sportv" },
  globo:        { emoji: "🌐", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-300/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]", logoKey: "globo" },
  premiere:     { emoji: "⭐", text: "text-yellow-300",  border: "border-yellow-500/40",  gradient: "from-yellow-500/30 to-amber-600/20",    glow: "shadow-[0_0_14px_rgba(234,179,8,0.25)]", logoKey: "premiere" },
  "disney+":    { emoji: "✨", text: "text-blue-300",    border: "border-blue-600/40",    gradient: "from-blue-700/35 to-indigo-800/25",     glow: "shadow-[0_0_12px_rgba(29,78,216,0.2)]",  logoKey: "disney" },
  cazétv:       { emoji: "🎮", text: "text-lime-300",    border: "border-lime-500/40",    gradient: "from-lime-500/30 to-green-600/20",      glow: "shadow-[0_0_12px_rgba(132,204,22,0.2)]", short: "Cazé", logoKey: "cazetv" },
  cazetv:       { emoji: "🎮", text: "text-lime-300",    border: "border-lime-500/40",    gradient: "from-lime-500/30 to-green-600/20",      glow: "shadow-[0_0_12px_rgba(132,204,22,0.2)]", short: "Cazé", logoKey: "cazetv" },
  tnt:          { emoji: "💥", text: "text-fuchsia-300", border: "border-fuchsia-500/40", gradient: "from-fuchsia-600/30 to-purple-700/20",  glow: "shadow-[0_0_12px_rgba(217,70,239,0.2)]", logoKey: "tnt" },
  "prime video":{ emoji: "▶️", text: "text-sky-300",     border: "border-sky-500/40",     gradient: "from-sky-500/30 to-blue-600/20",        glow: "shadow-[0_0_12px_rgba(14,165,233,0.2)]", short: "Prime", logoKey: "prime" },
  paramount:    { emoji: "⛰️", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-indigo-700/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "Param+", logoKey: "paramount" },
  "paramount+": { emoji: "⛰️", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-indigo-700/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "Param+", logoKey: "paramount" },
  netflix:      { emoji: "🎞️", text: "text-red-300",     border: "border-red-600/40",     gradient: "from-red-700/30 to-red-900/20",         glow: "shadow-[0_0_12px_rgba(220,38,38,0.25)]", logoKey: "netflix" },
  apple:        { emoji: "🍎", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-200/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]", short: "Apple TV", logoKey: "apple" },
  "apple tv":   { emoji: "🍎", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-200/20 to-slate-400/10",   glow: "shadow-[0_0_10px_rgba(226,232,240,0.15)]", short: "Apple", logoKey: "apple" },
  globoplay:    { emoji: "▶️", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-rose-700/20",        glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]", short: "Gplay", logoKey: "globoplay" },
  band:         { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", logoKey: "band" },
  bandsports:   { emoji: "📡", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-red-700/20",         glow: "shadow-[0_0_12px_rgba(239,68,68,0.2)]", short: "BandSp", logoKey: "bandsports" },
  bandplay:     { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", logoKey: "band" },
  max:          { emoji: "🎬", text: "text-purple-300",  border: "border-purple-500/40",  gradient: "from-purple-700/30 to-violet-800/20",   glow: "shadow-[0_0_12px_rgba(147,51,234,0.2)]", logoKey: "max" },
  "hbo max":    { emoji: "🎬", text: "text-purple-300",  border: "border-purple-500/40",  gradient: "from-purple-700/30 to-violet-800/20",   glow: "shadow-[0_0_12px_rgba(147,51,234,0.2)]", short: "HBO", logoKey: "max" },
  record:       { emoji: "📺", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-500/30 to-indigo-600/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", logoKey: "record" },
  sbt:          { emoji: "📺", text: "text-pink-300",    border: "border-pink-500/40",    gradient: "from-pink-500/30 to-fuchsia-600/20",    glow: "shadow-[0_0_12px_rgba(236,72,153,0.2)]", logoKey: "sbt" },
  "canal goat": { emoji: "🐐", text: "text-amber-300",   border: "border-amber-500/40",   gradient: "from-amber-500/30 to-orange-600/20",    glow: "shadow-[0_0_12px_rgba(245,158,11,0.2)]", short: "GOAT", logoKey: "goat" },
  "ge tv":      { emoji: "📱", text: "text-orange-300",  border: "border-orange-500/40",  gradient: "from-orange-500/30 to-amber-600/20",    glow: "shadow-[0_0_12px_rgba(249,115,22,0.2)]", short: "ge" },
  space:        { emoji: "🚀", text: "text-indigo-300",  border: "border-indigo-500/40",  gradient: "from-indigo-500/30 to-purple-600/20",   glow: "shadow-[0_0_12px_rgba(99,102,241,0.2)]", logoKey: "space" },
  "esporte na band": { emoji: "📡", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", short: "Band YT", logoKey: "band" },
  youtube:      { emoji: "▶️", text: "text-red-300",     border: "border-red-500/40",     gradient: "from-red-600/30 to-red-700/20",         glow: "shadow-[0_0_12px_rgba(239,68,68,0.25)]", short: "YT", logoKey: "youtube" },
  dazn:         { emoji: "🥊", text: "text-foreground/90", border: "border-foreground/20", gradient: "from-slate-700/40 to-slate-900/30",   glow: "shadow-[0_0_12px_rgba(148,163,184,0.2)]", logoKey: "dazn" },
  nsports:      { emoji: "🏆", text: "text-emerald-300", border: "border-emerald-500/40", gradient: "from-emerald-500/30 to-teal-600/20",    glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", logoKey: "nsports" },
  "x sports":   { emoji: "❌", text: "text-red-400",     border: "border-red-500/40",     gradient: "from-red-600/30 to-rose-700/20",        glow: "shadow-[0_0_12px_rgba(239,68,68,0.25)]",  short: "X Sports", logoKey: "xsports" },
  xsports:      { emoji: "❌", text: "text-red-400",     border: "border-red-500/40",     gradient: "from-red-600/30 to-rose-700/20",        glow: "shadow-[0_0_12px_rgba(239,68,68,0.25)]",  short: "X Sports", logoKey: "xsports" },
  combate:      { emoji: "🥋", text: "text-red-300",     border: "border-red-600/40",     gradient: "from-red-700/30 to-rose-800/20",        glow: "shadow-[0_0_12px_rgba(220,38,38,0.25)]", logoKey: "combate" },
  "canal do benja": { emoji: "🎙️", text: "text-cyan-300", border: "border-cyan-500/40", gradient: "from-cyan-500/30 to-blue-600/20", glow: "shadow-[0_0_12px_rgba(6,182,212,0.25)]", short: "Benja", logoKey: "benja" },
  onefootball:  { emoji: "⚽", text: "text-lime-300",    border: "border-lime-500/40",    gradient: "from-lime-500/30 to-green-600/20",      glow: "shadow-[0_0_12px_rgba(132,204,22,0.25)]", short: "OneFt", logoKey: "onefootball" },
  redetv:       { emoji: "📺", text: "text-cyan-300",    border: "border-cyan-500/40",    gradient: "from-cyan-500/30 to-blue-600/20",       glow: "shadow-[0_0_12px_rgba(6,182,212,0.2)]", short: "RedeTV", logoKey: "redetv" },
  "redetv!":    { emoji: "📺", text: "text-cyan-300",    border: "border-cyan-500/40",    gradient: "from-cyan-500/30 to-blue-600/20",       glow: "shadow-[0_0_12px_rgba(6,182,212,0.2)]", short: "RedeTV", logoKey: "redetv" },
  "league pass":{ emoji: "🏀", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-red-600/20",        glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)]", short: "NBA LP", logoKey: "nbalp" },
  "nba league pass":{ emoji: "🏀", text: "text-blue-300", border: "border-blue-500/40",   gradient: "from-blue-600/30 to-red-600/20",        glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)]", short: "NBA LP", logoKey: "nbalp" },
  nba:          { emoji: "🏀", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-600/30 to-red-600/20",        glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)]", logoKey: "nbalp" },
  sportynet:    { emoji: "🏆", text: "text-rose-300",    border: "border-rose-500/40",    gradient: "from-rose-500/30 to-red-600/20",        glow: "shadow-[0_0_12px_rgba(244,63,94,0.25)]", short: "SNet", logoKey: "snet" },
  snet:         { emoji: "🏆", text: "text-rose-300",    border: "border-rose-500/40",    gradient: "from-rose-500/30 to-red-600/20",        glow: "shadow-[0_0_12px_rgba(244,63,94,0.25)]", logoKey: "snet" },
  "tv aratu":   { emoji: "📡", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-500/30 to-indigo-600/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "Aratu" },
  "tv jornal":  { emoji: "📡", text: "text-blue-300",    border: "border-blue-500/40",    gradient: "from-blue-500/30 to-indigo-600/20",     glow: "shadow-[0_0_12px_rgba(59,130,246,0.2)]", short: "TVJ" },
};

export const BUILTIN_CHANNEL_MAP = CHANNEL_MAP;

const FALLBACK: ChannelConfig = {
  emoji: "📺",
  text: "text-muted-foreground",
  border: "border-border/30",
  gradient: "from-secondary/40 to-secondary/20",
  glow: "",
};

const NORMALIZED_MAP: Record<string, ChannelConfig> = Object.fromEntries(
  Object.entries(CHANNEL_MAP).map(([k, v]) => [normalizeChannelName(k), v])
);

/** Chaves ordenadas do mais longo para o mais curto: match determinístico. */
const SORTED_ENTRIES: Array<[string, ChannelConfig]> = Object.entries(NORMALIZED_MAP)
  .filter(([k]) => k.length >= 4)
  .sort((a, b) => b[0].length - a[0].length);

const MIN_FUZZY_LEN = 4;

function exact(key: string): ChannelConfig | undefined {
  return key ? NORMALIZED_MAP[key] : undefined;
}

/** Resolve marca base: exato -> sem sufixo numérico (SporTV 2) -> substring longa. */
function resolveBase(key: string): ChannelConfig | undefined {
  if (!key) return undefined;
  const hit = exact(key);
  if (hit) return hit;

  const stripped = key.replace(/\d+$/, "");
  if (stripped && stripped !== key) {
    const numbered = exact(stripped);
    if (numbered) return numbered;
  }

  if (key.length < MIN_FUZZY_LEN) return undefined;
  for (const [k, v] of SORTED_ENTRIES) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return undefined;
}

/** "YouTube CazéTV" -> logo da CazéTV; "YouTube Metrópoles" -> logo do YouTube. */
function resolveWithYoutube(key: string): ChannelConfig | undefined {
  const direct = exact(key);
  if (direct) return direct;
  if (key.startsWith("youtube") && key.length > "youtube".length) {
    const rest = key.slice("youtube".length);
    return resolveBase(rest) ?? NORMALIZED_MAP["youtube"];
  }
  return resolveBase(key);
}

/**
 * Retorna true se o canal é reconhecido: existe no registro embutido (fuzzy)
 * ou no mapa de mapeamentos/apelidos cadastrados pelo admin.
 */
export function isKnownChannel(name: string, mappings?: Map<string, unknown> | null): boolean {
  const key = normalizeChannelName(name);
  if (!key) return false;
  if (mappings?.has(key)) return true;
  return !!resolveWithYoutube(key);
}

function matchChannel(name: string, overrideLogoKey?: LogoKey, overrideShort?: string | null): ChannelConfig {
  const key = normalizeChannelName(name);
  const base: ChannelConfig = resolveWithYoutube(key) ?? FALLBACK;

  if (overrideLogoKey && overrideLogoKey !== "none") {
    return { ...base, logoKey: overrideLogoKey, short: overrideShort ?? base.short };
  }
  if (overrideLogoKey === "none") {
    return { ...base, logoKey: undefined, short: overrideShort ?? base.short };
  }
  return base;
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

const ICON_WRAP: Record<BadgeSize, string> = {
  sm: "h-5 w-5 rounded-[5px] p-[2px]",
  md: "h-7 w-7 rounded-md p-[3px]",
  lg: "h-9 w-9 rounded-md p-1",
};

interface ChannelBadgeProps {
  name: string;
  size?: BadgeSize;
  className?: string;
}

const INITIALS_TEXT: Record<BadgeSize, string> = {
  sm: "text-[8px]",
  md: "text-[9px]",
  lg: "text-[10px]",
};

const ChannelIcon = ({
  logoKey,
  emoji,
  size,
  alt,
  channelName,
  customUrl,
  forceLightChip,
  version,
}: {
  logoKey?: LogoKey;
  emoji: string;
  size: BadgeSize;
  alt: string;
  channelName: string;
  customUrl?: string | null;
  forceLightChip?: boolean;
  version?: string | null;
}) => {
  const [failed, setFailed] = useState(false);
  const registryEntry = logoKey && logoKey !== "none" ? LOGO_REGISTRY[logoKey] : undefined;
  const rawSrc = customUrl || registryEntry?.src;
  // Cache-bust: custom uploads use the row's updated_at so changes propagate
  // without a manual refresh; built-in assets use the build-time version
  // stamp so a deploy invalidates aggressively cached entries.
  const stamp = customUrl
    ? version
    : (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : null);
  const src = withCacheBust(rawSrc, stamp) ?? undefined;
  const lightChip = forceLightChip ?? registryEntry?.lightChip;

  if (!src || failed) {
    // Sem arte disponível: chip de iniciais (mais legível que o emoji genérico).
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0 leading-none font-extrabold tracking-tight",
          "bg-white/10 ring-1 ring-white/10",
          ICON_WRAP[size],
          INITIALS_TEXT[size]
        )}
        title={channelName}
        aria-hidden
      >
        {channelInitials(channelName) || emoji}
      </span>
    );
  }


  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-white/10",
        ICON_WRAP[size],
        lightChip ? "bg-white/95" : "bg-white/5"
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="max-h-full max-w-full object-contain"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </span>
  );
};

export const ChannelBadge = React.forwardRef<HTMLSpanElement, ChannelBadgeProps>(
  ({ name, size = "md", className }, ref) => {
    const sizeCls = SIZE_CLASSES[size];
    const { data: overrides } = useChannelMappings();

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
          <span className={cn("inline-flex items-center justify-center shrink-0 overflow-hidden", ICON_WRAP[size])}>
            <img
              src="/canal_do_brito_logo.png"
              alt="Canal do Brito"
              className="h-full w-full object-contain"
            />
          </span>
          Canal do Brito
        </span>
      );
    }

    const override = overrides?.get(normalizeChannelName(name));
    const config = matchChannel(name, override?.logo_key, override?.short);

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
          logoKey={config.logoKey}
          emoji={config.emoji}
          size={size}
          alt={`${name} logo`}
          channelName={name}
          customUrl={override?.custom_logo_url}
          forceLightChip={override?.light_chip}
          version={override?.updated_at}
        />
        {name}
      </span>
    );
  }
);

ChannelBadge.displayName = "ChannelBadge";
