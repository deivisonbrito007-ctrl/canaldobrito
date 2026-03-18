import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const useDailyBanner = (date?: Date) => {
  const target = date || new Date();
  const dateStr = format(target, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["daily_banner", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_banner")
        .select("*")
        .eq("date", dateStr)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

export const useUpsertDailyBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageUrl, date }: { imageUrl: string; date: string }) => {
      const { data: existing } = await supabase
        .from("daily_banner")
        .select("id")
        .eq("date", date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("daily_banner")
          .update({ image_url: imageUrl, active: true })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("daily_banner")
          .insert({ image_url: imageUrl, date, active: true });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_banner"] }),
  });
};

export const useToggleDailyBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("daily_banner")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_banner"] }),
  });
};
