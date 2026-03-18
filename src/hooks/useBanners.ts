import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BannerCategory = "cover" | "football" | "basketball" | "ufc" | "other_sports" | "football_guide";

export interface Banner {
  id: string;
  image_url: string;
  category: BannerCategory;
  title: string | null;
  active: boolean;
  sort_order: number;
  expires_at: string | null;
  created_at: string;
}

export const BANNER_CATEGORIES: { value: BannerCategory; label: string; icon: string }[] = [
  { value: "cover", label: "Capa / Destaque", icon: "🎯" },
  { value: "football", label: "Futebol", icon: "⚽" },
  { value: "basketball", label: "Basquete", icon: "🏀" },
  { value: "ufc", label: "UFC / MMA", icon: "🥊" },
  { value: "other_sports", label: "Demais Esportes", icon: "🏆" },
  { value: "football_guide", label: "Guia do Futebol", icon: "📋" },
];

export const useBanners = (category?: BannerCategory | "all", activeOnly = true) => {
  return useQuery({
    queryKey: ["banners", category, activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (activeOnly) {
        query = query.eq("active", true);
      }
      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter expired banners client-side
      const now = new Date().toISOString();
      return (data as Banner[]).filter(
        (b) => !activeOnly || !b.expires_at || b.expires_at > now
      );
    },
  });
};

export const useUploadBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      category,
      title,
    }: {
      file: File;
      category: BannerCategory;
      title?: string;
    }) => {
      const ext = file.name.split(".").pop();
      const fileName = `${category}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("banners")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("banners").insert({
        image_url: urlData.publicUrl,
        category,
        title: title || null,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useToggleBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("banners")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: Banner) => {
      // Delete from storage
      const path = banner.image_url.split("/banners/")[1];
      if (path) {
        await supabase.storage.from("banners").remove([decodeURIComponent(path)]);
      }
      // Delete from DB
      const { error } = await supabase.from("banners").delete().eq("id", banner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });
};
