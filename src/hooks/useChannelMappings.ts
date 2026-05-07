import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeChannelName, type LogoKey } from "@/components/public/channelLogos";

export type ChannelMapping = {
  id: string;
  name: string;
  name_normalized: string;
  logo_key: LogoKey;
  short: string | null;
  active: boolean;
};

export const CHANNEL_MAPPINGS_QK = ["channel_logo_mappings"] as const;

export function useChannelMappings() {
  return useQuery({
    queryKey: CHANNEL_MAPPINGS_QK,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Map<string, ChannelMapping>> => {
      const { data, error } = await supabase
        .from("channel_logo_mappings")
        .select("*")
        .eq("active", true);
      if (error) throw error;
      const map = new Map<string, ChannelMapping>();
      for (const row of (data ?? []) as ChannelMapping[]) {
        map.set(row.name_normalized || normalizeChannelName(row.name), row);
      }
      return map;
    },
  });
}
