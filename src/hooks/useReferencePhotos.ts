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
  rights_acknowledged_at: string;
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

  // rightsAcknowledged must be explicitly true (a checkbox the user ticked
  // for THIS upload) -- never defaulted or remembered across uploads, since
  // this is the one place Aurum has any evidence the uploader has rights to
  // use the photo.
  const upload = useCallback(
    async (
      file: File,
      label: string,
      rightsAcknowledged: boolean,
    ): Promise<ReferencePhoto | null> => {
      if (!user) return null;
      if (!rightsAcknowledged) {
        setError("You must confirm you own or have rights to use this photo.");
        return null;
      }
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

  return { photos, loading, error, upload, remove, refetch };
}
