import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Tracks real active usage time (tab open + visible), flushed to the DB in
// small periodic deltas via the increment_active_seconds RPC — an atomic
// server-side add, so this can't clobber another open tab's own delta.
// Mounted once in AppShell. Deliberately a "rough usage indicator", not a
// precise/audited timer:
//  - Only counts foreground time (document.visibilityState === "visible"),
//    not just "tab open in background".
//  - Two tabs open at once each accrue and flush independently, so overlapping
//    time across tabs is double-counted. Fixing that needs cross-tab
//    coordination (e.g. BroadcastChannel) — not worth the complexity for a
//    usage stat with no monetization or gating attached to it.
//  - A hard crash/force-quit between flushes loses whatever was pending
//    (at most one FLUSH_INTERVAL_MS of drift).
const FLUSH_INTERVAL_MS = 30_000;

export function useActiveTimeTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let lastTick = Date.now();
    let pendingSeconds = 0;

    const accrue = () => {
      const now = Date.now();
      const elapsed = (now - lastTick) / 1000;
      lastTick = now;
      if (document.visibilityState === "visible") {
        pendingSeconds += elapsed;
      }
    };

    const flush = () => {
      const toFlush = Math.round(pendingSeconds);
      pendingSeconds = 0;
      if (toFlush <= 0) return;
      void supabase.rpc("increment_active_seconds", { p_seconds: toFlush });
    };

    const onTick = () => {
      accrue();
      flush();
    };

    const onVisibilityChange = () => accrue();

    const interval = setInterval(onTick, FLUSH_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      accrue();
      flush();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user]);
}
