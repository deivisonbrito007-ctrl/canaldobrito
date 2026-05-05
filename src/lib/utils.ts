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
export type PublicTab = "live" | "novidades" | "highlights" | "schedule";

/** Pretty path slugs used in shared URLs (WhatsApp Status, etc.). */
export const TAB_SLUGS: Record<PublicTab, string> = {
  live: "ao-vivo",
  novidades: "novidades",
  highlights: "sugestoes",
  schedule: "programacao",
};

/** Reverse lookup: slug → tab id. Includes legacy aliases. */
export const SLUG_TO_TAB: Record<string, PublicTab> = {
  "ao-vivo": "live",
  "novidades": "novidades",
  "sugestoes": "highlights",
  "destaques": "highlights", // legacy
  "programacao": "schedule",
  "home": "live", // legacy
  "live": "live",
  "highlights": "highlights",
  "schedule": "schedule",
};

export function buildDeepLink(base: string, tab?: PublicTab): string {
  const cleanBase = base.replace(/\/$/, "");
  if (!tab) return cleanBase || base;
  return `${cleanBase}/${TAB_SLUGS[tab]}`;
}
