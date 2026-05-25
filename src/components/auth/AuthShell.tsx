import type { ReactNode } from "react";
import { Logo } from "@/components/aurum/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 py-12 overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl opacity-[0.18]"
          style={{ background: "var(--gradient-gold)" }}
        />
      </div>

      <div className="w-full max-w-[420px] animate-fade-up">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="glass-strong rounded-3xl p-8 sm:p-10 shadow-[var(--shadow-elegant)]">
          <h1 className="font-serif text-[28px] leading-tight tracking-tight text-center">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground text-center">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] tracking-[0.25em] text-muted-foreground uppercase mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full h-12 rounded-xl bg-[oklch(0.18_0.01_240/60%)] border border-border/60 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20 hover:border-border";

export const primaryBtnCls =
  "w-full h-12 rounded-xl text-sm tracking-wide text-primary-foreground shadow-[var(--shadow-gold)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2";
