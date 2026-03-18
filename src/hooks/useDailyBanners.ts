import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DailyBanner {
  id: string;
  image_url: string;
  date: string;
  active: boolean;
  sort_order: number;
  title: string | null;
  link_url: string | null;
  created_at: string;
}

export const useDailyBanners = (date?: string) => {
  const targetDate = date || new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["daily_banners", targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_banner")
        .select("*")
        .eq("date", targetDate)
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as DailyBanner[];
    },
  });
};

export const useAllDailyBanners = (date?: string) => {
  const targetDate = date || new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["daily_banners", "admin", targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_banner")
        .select("*")
        .eq("date", targetDate)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as DailyBanner[];
    },
  });
};

export const useCreateDailyBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (banner: { image_url: string; date: string; sort_order?: number; title?: string; link_url?: string }) => {
      const { error } = await supabase.from("daily_banner").insert(banner);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_banners"] }),
  });
};

export const useUpdateDailyBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DailyBanner> & { id: string }) => {
      const { error } = await supabase.from("daily_banner").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_banners"] }),
  });
};

export const useDeleteDailyBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_banner").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_banners"] }),
  });
};
