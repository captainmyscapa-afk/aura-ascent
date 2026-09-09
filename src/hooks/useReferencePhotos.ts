// CAP-133: saved reference photo library for Studio image generation.
// Upload a real photo of a boat/asset once, tag it, and reuse it across
// every future generation instead of re-uploading every time -- this is
// what makes reference-image generation (accurate boats, not hallucinated
// ones) something people actually keep using.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ReferencePhoto = {
  id: string;
  user_id: string;
  label: string;
  image_url: string;
  storage_path: string;
  rights_acknowledged_at: string | null;
  collection_id: string | null;
  created_at: string;
};

const BUCKET = "public-assets";

export function useReferencePhotos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ReferencePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("studio_reference_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setPhotos((data as ReferencePhoto[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // The rights checkbox is shown to the user on every upload but does not
  // block the upload -- we record whether it was actually ticked
  // (rights_acknowledged_at is null when it wasn't) so there's still an
  // honest record of what was presented and what the user did, without
  // Aurum gatekeeping the feature on it.
  const upload = useCallback(
    async (
      file: File,
      label: string,
      rightsAcknowledged: boolean,
    ): Promise<ReferencePhoto | null> => {
      if (!user) return null;
      setError(null);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `reference-photos/${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (uploadError) {
        setError(uploadError.message);
        return null;
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { data, error: insertError } = await supabase
        .from("studio_reference_photos")
        .insert({
          user_id: user.id,
          label: label.trim() || file.name,
          image_url: pub.publicUrl,
          storage_path: path,
          rights_acknowledged_at: rightsAcknowledged ? new Date().toISOString() : null,
        })
        .select("*")
        .maybeSingle();
      if (insertError) {
        setError(insertError.message);
        return null;
      }
      const inserted = data as ReferencePhoto;
      setPhotos((prev) => [inserted, ...prev]);
      return inserted;
    },
    [user],
  );

  const remove = useCallback(
    async (photo: ReferencePhoto) => {
      if (!user) return;
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      await supabase.from("studio_reference_photos").delete().eq("id", photo.id);
    },
    [user],
  );

  // CAP-135: assigns (or clears, with collectionId null) which named folder
  // ("M/Y Scapa", etc.) this photo belongs to, so it groups with every other
  // reference photo and generated image of the same boat.
  const setCollection = useCallback(
    async (photoId: string, collectionId: string | null) => {
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, collection_id: collectionId } : p)));
      await supabase.from("studio_reference_photos").update({ collection_id: collectionId }).eq("id", photoId);
    },
    [],
  );

  return { photos, loading, error, upload, remove, setCollection, refetch };
}
