/**
 * Lightweight UTM-aware analytics tracker.
 * - Captures utm_* params from the URL on load and persists them (sessionStorage).
 * - Emits a `analytics:track` CustomEvent on window for in-app listeners.
 * - Forwards to gtag / plausible / posthog / dataLayer if present (no hard dep).
 */

import { SLUG_TO_TAB, TAB_SLUGS, type PublicTab } from "@/lib/utils";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

const ATTRIBUTION_KEY = "cb:last_attribution";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
    posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  }
}

export function readUtmsFromUrl(search = window.location.search): UtmParams {
  const p = new URLSearchParams(search);
  const out: UtmParams = {};
  (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const).forEach((k) => {
    const v = p.get(k);
    if (v) out[k] = v;
  });
  return out;
}

/** Best-effort dispatch to whichever analytics provider is present. */
export function track(eventName: string, props: Record<string, unknown> = {}): void {
  try {
    window.dispatchEvent(new CustomEvent("analytics:track", { detail: { event: eventName, props } }));
  } catch { /* noop */ }

  try { window.gtag?.("event", eventName, props); } catch { /* noop */ }
  try { window.dataLayer?.push({ event: eventName, ...props }); } catch { /* noop */ }
  try { window.plausible?.(eventName, { props }); } catch { /* noop */ }
  try { window.posthog?.capture(eventName, props); } catch { /* noop */ }

  if (import.meta.env.DEV) {
     
    console.debug("[analytics]", eventName, props);
  }
}

/**
 * Resolve which public tab the URL is targeting, combining:
 * - pathname slug (e.g. /ao-vivo)
 * - legacy ?tab= param
 * - utm_campaign convention `share-<slug>`
 */
export function resolveTabFromUrl(): PublicTab | null {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (path && SLUG_TO_TAB[path]) return SLUG_TO_TAB[path];

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("tab")?.toLowerCase();
  if (fromQuery && SLUG_TO_TAB[fromQuery]) return SLUG_TO_TAB[fromQuery];

  const campaign = params.get("utm_campaign")?.toLowerCase() ?? "";
  const m = campaign.match(/^share-([a-z-]+)$/);
  if (m && SLUG_TO_TAB[m[1]]) return SLUG_TO_TAB[m[1]];

  return null;
}

/**
 * Capture UTMs once on app load and emit a `landing_with_utm` event
 * correlating utm_campaign with the actually-rendered tab.
 * Returns the captured UTMs (or null when none were present).
 */
export function captureLandingAttribution(activeTab: PublicTab | null): UtmParams | null {
  const utms = readUtmsFromUrl();
  const hasAny = Object.keys(utms).length > 0;
  if (!hasAny) return null;

  const payload = {
    ...utms,
    tab: activeTab,
    tab_slug: activeTab ? TAB_SLUGS[activeTab] : null,
    referrer: document.referrer || null,
    landing_path: window.location.pathname,
    captured_at: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(payload));
  } catch { /* noop */ }

  track("landing_with_utm", payload);
  return utms;
}

export function getStoredAttribution(): (UtmParams & { tab?: PublicTab | null }) | null {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
