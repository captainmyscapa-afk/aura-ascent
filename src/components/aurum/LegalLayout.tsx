import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/aurum/Logo";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      </div>

      <header className="border-b border-border/40">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
          Aurum OS
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl text-foreground mb-3">{title}</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated {updated}</p>

        <div className="space-y-10">{children}</div>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="max-w-3xl mx-auto px-6 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 Aurum OS. All rights reserved.</span>
          <a href="mailto:hello@aurumos.com" className="hover:text-foreground transition-colors">
            hello@aurumos.com
          </a>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-serif text-2xl text-foreground mb-3">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground/85 [&_strong]:font-medium">
        {children}
      </div>
    </section>
  );
}

export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
      {children}
    </div>
  );
}
