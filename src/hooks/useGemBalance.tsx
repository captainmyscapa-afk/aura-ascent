// useGemBalance — CAP-147: Aurum Gems, the credit currency that powers
// premium AI actions across the app. Mirrors useSubscription.ts's shape.
//
// Pre-launch: spending never blocks the underlying action (matches
// LAUNCH_MODE_FULL_ACCESS in useSubscription.ts) — it only tracks and
// displays a real, honest number. spend() is fire-and-forget: call it
// alongside the action, don't gate on it.
//
// setGemBalance() (CAP-147 follow-up): Aurum Gems isn't wired to billing yet,
// so there's no Stripe webhook to replenish a balance. Until that exists,
// is_admin() users can write their own row directly (see the
// gem_balance_admin_self_control migration's RLS policies) — this is how
// Captain manually controls his own balance while testing. It's a no-op
// (silently ignored) for anyone without that RLS grant.
//
// CAP-147 follow-up #2: this used to be a plain hook, so every call site
// (TopBar, Studio, Mentor, Settings, ...) held its own independent balance
// state — spending a gem on Studio's page never updated the number shown in
// the TopBar until a full remount. Now backed by one Context provider
// (mounted once in __root.tsx, same spot as LanguageProvider/IndustryProvider)
// so every consumer reads and updates the same shared balance. The
// useGemBalance() call signature is unchanged for every existing call site.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_BALANCE = 200;
const DEFAULT_ALLOTMENT = 200;

type Ctx = {
  balance: number;
  monthlyAllotment: number;
  loading: boolean;
  spend: (amount: number, action: string) => Promise<void>;
  setGemBalance: (newBalance: number, newAllotment?: number) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const GemBalanceContext = createContext<Ctx | null>(null);

export function GemBalanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [monthlyAllotment, setMonthlyAllotment] = useState(DEFAULT_ALLOTMENT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(DEFAULT_BALANCE);
      setMonthlyAllotment(DEFAULT_ALLOTMENT);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("user_gem_balances")
      .select("balance, monthly_allotment")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setBalance(data.balance);
      setMonthlyAllotment(data.monthly_allotment);
    } else {
      setBalance(DEFAULT_BALANCE);
      setMonthlyAllotment(DEFAULT_ALLOTMENT);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Deducts `amount` gems for `action` (one of the CAP-147 action keys —
  // see gemCosts.ts). Best-effort: on failure the shared balance just isn't
  // updated, the caller's action already went ahead regardless.
  const spend = useCallback(
    async (amount: number, action: string) => {
      if (!user || amount <= 0) return;
      const { data, error } = await (supabase.rpc as any)("spend_gems", {
        p_amount: amount,
        p_action: action,
      });
      if (!error && typeof data === "number") setBalance(data);
    },
    [user],
  );

  // Admin-only self-control (see header comment). Upserts so it also works
  // for an admin who has never triggered spend_gems yet (no row created).
  const setGemBalance = useCallback(
    async (newBalance: number, newAllotment?: number) => {
      if (!user) return false;
      const { error } = await (supabase as any)
        .from("user_gem_balances")
        .upsert(
          {
            user_id: user.id,
            balance: newBalance,
            monthly_allotment: newAllotment ?? monthlyAllotment,
          },
          { onConflict: "user_id" },
        );
      if (error) return false;
      setBalance(newBalance);
      if (newAllotment !== undefined) setMonthlyAllotment(newAllotment);
      return true;
    },
    [user, monthlyAllotment],
  );

  const value = useMemo<Ctx>(
    () => ({ balance, monthlyAllotment, loading, spend, setGemBalance, refresh }),
    [balance, monthlyAllotment, loading, spend, setGemBalance, refresh],
  );

  return <GemBalanceContext.Provider value={value}>{children}</GemBalanceContext.Provider>;
}

export function useGemBalance(): Ctx {
  const ctx = useContext(GemBalanceContext);
  if (!ctx) throw new Error("useGemBalance must be used within GemBalanceProvider");
  return ctx;
}
