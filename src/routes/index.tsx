import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Compass,
  KeyRound,
  Sailboat,
  Plane,
  House,
  Car,
  Hotel,
  Activity,
  TrendingUp,
  Trophy,
  Quote,
} from "lucide-react";
import heroImg from "@/assets/hero-yacht.jpg";
import villaImg from "@/assets/eco-villa.jpg";
import jetImg from "@/assets/eco-jet.jpg";
import carImg from "@/assets/eco-car.jpg";
import { Logo } from "@/components/aurum/Logo";

export const Route = createFileRoute("/")({
  component: Landing,
});

const industries = [
  {
    icon: Sailboat,
    name: "Yachting",
    note: "Brokerage · Charter · Med & Caribbean",
    image: heroImg,
  },
  {
    icon: Plane,
    name: "Private Aviation",
    note: "Aircraft brokerage · charter · fractional",
    image: jetImg,
  },
  {
    icon: House,
    name: "Luxury Real Estate",
    note: "Ultra-prime · branded residences",
    image: villaImg,
  },
  {
    icon: Car,
    name: "Exotic Automotive",
    note: "Hypercars · collectors · allocations",
    image: carImg,
  },
  {
    icon: Hotel,
    name: "Elite Hospitality",
    note: "Five-star · private members · concierge",
    image: heroImg,
  },
];

const steps = [
  {
    n: "01",
    icon: Sparkles,
    title: "Join",
    desc: "Request access and define the elite industry you're entering.",
  },
  {
    n: "02",
    icon: Compass,
    title: "Build Your Roadmap",
    desc: "AURUM AI designs a personalized progression path — daily, weekly, monthly.",
  },
  {
    n: "03",
    icon: KeyRound,
    title: "Access Elite Opportunities",
    desc: "Unlock private circles, real intelligence, and insider introductions.",
  },
];

const levels = [
  { tier: "I", name: "Initiate", note: "Foundations · taste · vocabulary" },
  { tier: "II", name: "Operator", note: "Daily rituals · live deals · first network" },
  { tier: "III", name: "Insider", note: "Private circles · sourced opportunities" },
  { tier: "IV", name: "Authority", note: "Reputation · mandates · principal access" },
  { tier: "V", name: "Aurum", note: "Top tier · invitation-only ecosystem" },
];

