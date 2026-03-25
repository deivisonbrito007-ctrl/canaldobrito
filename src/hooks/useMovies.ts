import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedMovie {
  id: string;
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  overview: string | null;
  rating: number | null;
  year: number | null;
  genre: string | null;
  active: boolean;
  created_at: string;
}

export const useActiveMovies = () =>
  useQuery({
    queryKey: ["featured_movies", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_movies")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FeaturedMovie[];
    },
  });

export const useAllMovies = () =>
  useQuery({
    queryKey: ["featured_movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_movies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FeaturedMovie[];
    },
  });

export const useAddMovie = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (movie: Omit<FeaturedMovie, "id" | "active" | "created_at"> & { added_by?: string | null }) => {
      const { error } = await supabase.from("featured_movies").insert(movie);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured_movies"] }),
  });
};

export const useToggleMovie = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("featured_movies").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured_movies"] }),
  });
};

export const useUpdateMovie = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; genre?: string | null; rating?: number | null; overview?: string | null; poster_url?: string | null; backdrop_url?: string | null }) => {
      const { error } = await supabase.from("featured_movies").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured_movies"] }),
  });
};

export const useDeleteMovie = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("featured_movies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured_movies"] }),
  });
};
