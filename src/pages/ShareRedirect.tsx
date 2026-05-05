import { useEffect, useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { SLUG_TO_TAB, TAB_SLUGS } from "@/lib/utils";
import { track } from "@/lib/analytics";

const ATTRIBUTION_KEY = "cdb:attribution";

/**
 * Internal short-link redirector.
 * URL: /s/<slug>  →  registers landing_with_utm + redirects to /<slug>
 * Keeps shared links short and clean while preserving CTR/Conversion analytics.
 */
export default function ShareRedirect() {
  const { slug = "" } = useParams<{ slug: string }>();
  const target = useMemo(() => {
    const tab = SLUG_TO_TAB[slug.toLowerCase()];
    return tab ? `/${TAB_SLUGS[tab]}` : "/";
  }, [slug]);

  useEffect(() => {
    const tab = SLUG_TO_TAB[slug.toLowerCase()];
    if (!tab) return;
    const tabSlug = TAB_SLUGS[tab];
    const utms = {
      utm_source: "whatsapp",
      utm_medium: "status",
      utm_campaign: `share-${tabSlug}`,
    };
    const payload = {
      ...utms,
      tab,
      tab_slug: tabSlug,
      referrer: document.referrer || null,
      landing_path: `/${tabSlug}`,
      captured_at: new Date().toISOString(),
      via: "short-link",
    };
    try { sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(payload)); } catch { /* noop */ }
    track("landing_with_utm", payload);
  }, [slug]);

  return <Navigate to={target} replace />;
}
