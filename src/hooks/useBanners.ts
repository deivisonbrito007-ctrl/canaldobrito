import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BannerCategory = "cover" | "football" | "basketball" | "ufc" | "other_sports" | "football_guide";

export interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  category: BannerCategory;
  active: boolean;
  sort_order: number;
  expires_at: string | null;
  publish_at: string | null;
  created_at: string;
}

export const CATEGORY_LABELS: Record<BannerCategory, string> = {
  cover: "📺 Capa",
  football: "⚽ Futebol",
  basketball: "🏀 Basquete",
  ufc: "🥊 UFC/MMA",
  other_sports: "🏆 Demais Esportes",
  football_guide: "📋 Guia do Futebol",
};

export const CATEGORY_LIST: BannerCategory[] = ["cover", "football", "basketball", "ufc", "other_sports", "football_guide"];

export const useBannersByCategory = (category: BannerCategory) =>
  useQuery({
    queryKey: ["banners", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("category", category)
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });

export const useAllBanners = (category?: BannerCategory) =>
  useQuery({
    queryKey: ["banners", "admin", category],
    queryFn: async () => {
      let q = supabase.from("banners").select("*").order("sort_order", { ascending: true });
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data as Banner[];
    },
  });

export const useCreateBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (banner: { image_url: string; title?: string; category: BannerCategory; sort_order?: number; publish_at?: string; active?: boolean }) => {
      const { error } = await supabase.from("banners").insert(banner as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};

export const useUpdateBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Banner> & { id: string }) => {
      const { error } = await supabase.from("banners").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};

export const useDeleteBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};
