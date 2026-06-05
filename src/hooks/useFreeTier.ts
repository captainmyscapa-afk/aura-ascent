/**
 * Free tier usage tracking and gate enforcement.
 *
 * Free limits (per user lifetime until they upgrade):
 *   studio_drafts    — 1  (AI content generation)
 *   network_drafts   — 2  (email/DM drafts)
 *   mentor_messages  — 5  (mentor AI)
 *   tutor_messages   — 5  (tutor AI)
 *   roadmap          — preview only (blurred week 2-4)
 *   academy          — module 1 only
 *   intelligence     — overview (can read, but limited signals)
 *
 * Pro users have no limits.
 */

import { useCallback } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";

export const FREE_LIMITS = {
  studio_drafts:   1,
  network_drafts:  2,
  mentor_messages: 5,
  tutor_messages:  5,
} as const;

export type FreeTierKey = keyof typeof FREE_LIMITS;

type UsageMap = Partial<Record<FreeTierKey, number>>;

export function useFreeTier() {
  const { isPro } = useSubscription();
  const { state: core, update: updateCore } = useAurumCoreState();

  const usage = (core?.free_usage as UsageMap | null) ?? {};

  function getCount(key: FreeTierKey): number {
    return usage[key] ?? 0;
  }

  function getLimit(key: FreeTierKey): number {
    return FREE_LIMITS[key];
  }

  function hasRemaining(key: FreeTierKey): boolean {
    if (isPro) return true;
    return getCount(key) < getLimit(key);
  }

  function remaining(key: FreeTierKey): number {
    if (isPro) return Infinity;
    return Math.max(0, getLimit(key) - getCount(key));
  }

  const increment = useCallback(async (key: FreeTierKey) => {
    if (isPro) return; // no tracking needed for pro
    const current = (core?.free_usage as UsageMap | null) ?? {};
    const next = { ...current, [key]: (current[key] ?? 0) + 1 };
    await updateCore({ free_usage: next as unknown as null });
  }, [isPro, core?.free_usage, updateCore]);

  return {
    isPro,
    usage,
    getCount,
    getLimit,
    hasRemaining,
    remaining,
    increment,
  };
}
