// useSubscription — reads user_subscriptions and exposes plan + checkout action.
// All components read from this hook; never query user_subscriptions directly.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

  // Admin bypass — owner always has full Pro access regardless of subscription
  const ADMIN_EMAILS = ["captainmyscapa@gmail.com"];
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  const isPro = isAdmin || (sub.plan === "pro" && (sub.status === "active" || sub.status === "trialing"));

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
