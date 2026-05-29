// USER PROFILE — single source of truth for user_profiles table
// All components read from and write to this hook only.
// Never query user_profiles directly from a component.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserProfile = {
  id?: string;
  user_id: string;
  full_name: string | null;
  current_profession: string | null;
  location: string | null;
  mission: string | null;
  goal: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  substack_url: string | null;
  mentor_tone: string | null;
  daily_task_count: number | null;
  ai_response_style: string | null;
  content_tone: string | null;
  preferred_platforms: string | null;
  auto_daily_brief: boolean | null;
};

export const EMPTY_PROFILE = (uid: string): UserProfile => ({
  user_id: uid,
  full_name: null,
  current_profession: null,
  location: null,
  mission: null,
  goal: null,
  photo_url: null,
  linkedin_url: null,
  instagram_url: null,
  tiktok_url: null,
  twitter_url: null,
  youtube_url: null,
  substack_url: null,
  mentor_tone: "Strategic · Calm · Direct",
  daily_task_count: 5,
  ai_response_style: "Concise",
  content_tone: "Professional",
  preferred_platforms: "All",
  auto_daily_brief: true,
});

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;
      if (error) setError(error.message);

      if (!data) {
        const { data: inserted } = await supabase
          .from("user_profiles")
          .insert({ user_id: user.id })
          .select("*")
          .maybeSingle();
        setProfile((inserted as unknown as UserProfile) ?? EMPTY_PROFILE(user.id));
      } else {
        setProfile(data as unknown as UserProfile);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  const update = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!user) return;
      setProfile((p) => (p ? { ...p, ...patch } : p));
      const { error } = await supabase
        .from("user_profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ ...patch, user_id: user.id } as any, { onConflict: "user_id" });
      if (error) setError(error.message);
    },
    [user]
  );

  return { profile, loading, error, update };
}
