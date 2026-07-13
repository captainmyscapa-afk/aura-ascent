import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthShell, Field, inputCls, primaryBtnCls } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/app", replace: true });
  }, [loading, session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Please enter your full name.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirm) return setError("Passwords don't match.");

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setSubmitting(false);
      setError(
        /already/i.test(error.message)
          ? "An account with this email already exists."
          : /weak|password/i.test(error.message)
            ? "Please choose a stronger password."
            : "We couldn't create your account. Please try again.",
      );
      return;
    }

    // Auto sign-in (auto-confirm enabled)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInErr) {
      navigate({ to: "/login", replace: true });
      return;
    }
    navigate({ to: "/onboarding", replace: true });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Begin your ascent into elite industries"
      footer={
        <>
          Already a member?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Full name">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
            placeholder="Alexander Hart"
            autoComplete="name"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@domain.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            placeholder="Repeat password"
            autoComplete="new-password"
          />
        </Field>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={primaryBtnCls}
          style={{ background: "var(--gradient-gold)" }}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
