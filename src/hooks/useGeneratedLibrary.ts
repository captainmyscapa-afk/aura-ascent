// CAP-134: the permanent "Generated Library" -- every image and video Studio
// ever generates gets logged here, separate from user_content_history (which
// only keeps the LATEST image/video per content item, overwritten on every
// regenerate). So a generation the user later flagged and replaced, or just
// didn't end up using, is never actually lost.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type GeneratedMedia = {
  id: string;
  user_id: string;
  content_history_id: string | null;
  collection_id: string | null;
  type: "image" | "video";
  media_url: string;
  storage_path: string | null;
  prompt: string | null;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
};

export function useGeneratedLibrary() {
  const { user } = useAuth();
  const [items, setItems] = useState<GeneratedMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("studio_generated_media")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data as GeneratedMedia[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Called right after a generation is persisted to storage -- optimistic
  // local update plus the durable insert, so the library reflects new items
  // immediately without a full refetch.
  const logItem = useCallback(
    async (entry: {
      type: "image" | "video";
      mediaUrl: string;
      storagePath?: string | null;
      prompt?: string | null;
      contentHistoryId?: string | null;
      flagged?: boolean;
      flagReason?: string | null;
    }) => {
      if (!user) return;
      const { data } = await supabase
        .from("studio_generated_media")
        .insert({
          user_id: user.id,
          type: entry.type,
          media_url: entry.mediaUrl,
          storage_path: entry.storagePath ?? null,
          prompt: entry.prompt ?? null,
          content_history_id: entry.contentHistoryId ?? null,
          flagged: entry.flagged ?? false,
          flag_reason: entry.flagReason ?? null,
        })
        .select("*")
        .maybeSingle();
      if (data) setItems((prev) => [data as GeneratedMedia, ...prev]);
    },
    [user],
  );

  // CAP-135: assigns (or clears) which named folder this generated image/
  // video belongs to -- same grouping as reference photos, so a boat's
  // uploaded photos and its generated images end up in one place.
  const setCollection = useCallback(
    async (mediaId: string, collectionId: string | null) => {
      setItems((prev) => prev.map((m) => (m.id === mediaId ? { ...m, collection_id: collectionId } : m)));
      await supabase.from("studio_generated_media").update({ collection_id: collectionId }).eq("id", mediaId);
    },
    [],
  );

  return { items, loading, refetch, logItem, setCollection };
}
