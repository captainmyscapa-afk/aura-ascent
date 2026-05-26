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
    const { data, error: selErr } = await supabase
      .from("aurum_core_state")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    if (selErr) {
      setError(selErr.message);
      setLoading(false);
      return;
    }

    if (data) {
      setState(data as CoreState);
      setLoading(false);
      return;
    }

    const { data: inserted, error: insErr } = await supabase
      .from("aurum_core_state")
      .insert({ user_id: uid, ...DEFAULTS })
      .select()
      .single();

    if (insErr) {
      setError(insErr.message);
      setLoading(false);
      return;
    }
    setState(inserted as CoreState);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    load(user.id);
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
