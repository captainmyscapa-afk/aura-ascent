// CAP-135: named folders ("M/Y Scapa", "Sunseeker 88") that group reference
// photos and AI-generated images of the same boat together, so the user can
// find and select them as a set next time instead of hunting through
// everything they've ever uploaded or generated.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MediaCollection = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export function useMediaCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<MediaCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setCollections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("studio_media_collections")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });
    setCollections((data as MediaCollection[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const create = useCallback(
    async (name: string): Promise<MediaCollection | null> => {
      if (!user || !name.trim()) return null;
      const { data } = await supabase
        .from("studio_media_collections")
        .insert({ user_id: user.id, name: name.trim() })
        .select("*")
        .maybeSingle();
      if (data) setCollections((prev) => [...prev, data as MediaCollection].sort((a, b) => a.name.localeCompare(b.name)));
      return (data as MediaCollection | null) ?? null;
    },
    [user],
  );

  return { collections, loading, refetch, create };
}
