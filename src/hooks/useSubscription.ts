// useSubscription — reads user_subscriptions and exposes plan + checkout action.
// All components read from this hook; never query user_subscriptions directly.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── LAUNCH MODE ────────────────────────────────────────────────────────────
// Pre-launch: every user gets full Pro access, no paywall, no usage limits.
// This is a pure client-side override — it does not touch Stripe, the
// user_subscriptions table, or free_usage tracking, so billing infra stays
// intact underneath it.
//
// TO RESTORE THE PAYWALL: set this back to false. That's the only change
// needed — isPro below falls back to the real subscription check.
export const LAUNCH_MODE_FULL_ACCESS = true;

export type Plan = "free" | "pro";
export type SubStatus = "active" | "canceled" | "past_due" | "trialing";

export type Subscription = {
  plan: Plan;
  status: SubStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
};

const FREE_SUB: Subscription = {
  plan: "free",
  status: "active",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
};

export function useSubscription() {
  const { user, session } = useAuth();
  const [sub, setSub] = useState<Subscription>(FREE_SUB);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch admin status from DB — no hardcoded emails in client bundle
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin((data as { is_admin: boolean } | null)?.is_admin ?? false));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSub(FREE_SUB);
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_subscriptions")
        .select("plan, status, cancel_at_period_end, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (data) {
        setSub({
          plan: (data.plan as Plan) ?? "free",
          status: (data.status as SubStatus) ?? "active",
          cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
          currentPeriodEnd: data.current_period_end ?? null,
        });
      } else {
        setSub(FREE_SUB);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  // Admin bypass — driven by DB flag, no email in client code
  const isPro = LAUNCH_MODE_FULL_ACCESS || isAdmin || (sub.plan === "pro" && (sub.status === "active" || sub.status === "trialing"));

  const startCheckout = useCallback(async () => {
    if (!session?.access_token) return;
    const res = await fetch(
      "https://ooliwsmmtpggejyjmone.supabase.co/functions/v1/stripe-checkout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "Checkout failed. Please try again.");
    }
  }, [session]);

  return { sub, loading, isPro, startCheckout };
}
