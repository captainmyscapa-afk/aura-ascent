import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { Sparkles, RefreshCw, CheckCircle2, Circle, Users, BookOpen, Send, Brain, Trophy } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateRoadmap, type Roadmap, type RoadmapTask } from "@/lib/identity.functions";

export const Route = createFileRoute("/roadmap")({
  component: RoadmapPage,
});

const TYPE_CONFIG: Record<RoadmapTask["type"], { label: string; icon: typeof Users; color: string; bg: string }> = {
  networking: { label: "Networking", icon: Users,    color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/20" },
  content:    { label: "Content",    icon: Sparkles, color: "text-violet-400",  bg: "bg-violet-400/10 border-violet-400/20" },
  learning:   { label: "Learning",   icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  outreach:   { label: "Outreach",   icon: Send,     color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20" },
  mindset:    { label: "Mindset",    icon: Brain,    color: "text-rose-400",    bg: "bg-rose-400/10 border-rose-400/20" },
};

const WEEK_BORDER = ["border-blue-400/30", "border-violet-400/30", "border-emerald-400/30", "border-amber-400/30"];
const WEEK_BG     = ["bg-blue-400/5",      "bg-violet-400/5",      "bg-emerald-400/5",      "bg-amber-400/5"];

function RoadmapPage() {
  const { industry, industryId } = useIndustry();
  const { state: core, update: updateCore } = useAurumCoreState();
  const { profile } = useUserProfile();
  const genRoadmap = useServerFn(generateRoadmap);

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  // Roadmaps are stored as a map keyed by industryId so each mode keeps its own.
  // Shape: core.roadmap = Record<string, Roadmap & { generated_at: string }>
  // Shape: core.roadmap_progress = Record<string, Record<string, boolean>>

  const getRoadmapMap = () =>
    (core?.roadmap as Record<string, Roadmap & { generated_at?: string }> | null) ?? {};
  const getProgressMap = () =>
    (core?.roadmap_progress as Record<string, Record<string, boolean>> | null) ?? {};

  const generate = useCallback(async () => {
    if (!core) return;
    setLoading(true);
    setError(null);
    try {
      const focus = typeof core.current_focus === "string" ? core.current_focus : undefined;
      const { roadmap: generated } = await genRoadmap({
        data: {
          industry: industry.label,
          level: core.current_level ?? "beginner",
          goal: focus ?? profile?.goal ?? undefined,
          ritualProfile: core.ritual_profile ?? undefined,
        },
      });
      const taggedRoadmap = { ...generated, industryId, generated_at: new Date().toISOString() };
      setRoadmap(taggedRoadmap);
      setCompleted({});
      const nextMap = { ...getRoadmapMap(), [industryId]: taggedRoadmap };
      const nextProgress = { ...getProgressMap(), [industryId]: {} };
      await updateCore({
        roadmap: nextMap as unknown as null,
        roadmap_generated_at: new Date().toISOString(),
        roadmap_progress: nextProgress as unknown as null,
      });
    } catch (e) {
      console.error("Roadmap generation failed:", e);
      setError(e instanceof Error ? e.message : "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [core, industry.label, profile?.goal, core?.ritual_profile, genRoadmap, updateCore, industryId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load this industry's roadmap from the map — only generate if none exists for this mode
  useEffect(() => {
    if (!core) return;
    const savedMap = getRoadmapMap();
    const saved = savedMap[industryId] ?? null;
    const progress = getProgressMap()[industryId] ?? null;

    if (saved) {
      setRoadmap(saved as Roadmap);
      setCompleted(progress ?? {});
    } else if (!loading) {
      void generate();
    }
  }, [core?.id, industryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTask = useCallback(async (taskId: string) => {
    setCompleted((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      const progressMap = getProgressMap();
      updateCore({ roadmap_progress: { ...progressMap, [industryId]: next } as unknown as null });
      return next;
    });
  }, [updateCore, core?.roadmap_progress, industryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalTasks = roadmap?.weeks.flatMap(w => w.days.flatMap(d => d.tasks)).length ?? 0;
  const completedCount = Object.values(completed).filter(Boolean).length;
  const pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const savedRoadmapForMode = getRoadmapMap()[industryId];
  const currentDay = savedRoadmapForMode?.generated_at
    ? Math.min(Math.floor((Date.now() - new Date(savedRoadmapForMode.generated_at).getTime()) / 86_400_000) + 1, 30)
    : core?.roadmap_generated_at
      ? Math.min(Math.floor((Date.now() - new Date(core.roadmap_generated_at).getTime()) / 86_400_000) + 1, 30)
      : 1;

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
          ROADMAP · {industry.modeLabel.toUpperCase()}
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl leading-tight">
              {loading ? "Building your roadmap…" : (roadmap?.headline ?? "Your 30-Day Plan")}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">
              A personalized 30-day entry plan built around your industry, level, and goals.
              Specific daily actions — check them off as you go.
            </p>
            {error && (
              <div className="mt-3 text-sm text-destructive border border-destructive/30 rounded-lg px-4 py-2.5 bg-destructive/5 max-w-xl">
                {error}
              </div>
            )}
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-primary/40 text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating…" : "Regenerate"}
          </button>
        </div>
      </div>

      {/* Progress */}
      {roadmap && !loading && (
        <div className="glass rounded-xl p-5 mb-8 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Overall progress</div>
            <div className="font-mono text-sm text-primary">{completedCount} / {totalTasks} · {pct}%</div>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "var(--gradient-gold)" }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {(Object.entries(TYPE_CONFIG) as [RoadmapTask["type"], typeof TYPE_CONFIG[RoadmapTask["type"]]][]).map(([type, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={type} className={`flex items-center gap-1.5 text-[11px] ${cfg.color}`}>
                  <Icon className="h-3 w-3" />{cfg.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="glass rounded-2xl p-16 text-center animate-fade-up">
          <div className="relative h-16 w-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
            <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <p className="font-serif text-2xl mb-2">Architecting your roadmap…</p>
          <p className="text-sm text-muted-foreground">
            AURUM is building 30 days of precision execution for {industry.label}.
            This takes about 15 seconds.
          </p>
        </div>
      )}

      {/* Roadmap content */}
      {roadmap && !loading && (
        <>
          {/* Week tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {roadmap.weeks.map((week, i) => (
              <button
                key={week.week}
                onClick={() => setActiveWeek(i)}
                className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                  activeWeek === i
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span className="hidden sm:inline">Week {week.week} · </span>{week.theme}
              </button>
            ))}
          </div>

          {/* Active week */}
          {roadmap.weeks[activeWeek] && (
            <div className={`glass rounded-2xl border ${WEEK_BORDER[activeWeek]} p-1 animate-fade-up`}>
              {/* Week header */}
              <div className={`rounded-xl p-6 mb-1 ${WEEK_BG[activeWeek]}`}>
                <div className="text-[10px] tracking-[0.3em] text-primary/80 mb-1">WEEK {roadmap.weeks[activeWeek].week}</div>
                <div className="font-serif text-2xl mb-1">{roadmap.weeks[activeWeek].theme}</div>
                <p className="text-sm text-muted-foreground">{roadmap.weeks[activeWeek].focus}</p>
              </div>

              {/* Days */}
              <div className="space-y-1">
                {roadmap.weeks[activeWeek].days.map((day) => {
                  const globalDay = activeWeek * 7 + day.day;
                  const isMilestone = !!day.milestone;
                  const isToday = globalDay === currentDay;
                  const isPast = globalDay < currentDay;
                  const dayDone = day.tasks.length > 0 && day.tasks.every(t => completed[t.id]);

                  return (
                    <div
                      key={day.day}
                      className={`rounded-xl p-5 transition-all ${
                        isMilestone ? "ring-gold bg-primary/5"
                        : isToday   ? "bg-secondary/40 border border-primary/20"
                        : isPast    ? "bg-secondary/10 opacity-75"
                        : "bg-secondary/5"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Day dot */}
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs ${
                          dayDone  ? "bg-primary/20 text-primary"
                          : isToday ? "text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`} style={isToday && !dayDone ? { background: "var(--gradient-gold)", color: "#080808" } : {}}>
                          {dayDone ? <CheckCircle2 className="h-4 w-4" /> : `D${globalDay}`}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium">{day.theme}</span>
                            {isToday && <span className="text-[9px] tracking-[0.25em] text-primary bg-primary/10 px-2 py-0.5 rounded-full">TODAY</span>}
                            {isMilestone && <span className="flex items-center gap-1 text-[9px] tracking-[0.2em] text-primary"><Trophy className="h-3 w-3" /> MILESTONE</span>}
                          </div>
                          {isMilestone && <p className="text-xs text-primary/80 italic mb-3">{day.milestone}</p>}

                          {/* Tasks */}
                          <div className="space-y-2 mt-2">
                            {day.tasks.map((task) => {
                              const cfg = TYPE_CONFIG[task.type] ?? TYPE_CONFIG.learning;
                              const Icon = cfg.icon;
                              const done = !!completed[task.id];
                              return (
                                <button
                                  key={task.id}
                                  onClick={() => toggleTask(task.id)}
                                  className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                                    done ? "bg-secondary/20 border-border/30 opacity-60" : `${cfg.bg} hover:opacity-90`
                                  }`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {done
                                      ? <CheckCircle2 className="h-4 w-4 text-primary" />
                                      : <Circle className={`h-4 w-4 ${cfg.color}`} />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                      <span className={`flex items-center gap-1 text-[9px] tracking-[0.2em] uppercase ${cfg.color}`}>
                                        <Icon className="h-2.5 w-2.5" />{cfg.label}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-mono">{task.duration}</span>
                                    </div>
                                    <div className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{task.title}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{task.detail}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week nav */}
          <div className="flex justify-between mt-6">
            <button onClick={() => setActiveWeek(w => Math.max(0, w - 1))} disabled={activeWeek === 0}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-30">
              ← Previous week
            </button>
            <button onClick={() => setActiveWeek(w => Math.min(3, w + 1))} disabled={activeWeek === 3}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-30">
              Next week →
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}
