import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
  loading: false,
  error: null,
  refresh: async () => {},
});

export function CoreStateProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<CoreState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedFor = useRef<string | null>(null);

  const initForUser = async (uid: string) => {
    // Re-verify the user with the Auth server before any DB write.
    const { data: verified, error: verifyErr } = await supabase.auth.getUser();
    if (verifyErr || !verified?.user || verified.user.id !== uid) {
      console.warn("[aurum_core_state] skipping init — user not verified");
      return;
    }

    console.info("[aurum_core_state] AUTH LOADED");
    console.info("[aurum_core_state] USER FOUND", uid);
    console.info("[aurum_core_state] CHECKING CORE STATE");

    const { data: existing, error: selErr } = await supabase
      .from("aurum_core_state")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (selErr) {
      console.error("[aurum_core_state] select failed:", selErr);
      setError(selErr.message);
      return;
    }

    if (existing) {
      console.info("[aurum_core_state] existing row loaded", existing.id);
      setState(existing as CoreState);
      return;
    }

    console.info("[aurum_core_state] CREATING CORE STATE");
    const { data: inserted, error: insErr } = await supabase
      .from("aurum_core_state")
      .insert({ user_id: uid, ...DEFAULTS })
      .select()
      .single();

    if (insErr || !inserted) {
      console.error("[aurum_core_state] INSERT failed for user", uid, insErr);
      setError(insErr?.message ?? "Failed to initialize core state");
      return;
    }

    console.info("[aurum_core_state] insert success", inserted.id);
    setState(inserted as CoreState);
  };

  useEffect(() => {
    // Wait for Supabase auth to finish restoring before doing anything.
    if (authLoading) return;

    // Signed out — clear and do nothing. NEVER perform DB writes here.
    if (!user) {
      setState(null);
      setError(null);
      setLoading(false);
      initializedFor.current = null;
      return;
    }

    // Only initialize once per user. Fire-and-forget so signup/login flows
    // are NEVER blocked or interfered with by core-state initialization.
    if (initializedFor.current === user.id) return;
    initializedFor.current = user.id;

    setLoading(true);
    setError(null);
    void initForUser(user.id).finally(() => setLoading(false));
  }, [user?.id, authLoading]);

  return (
    <CoreStateCtx.Provider
      value={{
        state,
        loading,
        error,
        refresh: async () => {
          if (user) await initForUser(user.id);
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
