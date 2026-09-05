import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { IndustryId } from "@/lib/industry/types";

export type AcademyProgress = {
  loading: boolean;
  completed: number;
  total: number;
  // Phase of the next module the user hasn't passed yet, or the last
  // module's phase once every module in the track is complete. Null while
  // loading, or if the track has no modules seeded yet.
  phaseNumber: number | null;
  phaseTitle: string | null;
};

type ModuleRow = { id: string; phase_number: number; phase_title: string };

/**
 * Real, per-user academy progress for a track. Replaces the static
 * trackProgress/trackModules/phaseLabel fields on IndustryConfig, which
 * showed the exact same numbers to every user in a given industry mode
 * regardless of what they'd actually completed (see CAP: "active track"
 * and "context loaded" panels showing fake progress).
 */
export function useAcademyProgress(industryId: IndustryId): AcademyProgress {
  const { user } = useAuth();
  const [state, setState] = useState<AcademyProgress>({
    loading: true,
    completed: 0,
    total: 0,
    phaseNumber: null,
    phaseTitle: null,
  });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    (async () => {
      const { data: mods } = await (supabase.from("academy_modules") as any)
        .select("id, phase_number, phase_title")
        .eq("track", industryId)
        .order("module_number");
      const modules = (mods ?? []) as ModuleRow[];

      let completedIds = new Set<string>();
      if (user && modules.length > 0) {
        const { data: prog } = await (supabase.from("user_module_progress") as any)
          .select("module_id")
          .eq("user_id", user.id)
          .eq("quiz_passed", true)
          .in(
            "module_id",
            modules.map((m) => m.id),
          );
        completedIds = new Set((prog ?? []).map((r: { module_id: string }) => r.module_id));
      }

      if (!alive) return;
      const nextModule =
        modules.find((m) => !completedIds.has(m.id)) ?? modules[modules.length - 1] ?? null;
      setState({
        loading: false,
        completed: completedIds.size,
        total: modules.length,
        phaseNumber: nextModule?.phase_number ?? null,
        phaseTitle: nextModule?.phase_title ?? null,
      });
    })();
    return () => {
      alive = false;
    };
  }, [industryId, user]);

  return state;
}
