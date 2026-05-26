import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-70"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl opacity-[0.18]"
             style={{ background: "var(--gradient-gold)" }} />
      </div>

      {/* Hero */}
      <section className="relative z-10 px-6 sm:px-10 lg:px-16 pt-28 sm:pt-36 pb-28 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 text-[10px] tracking-[0.4em] text-primary/90 mb-8 animate-fade-up">
          <span className="h-px w-8 bg-primary/60" />
          AURUM OS · BY INVITATION
          <span className="h-px w-8 bg-primary/60" />
        </div>

        <h1
          className="font-serif text-[44px] sm:text-[68px] lg:text-[92px] leading-[1.02] tracking-tight text-foreground animate-fade-up"
          style={{ animationDelay: "80ms" }}
        >
          The Operating System
          <br />
          for entering{" "}
          <span className="text-gold-gradient italic">elite luxury industries.</span>
        </h1>

        <p
          className="mt-8 mx-auto max-w-2xl text-[15px] sm:text-[17px] leading-relaxed text-muted-foreground animate-fade-up"
          style={{ animationDelay: "180ms" }}
        >
          AI-powered guidance, networking, and acceleration for ambitious people
          entering the worlds of yachting, private aviation, luxury real estate,
          exotic automotive, and elite lifestyle industries.
        </p>

        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-4 animate-fade-up"
          style={{ animationDelay: "260ms" }}
        >
          <Link
            to="/onboarding"
            className="group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm tracking-wide text-primary-foreground shadow-[var(--shadow-gold)] transition-transform hover:scale-[1.02]"
            style={{ background: "var(--gradient-gold)" }}
          >
            Join the full experience
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm text-foreground hover:ring-gold transition-all"
          >
            Explore Platform
          </Link>
        </div>
      </section>
    </div>
  );
}