const testimonials = [
  {
    q: "AURUM compressed what would have been five years of proximity into a single season.",
    n: "M. Donatelli",
    r: "Yacht Broker · Monaco",
  },
  {
    q: "It feels less like a platform and more like a private mentor who never sleeps.",
    n: "H. Vargas",
    r: "Private Office · Dubai",
  },
  {
    q: "The daily rituals are the difference. I show up to this industry like an insider now.",
    n: "A. Levy",
    r: "Aviation Group · NYC",
  },
];

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

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 pt-7">
        <Logo />
        <nav className="hidden md:flex items-center gap-10 text-[11px] tracking-[0.3em] text-muted-foreground">
          <a className="hover:text-foreground transition-colors" href="#industries">INDUSTRIES</a>
          <a className="hover:text-foreground transition-colors" href="#how">HOW IT WORKS</a>
          <a className="hover:text-foreground transition-colors" href="#system">SYSTEM</a>
          <a className="hover:text-foreground transition-colors" href="#progression">PROGRESSION</a>
        </nav>
        <Link
          to="/onboarding"
          className="hidden sm:inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-[11px] tracking-[0.25em] text-foreground hover:ring-gold transition-all"
        >
          REQUEST ACCESS
        </Link>
      </header>

      {/* ============ HERO ============ */}
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
            Join Early Access
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm text-foreground hover:ring-gold transition-all"
          >
            Explore Platform
          </Link>
        </div>

        {/* Cinematic hero visual */}
        <div
          className="relative mt-24 mx-auto max-w-5xl animate-fade-up"
          style={{ animationDelay: "360ms" }}
        >
          <div className="absolute -inset-6 rounded-[2rem] blur-2xl opacity-30"
               style={{ background: "var(--gradient-gold)" }} />
          <div className="relative glass-strong rounded-2xl overflow-hidden shadow-[var(--shadow-elegant)]">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ============ INDUSTRIES SHOWCASE ============ */}
      <section id="industries" className="relative z-10 px-6 sm:px-10 lg:px-16 py-28 max-w-7xl mx-auto">
        <SectionLabel kicker="ECOSYSTEM" title="Five elite worlds. One operating system." sub="Switch modes inside AURUM and the platform retunes its intelligence, mentorship, and rituals to your chosen industry." />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map(({ icon: Icon, name, note, image }, i) => (
            <article
              key={name}
              className="group relative h-[340px] rounded-2xl overflow-hidden glass-strong cursor-pointer animate-fade-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <img
                src={image}
                alt={name}
                className="absolute inset-0 h-full w-full object-cover opacity-40 transition-all duration-700 group-hover:opacity-60 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="relative h-full p-7 flex flex-col justify-end">
                <Icon className="h-6 w-6 text-primary mb-4 transition-transform duration-500 group-hover:-translate-y-1" />
                <div className="font-serif text-2xl text-foreground">{name}</div>
                <div className="mt-2 text-sm text-muted-foreground">{note}</div>
                <div className="mt-5 flex items-center gap-2 text-[11px] tracking-[0.28em] text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  ENTER MODE <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="relative z-10 px-6 sm:px-10 lg:px-16 py-28 max-w-6xl mx-auto">
        <SectionLabel kicker="HOW IT WORKS" title="Three steps. One transformation." />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden glass-strong">
          {steps.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="p-10 bg-background/30 hover:bg-background/60 transition-colors">
              <div className="flex items-center justify-between mb-8">
                <Icon className="h-6 w-6 text-primary" />
                <span className="font-serif text-3xl text-primary/40">{n}</span>
              </div>
              <h3 className="font-serif text-2xl text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ DASHBOARD / SYSTEM ============ */}
      <section id="system" className="relative z-10 px-6 sm:px-10 lg:px-16 py-28 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel kicker="THE SYSTEM" title="Your private command center." align="left" sub="A cinematic dashboard built around your daily rituals, market intelligence, and personal progression — quietly powered by AURUM AI." />
            <ul className="mt-10 space-y-5">
              {[
                ["AI Mentor", "A senior counsel that knows your industry — and your week."],
                ["Live Intelligence", "Curated market signals, deals, and people movement, hourly."],
                ["Daily Rituals", "Five precise actions that compound into an insider profile."],
                ["Private Circles", "Mastermind rooms, peer cohorts, and 1:1 introductions."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <div className="text-sm tracking-wide text-foreground">{t}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/dashboard"
              className="mt-10 inline-flex items-center gap-2 text-sm text-primary hover:gap-3 transition-all"
            >
              Enter Mission Control <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl blur-3xl opacity-25"
                 style={{ background: "var(--gradient-gold)" }} />
            <div className="relative glass-strong rounded-2xl overflow-hidden shadow-[var(--shadow-elegant)]">
              <DashboardMock compact />
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROGRESSION ============ */}
      <section id="progression" className="relative z-10 px-6 sm:px-10 lg:px-16 py-28 max-w-6xl mx-auto">
        <SectionLabel kicker="PROGRESSION" title="Five tiers. One ascent." sub="Every action inside AURUM moves you up an elegant progression — from Initiate to Aurum." />

        <div className="mt-16 relative">
          <div className="hidden md:block absolute left-0 right-0 top-1/2 h-px"
               style={{ background: "linear-gradient(90deg, transparent, oklch(0.82 0.09 85 / 50%), transparent)" }} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative">
            {levels.map((l, i) => (
              <div
                key={l.tier}
                className="relative glass rounded-xl p-6 text-center animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="font-serif text-3xl text-gold-gradient">{l.tier}</div>
                <div className="mt-3 text-sm tracking-wide text-foreground">{l.name}</div>
                <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{l.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-xs tracking-[0.3em] text-muted-foreground">
          <span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-primary/70" /> MILESTONES</span>
          <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary/70" /> COMPOUNDING DAILY</span>
          <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary/70" /> LIVE PROGRESSION</span>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="relative z-10 px-6 sm:px-10 lg:px-16 py-28 max-w-6xl mx-auto">
        <SectionLabel kicker="VOICES" title="Quiet confidence from inside the room." />
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <figure
              key={t.n}
              className="glass-strong rounded-2xl p-8 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Quote className="h-5 w-5 text-primary/70 mb-5" />
              <blockquote className="font-serif text-lg leading-relaxed text-foreground/90">
                "{t.q}"
              </blockquote>
              <figcaption className="mt-6 text-xs tracking-[0.25em] text-muted-foreground">
                {t.n.toUpperCase()} · {t.r.toUpperCase()}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative z-10 px-6 sm:px-10 lg:px-16 py-32 max-w-4xl mx-auto text-center">
        <div className="relative glass-strong rounded-3xl p-12 sm:p-16 overflow-hidden">
          <div aria-hidden className="absolute -inset-10 opacity-30 blur-3xl"
               style={{ background: "var(--gradient-gold)" }} />
          <div className="relative">
            <div className="text-[10px] tracking-[0.4em] text-primary/90 mb-6">EARLY ACCESS</div>
            <h2 className="font-serif text-4xl sm:text-5xl leading-tight text-foreground">
              Step into the world <br />
              <span className="text-gold-gradient italic">you were built for.</span>
            </h2>
            <p className="mt-6 mx-auto max-w-lg text-sm text-muted-foreground">
              Membership opens in waves. Join the early access list to enter
              before the next cohort closes.
            </p>
            <Link
              to="/onboarding"
              className="mt-10 inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm tracking-wide text-primary-foreground shadow-[var(--shadow-gold)] transition-transform hover:scale-[1.02]"
              style={{ background: "var(--gradient-gold)" }}
            >
              Join Early Access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 px-6 sm:px-10 lg:px-16 pb-14 pt-10 border-t border-border/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo />
          <div className="text-[10px] tracking-[0.3em] text-muted-foreground">
            STOCKHOLM · MONACO · MIAMI · DUBAI
          </div>
          <div className="text-[10px] tracking-[0.3em] text-muted-foreground">
            © AURUM OS · {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- helpers ---------- */

function SectionLabel({
  kicker,
  title,
  sub,
  align = "center",
}: {
  kicker: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  const a = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`${a} max-w-2xl`}>
      <div className="text-[10px] tracking-[0.4em] text-primary/80 mb-4">{kicker}</div>
      <h2 className="font-serif text-3xl sm:text-5xl leading-tight text-foreground">
        {title}
      </h2>
      {sub && (
        <p className="mt-5 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {sub}
        </p>
      )}
    </div>
  );
}

function DashboardMock({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative p-5 sm:p-7 bg-[oklch(0.14_0.008_240)]">
      {/* top bar */}
      <div className="flex items-center justify-between text-[10px] tracking-[0.3em] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          AURUM OS · YACHT MODE
        </div>
        <div>09:42 · MONACO</div>
      </div>

      <div className={`mt-6 grid gap-4 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        {[
          ["Daily Score", "92"],
          ["Network", "248"],
          ["Mandates", "6"],
          ["Authority", "Tier II"],
        ].slice(0, compact ? 2 : 4).map(([k, v]) => (
          <div key={k} className="glass rounded-xl p-4">
            <div className="text-[10px] tracking-[0.25em] text-muted-foreground">{k}</div>
            <div className="mt-2 font-serif text-2xl text-foreground">{v}</div>
          </div>
        ))}
      </div>

      <div className={`mt-5 grid gap-4 ${compact ? "grid-cols-1" : "lg:grid-cols-3"}`}>
        <div className={`glass rounded-xl p-5 ${compact ? "" : "lg:col-span-2"}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground">TODAY'S RITUALS</div>
            <div className="text-[10px] tracking-[0.25em] text-primary/80">4 / 5</div>
          </div>
          <ul className="space-y-3">
            {[
              "Message 5 brokers in Monaco",
              "Publish Med charter market insight",
              "Follow up with 2 Cannes prospects",
              "Academy · Luxury sales psychology · M4",
            ].map((t, i) => (
              <li key={t} className="flex items-center gap-3 text-sm">
                <span className={`h-1.5 w-1.5 rounded-full ${i < 3 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                <span className={i < 3 ? "text-foreground/80 line-through decoration-primary/40" : "text-foreground/90"}>
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {!compact && (
          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-3">PROGRESSION</div>
            <div className="font-serif text-lg text-foreground">Tier II · Operator</div>
            <div className="mt-3 h-1.5 rounded-full bg-border/60 overflow-hidden">
              <div className="h-full w-[64%] rounded-full" style={{ background: "var(--gradient-gold)" }} />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">64% to Insider</div>
            <div className="mt-5 text-[10px] tracking-[0.3em] text-muted-foreground">NEXT MILESTONE</div>
            <div className="mt-1 text-sm text-foreground/90">First sourced UHNW introduction</div>
          </div>
        )}
      </div>
    </div>
  );
}
