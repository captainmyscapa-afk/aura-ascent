import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Check,
  Calendar,
  Compass,
  Radio,
  ChevronRight,
  Hotel,
  Lock,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/aurum/AppShell";
import { GlobalTimeHub } from "@/components/aurum/GlobalTimeHub";
import { LiveIntelligenceFeed } from "@/components/aurum/LiveIntelligenceFeed";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import { useAuth } from "@/hooks/useAuth";
import { RequireCoreState } from "@/hooks/useCoreState";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <RequireCoreState>
      <Dashboard />
    </RequireCoreState>
  ),
});

const WELCOMES = [
  "Today is a quiet step toward an extraordinary life.",
  "The world rewards those who show up with intention. Begin.",
  "Elite operators do today what others postpone. Move first.",
  "A single conversation today can reshape your next decade.",
  "Refinement is built in silence, before the world notices.",
  "Your network is watching. Give them something worth remembering.",
  "Discipline is the architecture of luxury. Build deliberately.",
  "Make today undeniable — in craft, in presence, in execution.",
];

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Dashboard() {
  const { industry, industryId, setIndustry } = useIndustry();
  const { session } = useAuth();
  const isDemo = !session;
  const now = useNow();
  const [done, setDone] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const toggle = (i: number) => setDone((d) => ({ ...d, [i]: !d[i] }));

  const completed = industry.dailyObjectives.filter((_, i) => done[i]).length;
  const total = industry.dailyObjectives.length;

  const welcome = useMemo(() => {
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    return WELCOMES[dayOfYear % WELCOMES.length];
  }, [now]);

  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateLong = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const hubs = INDUSTRY_LIST.map((m) => ({
    ...m,
    active: m.id === industryId,
    signals: m.intelFeed.length,
    nextEvent: m.upcoming[0],
  }));

  const hospitality = {
    id: "hospitality" as const,
    label: "Hospitality",
    modeLabel: "Hospitality Mode",
    icon: Hotel,
    ambientImage: INDUSTRY_LIST[1].ambientImage,
  };

  return (
    <AppShell>
      {isDemo && (
        <div className="mb-6 flex items-center justify-between gap-4 glass rounded-xl px-4 sm:px-5 py-3 border border-primary/20 animate-fade-up">
          <div className="flex items-center gap-3 min-w-0">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.32em] text-primary/80 uppercase">Demo mode</div>
              <div className="text-sm text-foreground/90 truncate">
                Sign in to unlock the full experience — memory, persistence, unlimited AI.
              </div>
            </div>
          </div>
          <Link
            to="/login"
            className="shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs tracking-wide text-primary-foreground shadow-[var(--shadow-gold)]"
            style={{ background: "var(--gradient-gold)" }}
          >
            Sign in
          </Link>
        </div>
      )}

      {/* ───────────── HEADER ───────────── */}
      <header className="mb-12 sm:mb-16 animate-fade-up">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-10 items-start">
          <div>
            <div className="flex items-baseline justify-between flex-wrap gap-3 mb-8">
              <div className="text-[10px] tracking-[0.4em] text-primary/70 uppercase">
                {dayName} · {dateLong}
              </div>
              <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground lg:hidden">
                {timeStr}
              </div>
            </div>

            <h1 className="font-serif text-[34px] sm:text-[52px] leading-[1.05] tracking-tight">
              Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"},
              <br />
              <span className="text-gold-gradient italic">Alexander.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {welcome}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/mentor"
                className="inline-flex items-center gap-2 bg-[var(--gradient-gold)] text-primary-foreground rounded-full px-5 py-2.5 text-sm shadow-[var(--shadow-gold)]"
              >
                <Sparkles className="h-4 w-4" /> Speak with AURUM
              </Link>
              <Link
                to="/intelligence"
                className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 text-sm border border-border/60 hover:border-primary/50 transition-colors"
              >
                <Radio className="h-4 w-4 text-primary" /> Open Intelligence
              </Link>
            </div>
          </div>

          <aside className="hidden lg:flex flex-col gap-3 items-end">
            <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground">
              {timeStr}
            </div>
            <GlobalTimeHub compact />
          </aside>
        </div>

        <div className="mt-8 lg:hidden">
          <GlobalTimeHub compact />
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <section className="lg:col-span-2 space-y-6 lg:space-y-8">
          <Card>
            <CardHeader
              eyebrow={`TODAY · ${industry.modeLabel.toUpperCase()}`}
              title="Daily ritual"
              meta={`${completed} of ${total}`}
            />
            <div className="space-y-1.5">
              {industry.dailyObjectives.map((t, i) => {
                const isDone = !!done[i];
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={`group w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all ${
                      isDone ? "bg-secondary/20" : "hover:bg-secondary/40"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors ${
                        isDone
                          ? "bg-primary border-primary"
                          : "border-border/70 group-hover:border-primary/60"
                      }`}
                    >
                      {isDone && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div
                      className={`flex-1 text-[15px] leading-snug ${
                        isDone ? "text-muted-foreground/70 line-through" : "text-foreground"
                      }`}
                    >
                      {t}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 h-px w-full bg-border/40 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--gradient-gold)] transition-all duration-500"
                style={{ width: `${(completed / total) * 100}%`, height: "1px" }}
              />
            </div>
            <div className="mt-3 text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
              Momentum · {Math.round((completed / total) * 100)}%
            </div>
          </Card>

          <div>
            <SubHeading eyebrow="LUXURY HUBS" title="Your ecosystems" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {hubs.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setIndustry(m.id)}
                    className={`group relative aspect-[4/5] rounded-xl overflow-hidden border transition-all text-left ${
                      m.active
                        ? "border-primary/60 ring-1 ring-primary/30"
                        : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <img
                      src={m.ambientImage}
                      alt={m.label}
                      className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div className="relative h-full p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <Icon className="h-4 w-4 text-primary/90" />
                        {m.active && (
                          <span className="text-[8px] tracking-[0.3em] text-primary/90">LIVE</span>
                        )}
                      </div>
                      <div>
                        <div className="font-serif text-lg leading-tight">{m.label}</div>
                        <div className="mt-1 text-[10px] tracking-wider text-muted-foreground uppercase">
                          {m.signals} signals
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border/40 opacity-60">
                <img
                  src={hospitality.ambientImage}
                  alt={hospitality.label}
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="relative h-full p-4 flex flex-col justify-between">
                  <Hotel className="h-4 w-4 text-primary/70" />
                  <div>
                    <div className="font-serif text-lg leading-tight">Hospitality</div>
                    <div className="mt-1 text-[10px] tracking-wider text-muted-foreground uppercase">
                      Arriving soon
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <LiveIntelligenceFeed />
        </section>

        <aside className="space-y-6 lg:space-y-8">
          <Card accent>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="text-[10px] tracking-[0.34em] text-primary/80">
                AURUM RECOMMENDS
              </div>
            </div>
            <p className="font-serif text-[20px] leading-snug">
              "{industry.aiRecommendation}"
            </p>
            <button className="mt-5 w-full text-sm rounded-full py-2.5 bg-[var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-gold)]">
              Generate outreach
            </button>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="text-[10px] tracking-[0.34em] text-foreground">UPCOMING</div>
              </div>
              <span className="text-[10px] tracking-[0.3em] text-muted-foreground">
                {industry.upcoming.length}
              </span>
            </div>
            <div className="space-y-4">
              {industry.upcoming.map(([d, t]) => (
                <div key={t} className="group flex items-start gap-4 cursor-pointer">
                  <div className="shrink-0 w-12">
                    <div className="font-mono text-[10px] tracking-widest text-primary/80 uppercase">
                      {d}
                    </div>
                  </div>
                  <div className="flex-1 text-[14px] leading-snug text-foreground/90 group-hover:text-primary transition-colors">
                    {t}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Compass className="h-4 w-4 text-primary" />
              <div className="text-[10px] tracking-[0.34em] text-foreground">PROGRESSION</div>
            </div>
            <div className="font-serif text-2xl">Initiate II</div>
            <div className="text-[12px] text-muted-foreground mt-1">
              Phase 02 · {industry.modeLabel}
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
                <span>NEXT TIER</span>
                <span>67%</span>
              </div>
              <div className="h-1 w-full bg-border/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--gradient-gold)] rounded-full"
                  style={{ width: "67%" }}
                />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-5 gap-1.5">
              {["Initiate", "Operator", "Insider", "Counsel", "Aurum"].map((tier, i) => (
                <div key={tier} className="text-center">
                  <div
                    className={`h-1.5 w-full rounded-full ${
                      i <= 1 ? "bg-[var(--gradient-gold)]" : "bg-border/40"
                    }`}
                  />
                  <div
                    className={`mt-2 text-[9px] tracking-wider uppercase ${
                      i <= 1 ? "text-foreground/80" : "text-muted-foreground/60"
                    }`}
                  >
                    {tier}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className={`relative glass rounded-2xl p-6 sm:p-7 overflow-hidden ${
        accent ? "ring-gold" : ""
      }`}
    >
      {accent && (
        <div className="absolute inset-0 bg-[var(--gradient-gold)] opacity-[0.04] pointer-events-none" />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function CardHeader({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-5 gap-4">
      <div>
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">{eyebrow}</div>
        <h2 className="font-serif text-xl sm:text-[22px] leading-tight">{title}</h2>
      </div>
      {meta && <div className="text-xs text-muted-foreground font-mono shrink-0">{meta}</div>}
    </div>
  );
}

function SubHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">{eyebrow}</div>
      <h2 className="font-serif text-xl sm:text-[22px] leading-tight">{title}</h2>
    </div>
  );
}
