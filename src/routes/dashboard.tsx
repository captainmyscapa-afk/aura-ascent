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
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { GlobalTimeHub } from "@/components/aurum/GlobalTimeHub";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import type { IndustryId } from "@/lib/industry/types";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  generateRecommendation,
  generateDailyTasks,
  generateUpcomingEvents,
} from "@/lib/identity.functions";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
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

const INDUSTRY_TO_TRACK: Record<IndustryId, string> = {
  yachts: "yachting",
  villas: "property",
  jets: "aviation",
  cars: "automotive",
};

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function isoDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
function weekStartIso(d = new Date()) {
  const dt = new Date(d);
  const day = dt.getUTCDay();
  const diff = (day + 6) % 7; // Monday as start
  dt.setUTCDate(dt.getUTCDate() - diff);
  return dt.toISOString().slice(0, 10);
}

type CoreState = {
  mode: string;
  level: string;
  goal: string;
  streak: number;
  current_focus: string;
  ai_summary: { recommendation?: string } | null;
  ai_summary_updated_at: string | null;
  daily_tasks: string[] | null;
  daily_tasks_date: string | null;
  upcoming_events: { date: string; title: string }[] | null;
  upcoming_events_week_start: string | null;
};

export default function Dashboard() {
  const { industry, industryId, setIndustry } = useIndustry();
  const { session, user } = useAuth();
  const isDemo = !session;
  const now = useNow();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [core, setCore] = useState<CoreState | null>(null);

  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<string[]>(industry.dailyObjectives);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [events, setEvents] = useState<{ date: string; title: string }[]>(
    industry.upcoming.map(([d, t]) => ({ date: d, title: t })),
  );
  const [eventsLoading, setEventsLoading] = useState(false);

  const [done, setDone] = useState<Record<number, boolean>>({});
  const toggle = (i: number) => setDone((d) => ({ ...d, [i]: !d[i] }));

  const recFn = useServerFn(generateRecommendation);
  const tasksFn = useServerFn(generateDailyTasks);
  const eventsFn = useServerFn(generateUpcomingEvents);

  // Load profile name
  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("user_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setProfileName((data as { full_name: string | null } | null)?.full_name ?? null);
      });
    return () => { alive = false; };
  }, [user]);

  // Load core state, refresh AI when stale
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("aurum_core_state")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      const c = (data as unknown as CoreState | null) ?? null;
      setCore(c);

      const ctx = {
        mode: industry.label,
        level: c?.level,
        goal: c?.goal,
        streak: c?.streak,
        phase: industry.phaseLabel,
      };

      // Recommendation — daily
      const recStale =
        !c?.ai_summary?.recommendation ||
        !c?.ai_summary_updated_at ||
        Date.now() - new Date(c.ai_summary_updated_at).getTime() > 86_400_000;
      if (recStale) {
        refreshRecommendation(ctx);
      } else {
        setRecommendation(c.ai_summary?.recommendation ?? null);
      }

      // Daily tasks — daily
      if (c?.daily_tasks && c.daily_tasks_date === isoDay()) {
        setDailyTasks(c.daily_tasks);
      } else {
        refreshDailyTasks(ctx);
      }

      // Upcoming — weekly
      if (c?.upcoming_events && c.upcoming_events_week_start === weekStartIso()) {
        setEvents(c.upcoming_events);
      } else {
        refreshEvents(industry.label);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, industryId]);

  async function refreshRecommendation(ctx: {
    mode: string; level?: string; goal?: string; streak?: number; phase?: string;
  }) {
    if (!user) return;
    setRecLoading(true);
    try {
      const { recommendation: text } = await recFn({ data: ctx });
      setRecommendation(text);
      await supabase
        .from("aurum_core_state")
        .update({
          ai_summary: { recommendation: text },
          ai_summary_updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } catch (e) {
      console.error(e);
    } finally {
      setRecLoading(false);
    }
  }

  async function refreshDailyTasks(ctx: {
    mode: string; level?: string; goal?: string; streak?: number; phase?: string;
  }) {
    if (!user) return;
    setTasksLoading(true);
    try {
      const { tasks } = await tasksFn({ data: ctx });
      setDailyTasks(tasks);
      setDone({});
      await supabase
        .from("aurum_core_state")
        .update({ daily_tasks: tasks, daily_tasks_date: isoDay() })
        .eq("user_id", user.id);
    } catch (e) {
      console.error(e);
    } finally {
      setTasksLoading(false);
    }
  }

  async function refreshEvents(mode: string) {
    if (!user) return;
    setEventsLoading(true);
    try {
      const { events: ev } = await eventsFn({ data: { mode } });
      setEvents(ev);
      await supabase
        .from("aurum_core_state")
        .update({ upcoming_events: ev, upcoming_events_week_start: weekStartIso() })
        .eq("user_id", user.id);
    } catch (e) {
      console.error(e);
    } finally {
      setEventsLoading(false);
    }
  }

  const completed = dailyTasks.filter((_, i) => done[i]).length;
  const total = dailyTasks.length || 1;

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
              <span className="text-gold-gradient italic">{profileName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Operator"}.</span>
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
              meta={tasksLoading ? "…" : `${completed} of ${total}`}
            />
            <div className="space-y-1.5">
              {dailyTasks.map((t, i) => {
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
            <SubHeading eyebrow="ACADEMY" title="Your tracks" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {hubs.map((m) => {
                const Icon = m.icon;
                const trackSlug = INDUSTRY_TO_TRACK[m.id];
                return (
                  <Link
                    key={m.id}
                    to="/academy"
                    search={{ track: trackSlug }}
                    className={`group relative aspect-[4/5] rounded-xl overflow-hidden border transition-all text-left block ${
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
                          {m.trackProgress}/{m.trackModules} complete
                        </div>
                      </div>
                    </div>
                  </Link>
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
        </section>

        <aside className="space-y-6 lg:space-y-8">
          <Card accent>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="text-[10px] tracking-[0.34em] text-primary/80">
                AURUM RECOMMENDS
              </div>
              {recLoading && (
                <RefreshCw className="h-3 w-3 text-primary/60 animate-spin ml-auto" />
              )}
            </div>
            <p className="font-serif text-[20px] leading-snug">
              "{recommendation || industry.aiRecommendation}"
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
                {eventsLoading ? "…" : events.length}
              </span>
            </div>
            <div className="space-y-4">
              {events.map((ev) => (
                <div key={ev.title} className="group flex items-start gap-4 cursor-pointer">
                  <div className="shrink-0 w-12">
                    <div className="font-mono text-[10px] tracking-widest text-primary/80 uppercase">
                      {ev.date}
                    </div>
                  </div>
                  <div className="flex-1 text-[14px] leading-snug text-foreground/90 group-hover:text-primary transition-colors">
                    {ev.title}
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
