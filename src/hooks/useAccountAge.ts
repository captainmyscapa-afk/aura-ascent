import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// How long it's been since the user signed up — real elapsed time from
// Supabase Auth's own `created_at` on the user record, not a usage/session
// tracker (nothing in this app currently records active time-in-app; this
// is account age, formatted as days + remaining hours).
export type AccountAge = { days: number; hours: number };

export function useAccountAge(): AccountAge | null {
  const { user } = useAuth();
  const [age, setAge] = useState<AccountAge | null>(null);

  useEffect(() => {
    if (!user?.created_at) {
      setAge(null);
      return;
    }
    const createdAtMs = new Date(user.created_at).getTime();

    const compute = () => {
      const totalHours = Math.floor(Math.max(0, Date.now() - createdAtMs) / 3_600_000);
      setAge({ days: Math.floor(totalHours / 24), hours: totalHours % 24 });
    };

    compute();
    // Refresh periodically so a long-open tab doesn't show a stale value —
    // this widget isn't a live ticker, just kept reasonably fresh.
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [user?.created_at]);

  return age;
}
