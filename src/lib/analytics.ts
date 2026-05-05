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

export interface ContentClickProps {
  /** Section/component the card lives in (e.g. "weekly-movies", "novidades"). */
  surface: string;
  /** Content kind: movie, series, news, game, banner, etc. */
  content_type: string;
  /** Stable id of the content (db id, tmdb id, slug...). */
  content_id?: string | number | null;
  /** Human-readable title for debugging. */
  content_title?: string | null;
  /** Position in the row/list (0-indexed). */
  position?: number | null;
  /** Action — "open" (default), "trailer", "external". */
  action?: "open" | "trailer" | "external";
}

/**
 * Fire a `content_card_click` event ONLY when the current session arrived via
 * a UTM link. Correlates the click back to the originating utm_campaign /
 * utm_content so we can see which shared link drove which card open.
 */
export function trackContentClick(props: ContentClickProps): void {
  const attribution = getStoredAttribution();
  if (!attribution?.utm_campaign && !attribution?.utm_source) return;

  track("content_card_click", {
    ...props,
    action: props.action ?? "open",
    utm_source: attribution.utm_source ?? null,
    utm_medium: attribution.utm_medium ?? null,
    utm_campaign: attribution.utm_campaign ?? null,
    utm_content: attribution.utm_content ?? null,
    landing_tab: attribution.tab ?? null,
    from_share: attribution.utm_campaign?.startsWith("share-") ?? false,
  });
}
