import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeChannelName } from "@/components/public/channelLogos";
import { BUILTIN_CHANNEL_MAP } from "@/components/public/ChannelBadge";
import { useChannelMappings, type ChannelMapping } from "./useChannelMappings";

export type DiscoveredChannel = {
  name: string;
  normalized: string;
  count: number;
  mapping?: ChannelMapping;
  isBuiltin: boolean;
  isOrphan: boolean;
};

const BUILTIN_NORMALIZED = new Set(
  Object.keys(BUILTIN_CHANNEL_MAP).map(normalizeChannelName)
);

export function useDiscoveredChannels() {
  const { data: mappings } = useChannelMappings();

  const { data: rawChannels, isLoading, refetch } = useQuery({
    queryKey: ["discovered-channels"],
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("daily_games")
        .select("channels")
        .gte("date", since.toISOString().slice(0, 10))
        .limit(2000);
      if (error) throw error;

      const counts = new Map<string, { name: string; count: number }>();
      for (const row of (data ?? []) as Array<{ channels: string[] | null }>) {
        for (const ch of row.channels ?? []) {
          if (!ch || typeof ch !== "string") continue;
          const trimmed = ch.trim();
          if (!trimmed) continue;
          const norm = normalizeChannelName(trimmed);
          if (!norm) continue;
          const existing = counts.get(norm);
          if (existing) existing.count += 1;
          else counts.set(norm, { name: trimmed, count: 1 });
        }
      }
      return counts;
    },
  });

  return useMemo(() => {
    const items: DiscoveredChannel[] = [];
    if (rawChannels) {
      for (const [normalized, { name, count }] of rawChannels.entries()) {
        const mapping = mappings?.get(normalized);
        const isBuiltin = BUILTIN_NORMALIZED.has(normalized);
        const hasLogo = !!mapping?.custom_logo_url || (mapping && mapping.logo_key !== "none") || isBuiltin;
        items.push({
          name,
          normalized,
          count,
          mapping,
          isBuiltin,
          isOrphan: !hasLogo,
        });
      }
    }
    items.sort((a, b) => b.count - a.count);
    return {
      isLoading,
      refetch,
      all: items,
      orphans: items.filter((i) => i.isOrphan),
      mapped: items.filter((i) => !!i.mapping),
      builtin: items.filter((i) => i.isBuiltin && !i.mapping),
    };
  }, [rawChannels, mappings, isLoading, refetch]);
}
