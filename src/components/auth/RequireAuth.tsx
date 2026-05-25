import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login", search: { redirect: pathname } as never, replace: true });
    }
  }, [loading, session, navigate, pathname]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
