import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Plane, Building2, Sailboat, House, Car } from "lucide-react";
import heroImg from "@/assets/hero-yacht.jpg";
import { Logo } from "@/components/aurum/Logo";

export const Route = createFileRoute("/")({
  component: Landing,
});

const ecosystems = [
  { icon: Sailboat, name: "Brokerage, charter & UHNW clients", note: "Prime real estate & private estates" },
  { icon: Building2, name: "Villas", note: "Ultra-prime real estate" },
  { icon: Plane, name: "Jets", note: "Private aviation" },
  { icon: Compass, name: "Cars", note: "Exotic & collector" },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="A matte-black superyacht at golden hour"
          className="h-full w-full object-cover opacity-50"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-[var(--gradient-overlay)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 pt-8">
        <Logo />
        <div className="hidden md:flex items-center gap-8 text-xs tracking-[0.28em] text-muted-foreground">
          <a className="hover:text-foreground transition-colors" href="#ecosystem">ECOSYSTEM</a>
          <a className="hover:text-foreground transition-colors" href="#system">SYSTEM</a>
          <a className="hover:text-foreground transition-colors" href="#manifesto">MANIFESTO</a>
        </div>
        <Link
          to="/onboarding"
          className="hidden sm:inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs tracking-[0.22em] text-foreground hover:ring-gold transition-all"
        >
          REQUEST ACCESS
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 sm:px-10 lg:px-16 pt-24 sm:pt-32 pb-24 max-w-6xl">
        <div className="flex items-center gap-3 text-[10px] tracking-[0.4em] text-primary/90 mb-7 animate-fade-up">
          <span className="h-px w-10 bg-primary/70" />
          ESTABLISHED FOR THE NEXT GENERATION OF ELITE OPERATORS
        </div>
        <h1
          className="font-serif text-[44px] sm:text-[68px] lg:text-[88px] leading-[1.02] tracking-tight text-foreground animate-fade-up"
          style={{ animationDelay: "80ms" }}
        >
          The operating system <br />
          for entry into <span className="text-gold-gradient italic">elite industries.</span>
        </h1>
        <p
          className="mt-8 max-w-xl text-[15px] sm:text-base leading-relaxed text-muted-foreground animate-fade-up"
          style={{ animationDelay: "180ms" }}
        >
          AURUM OS combines AI mentorship, real-time luxury market intelligence,
          daily execution rituals, and immersive networking into a single
          cinematic platform — the path from ambition to insider.
        </p>

        <div
          className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
          style={{ animationDelay: "260ms" }}
        >
          <Link
            to="/onboarding"
            className="group inline-flex items-center gap-3 bg-[var(--gradient-gold)] text-primary-foreground rounded-full px-6 py-3.5 text-sm tracking-wider shadow-[var(--shadow-gold)] transition-transform hover:scale-[1.02] text-slate-50"
          >
            Begin Initiation
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 glass rounded-full px-5 py-3 text-sm text-foreground hover:ring-gold transition-all"
          >
            Enter Mission Control
          </Link>
        </div>

        {/* Stat strip */}
        <div
          className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl animate-fade-up"
          style={{ animationDelay: "360ms" }}
        >
          {[
            ["1,284", "Active Operators"],
            ["94%", "30-Day Retention"],
            ["$2.4B", "Tracked Inventory"],
            ["6 Cities", "Insider Circles"],
          ].map(([k, v]) => (
            <div key={v}>
              <div className="font-serif text-3xl text-foreground">{k}</div>
              <div className="mt-1 text-[10px] tracking-[0.3em] text-muted-foreground">
                {v}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem strip */}
      <section
        id="ecosystem"
        className="relative z-10 border-t border-border/60 glass-strong"
      >
        <div className="px-6 sm:px-10 lg:px-16 py-10 grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/60">
          {ecosystems.map(({ icon: Icon, name, note }) => (
            <div
              key={name}
              className="bg-background/40 p-6 hover:bg-background/70 transition-colors group cursor-pointer"
            >
              <Icon className="h-5 w-5 text-primary/80 mb-4 transition-transform group-hover:-translate-y-0.5" />
              <div className="font-serif text-xl text-foreground">{name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto */}
      <section id="manifesto" className="relative z-10 px-6 sm:px-10 lg:px-16 py-32 max-w-3xl">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-4">MANIFESTO</div>
        <p className="font-serif text-2xl sm:text-3xl leading-snug text-foreground/90">
          The world's most rewarding industries are built on relationships, taste,
          and information that doesn't appear in search results. AURUM OS gives
          ambitious operators the daily structure, the intelligence, and the
          mentorship that has historically required a decade of proximity.
        </p>
        <div className="mt-10 hairline" />
        <div className="mt-6 text-xs tracking-[0.3em] text-muted-foreground">
          STOCKHOLM · MONACO · MIAMI · DUBAI
        </div>
      </section>
    </div>
  );
}
