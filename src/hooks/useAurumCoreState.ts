// AURUM CORE STATE — single source of truth
// All tabs read from and write to this hook only.
// Before adding a new column to aurum_core_state, check if an existing field covers the need.
// Fields: active_mode, current_phase, current_level, streak, execution_score,
//         daily_brief, daily_brief_date, daily_tasks, daily_tasks_date, daily_tasks_history,
//         ai_summary, ai_summary_updated_at, current_focus,
//         upcoming_events, upcoming_events_week_start

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AurumCoreState = {
  id: string;
  user_id: string;
  // User position
  active_mode: string | null;
  current_phase: string | null;
  current_level: string | null;
  streak: number;
  execution_score: number;
  // Daily content
  daily_brief: unknown | null;
  daily_brief_date: string | null;
  // CAP-93: keyed by industryId ("yachts"/"villas"/"jets"/"cars") so each mode
  // caches its own rituals for the day instead of sharing one global slot.
  daily_tasks: Record<string, { mode?: string; tasks?: string[] }> | null;
  daily_tasks_date: string | null;
  // Rolling per-industry history of previously-generated ritual task strings, so
  // generation can be told not to repeat itself across days.
  daily_tasks_history: Record<string, string[]> | null;
  // AI context
  ai_summary: unknown | null;
  ai_summary_updated_at: string | null;
  current_focus: unknown;
  // Events
  upcoming_events: unknown[];
  upcoming_events_week_start: string | null;
  updated_at: string | null;
  last_active: string | null;
  // Roadmap
  roadmap: unknown | null;
  roadmap_generated_at: string | null;
  roadmap_progress: unknown | null;
  // Free tier
  free_usage: unknown | null;
  // CAP-78: daily ritual profile (time budget, focus areas, challenge — captured on first connection)
  ritual_profile: RitualProfile | null;
};

// CAP-78: answers to the 5 "daily ritual" onboarding questions
export type RitualProfile = {
  timeBudget: "15min" | "30min" | "1hr" | "2hr+";
  preferredTime: "morning" | "midday" | "evening" | "late_night";
  background: string;
  focusAreas: string[];
  biggestChallenge: string;
};

// Map exposed (canonical) field names → legacy DB column names.
// New names live in the hook; the DB still uses the legacy names.
const NEW_TO_DB: Record<string, string> = {
  daily_brief: "today_brief",
  daily_brief_date: "today_brief_date",
};

// Columns we don't have in the DB — exposed as null.
const VIRTUAL_FIELDS = new Set(["current_phase", "last_active"]);

function fromRow(row: Record<string, unknown> | null): AurumCoreState | null {
  if (!row) return null;
  return {
    id: (row.id as string) ?? "",
    user_id: (row.user_id as string) ?? "",
    active_mode: (row.active_mode as string | null) ?? (row.mode as string | null) ?? null,
    current_phase: null,
    current_level: (row.current_level as string | null) ?? (row.level as string | null) ?? null,
    streak: (row.streak as number) ?? 0,
    execution_score: (row.execution_score as number) ?? 0,
    daily_brief: (() => {
      const v = row.today_brief;
      if (!v) return null;
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      }
      return v;
    })(),
    daily_brief_date: (row.today_brief_date as string | null) ?? null,
    daily_tasks: (() => {
      const v = row.daily_tasks;
      if (!v) return null;
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      }
      // Legacy rows may have stored a plain array, or a single un-keyed
      // { mode, tasks } object (pre-CAP-93) — neither matches any current
      // industryId key, so they're dropped and today's tasks regenerate
      // fresh, scoped per mode, instead of being misread as one mode's cache.
      if (Array.isArray(v)) return null;
      if (v && typeof v === "object" && "tasks" in v) return null;
      return v as Record<string, { mode?: string; tasks?: string[] }>;
    })(),
    daily_tasks_date: (row.daily_tasks_date as string | null) ?? null,
    daily_tasks_history: (() => {
      const v = row.daily_tasks_history;
      if (!v) return null;
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      }
      return v as Record<string, string[]>;
    })(),
    ai_summary: (() => {
      const v = row.ai_summary;
      if (!v) return null;
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      }
      return v;
    })(),
    ai_summary_updated_at: (row.ai_summary_updated_at as string | null) ?? null,
    current_focus: (row.current_focus as unknown) ?? (row.goal as unknown) ?? null,
    upcoming_events: Array.isArray(row.upcoming_events) ? (row.upcoming_events as unknown[]) : [],
    upcoming_events_week_start: (row.upcoming_events_week_start as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
    last_active: null,
    roadmap: (row.roadmap as unknown) ?? null,
    roadmap_generated_at: (row.roadmap_generated_at as string | null) ?? null,
    roadmap_progress: (row.roadmap_progress as unknown) ?? null,
    free_usage: (row.free_usage as unknown) ?? null,
    ritual_profile: (row.ritual_profile as RitualProfile | null) ?? null,
  };
}

function toDbPatch(patch: Partial<AurumCoreState>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (VIRTUAL_FIELDS.has(k)) continue;
    const dbKey = NEW_TO_DB[k] ?? k;
    out[dbKey] = v;
  }
  if (out["active_mode"] !== undefined) out["mode"] = out["active_mode"];
  if (out["current_level"] !== undefined) out["level"] = out["current_level"];
  return out;
}

export function useAurumCoreState() {
  const { user } = useAuth();
  const [state, setState] = useState<AurumCoreState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async (alive: () => boolean) => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("aurum_core_state")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!alive()) return;
    if (error) { setError(error.message); setLoading(false); return; }

    if (!data) {
      // First login — create the default row
      const { data: inserted, error: insertError } = await supabase
        .from("aurum_core_state")
        .insert({ user_id: user.id, streak: 0, execution_score: 0 })
        .select("*")
        .maybeSingle();
      if (!alive()) return;
      if (insertError) setError(insertError.message);
      setState(fromRow(inserted as Record<string, unknown> | null));
    } else {
      setState(fromRow(data as Record<string, unknown>));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setState(null);
      setLoading(false);
      return;
    }
    let alive = true;
    fetchState(() => alive);
    return () => {
      alive = false;
    };
  }, [user, fetchState]);

  // Re-pull the row from the DB — used after server-side writes (RPCs) that
  // the client can't reflect optimistically, e.g. increment_free_usage.
  const refetch = useCallback(() => fetchState(() => true), [fetchState]);

  const update = useCallback(
    async (patch: Partial<AurumCoreState>) => {
      if (!user) return;
      const dbPatch = toDbPatch(patch);
      if (Object.keys(dbPatch).length === 0) return;
      // Optimistic update
      setState((s) => {
        if (!s) return s;
        const safe = { ...patch };
        if ("upcoming_events" in safe && !Array.isArray(safe.upcoming_events)) {
          delete safe.upcoming_events;
        }
        return { ...s, ...safe };
      });
      const { data, error } = await supabase
        .from("aurum_core_state")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ ...dbPatch, user_id: user.id } as any, { onConflict: "user_id" })
        .select()
        .maybeSingle();
      if (error) {
        setError(error.message);
        return;
      }
      if (data) setState(fromRow(data as Record<string, unknown>));
    },
    [user],
  );

  return { state, loading, error, update, refetch };
}
