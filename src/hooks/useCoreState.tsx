import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CoreState = {
  id: string;
  user_id: string;
  mode: string;
  goal: string;
  level: string;
  execution_score: number;
  streak: number;
  current_focus: string;
};

const DEFAULTS = {
  mode: "general",
  goal: "growth",
  level: "beginner",
  execution_score: 0,
  streak: 0,
  current_focus: "onboarding",
};

type Ctx = {
  state: CoreState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const CoreStateCtx = createContext<Ctx>({
  state: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function CoreStateProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<CoreState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (uid: string) => {
    setError(null);

    console.info("[aurum_core_state] CHECKING CORE STATE for user", uid);
    const { data, error: selErr } = await supabase
      .from("aurum_core_state")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (selErr) {
      console.error("[aurum_core_state] select failed:", selErr);
      setError(selErr.message);
      setLoading(false);
      return;
    }

    if (data) {
      console.info("[aurum_core_state] existing row loaded", data.id);
      setState(data as CoreState);
      setLoading(false);
      return;
    }

    console.info("[aurum_core_state] CREATING CORE STATE for user", uid);
    const { data: inserted, error: insErr } = await supabase
      .from("aurum_core_state")
      .insert({ user_id: uid, ...DEFAULTS })
      .select()
      .single();

    if (insErr || !inserted) {
      console.error("[aurum_core_state] INSERT failed for user", uid, insErr);
      setError(insErr?.message ?? "Failed to initialize core state");
      setLoading(false);
      return;
    }

    console.info("[aurum_core_state] insert success", inserted.id);
    setState(inserted as CoreState);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const runForVerifiedUser = async () => {
      // Always fetch the verified user from Supabase — never trust cached context.
      const { data, error: getUserErr } = await supabase.auth.getUser();
      if (cancelled) return;

      if (getUserErr) {
        console.error("[aurum_core_state] getUser() error", getUserErr);
        setState(null);
        setLoading(false);
        return;
      }

      const verifiedUser = data?.user;
      if (!verifiedUser) {
        console.info("[aurum_core_state] no verified user — stopping init");
        setState(null);
        setLoading(false);
        return;
      }

      console.info("[aurum_core_state] USER FOUND", verifiedUser.id);
      setLoading(true);
      await load(verifiedUser.id);
    };

    // Wait for Supabase auth session to be fully loaded BEFORE doing anything.
    if (authLoading) {
      return () => {
        cancelled = true;
      };
    }

    console.info("[aurum_core_state] AUTH LOADED");

    if (!user) {
      setState(null);
      setLoading(false);
    } else {
      void runForVerifiedUser();
    }

    // React to subsequent auth state changes (sign-in, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        if (!session?.user) {
          setState(null);
          setLoading(false);
          return;
        }
        if (
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED"
        ) {
          // Fire and forget — do not await inside the auth callback.
          void runForVerifiedUser();
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  return (
    <CoreStateCtx.Provider
      value={{
        state,
        loading,
        error,
        refresh: async () => {
          if (user) await load(user.id);
        },
      }}
    >
      {children}
    </CoreStateCtx.Provider>
  );
}

export const useCoreState = () => useContext(CoreStateCtx);

/**
 * Gate for AI features. Renders children only when:
 * - user is unauthenticated (demo mode), OR
 * - user is authenticated AND core state is loaded.
 */
export function RequireCoreState({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { state, loading } = useCoreState();

  const waiting = authLoading || (user && (loading || !state));

  if (waiting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
