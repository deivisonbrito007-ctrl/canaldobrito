import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Build a deep-link URL for a specific public tab/section.
 * Used for sharing on WhatsApp Status so the recipient lands directly
 * on the right view (e.g. ao vivo, programação, destaques, novidades).
 */
export type PublicTab = "live" | "novidades" | "schedule";

/** Pretty path slugs used in shared URLs (WhatsApp Status, etc.). */
export const TAB_SLUGS: Record<PublicTab, string> = {
  live: "ao-vivo",
  novidades: "filmes-e-series",
  schedule: "programacao",
};

/** Reverse lookup: slug → tab id. Includes legacy aliases. */
export const SLUG_TO_TAB: Record<string, PublicTab> = {
  "ao-vivo": "live",
  "live": "live",
  "home": "live", // legacy
  "filmes-e-series": "novidades",
  "filmes": "novidades",
  "series": "novidades",
  "novidades": "novidades",
  "sugestoes": "novidades", // legacy
  "destaques": "novidades", // legacy
  "highlights": "novidades", // legacy
  "programacao": "schedule",
  "schedule": "schedule",
};

export interface DeepLinkOptions {
  /** When true, append UTM params for analytics tracking */
  utm?: boolean;
  /** When true, return a clean short link via /s/<slug> (preferred for sharing). */
  short?: boolean;
  source?: string;   // utm_source — default: "whatsapp"
  medium?: string;   // utm_medium — default: "status"
  campaign?: string; // utm_campaign — default: "share-<slug>"
  content?: string;  // utm_content — identifies the specific card/CTA clicked
}

/** Slugify free text for use as utm_content (lowercase, hyphenated, ASCII). */
export function slugifyUtm(text: string): string {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildDeepLink(base: string, tab?: PublicTab, opts: DeepLinkOptions = {}): string {
  const cleanBase = base.replace(/\/$/, "");

  // Preferred sharing format: /s/<slug> — short, clean, analytics handled by ShareRedirect
  if (opts.short) {
    const slug = tab ? TAB_SLUGS[tab] : "home";
    const path = `${cleanBase}/s/${slug}`;
    if (opts.content) {
      const tabPrefix = tab ? `${TAB_SLUGS[tab]}-` : "";
      const c = slugifyUtm(opts.content);
      const tagged = c.startsWith(tabPrefix) || /^(ab|tpl|quick|custom)-/.test(c)
        ? c : `${tabPrefix}${c}`;
      return `${path}?c=${tagged}`;
    }
    return path;
  }

  const path = tab ? `${cleanBase}/${TAB_SLUGS[tab]}` : (cleanBase || base);
  if (!opts.utm && !opts.content) return path;

  const params = new URLSearchParams({
    utm_source: opts.source ?? "whatsapp",
    utm_medium: opts.medium ?? "status",
    utm_campaign: opts.campaign ?? `share-${tab ? TAB_SLUGS[tab] : "home"}`,
  });
  if (opts.content) {
    const tabPrefix = tab ? `${TAB_SLUGS[tab]}-` : "";
    const slug = slugifyUtm(opts.content);
    params.set("utm_content", slug.startsWith(tabPrefix) ? slug : `${tabPrefix}${slug}`);
  }
  return `${path}?${params.toString()}`;
}
