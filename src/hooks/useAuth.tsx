import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

// ─────────────────────────────────────────────────────────────────────────
// TEMP · DEMO MODE (Captain, Sept 2026)
// While true, a visitor with no session is silently signed in with the demo
// account's own email/password (read from local env vars only — never
// committed to git) the moment the app loads. This shows the real,
// fully-populated account exactly as if you'd logged in by hand, with zero
// login step — for local review only.
// Set VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD in your local .env (gitignored,
// never pushed). If either is missing, this does nothing and the app
// behaves exactly as it does today (normal login required).
// TO REVERT to requiring real signup/login exactly as before: flip this to
// false, or just delete/blank VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD in .env
// — nothing else needs to change.
const DEMO_MODE = true;
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;
// ─────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Guards against overlapping signInWithPassword() calls (e.g. sign-out firing
  // onAuthStateChange with a null session while getSession() is still in flight).
  const demoInFlight = useRef(false);

  useEffect(() => {
    // Whenever we land on a null session (first load, or right after a sign-out),
    // silently sign back in as the demo account instead of just sitting there
    // signed out. A real sign-in/sign-up still works and simply replaces it.
    const ensureDemo = async () => {
      if (!DEMO_MODE || !DEMO_EMAIL || !DEMO_PASSWORD || demoInFlight.current) { setLoading(false); return; }
      demoInFlight.current = true;
      const { data: demo, error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      demoInFlight.current = false;
      if (!error && demo.session) {
        setSession(demo.session);
      } else {
        if (error) console.warn("[DEMO_MODE] auto sign-in failed — check VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD in .env", error.message);
        setSession(null);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) { void ensureDemo(); return; }
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { void ensureDemo(); return; }
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
