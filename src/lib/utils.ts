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

export function buildDeepLink(base: string, tab?: PublicTab): string {
  const cleanBase = base.replace(/\/$/, "");
  if (!tab) return cleanBase || base;
  return `${cleanBase}/?tab=${tab}`;
}
