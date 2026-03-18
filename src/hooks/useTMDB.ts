import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

export const useTMDBSearch = () => {
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (action: string, query?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("tmdb-proxy", {
        body: { action, query },
      });
      if (error) throw error;
      setResults(data?.results || []);
    } catch (e) {
      console.error("TMDB search error:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search, setResults };
};
