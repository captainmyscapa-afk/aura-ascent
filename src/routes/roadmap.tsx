import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { Sparkles, RefreshCw, CheckCircle2, Circle, Users, BookOpen, Send, Brain, Trophy, Loader2, ArrowUpRight, Map } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { askGemini } from "@/lib/gemini.functions";
import { useProGate, PageLock } from "@/components/aurum/ProGate";
import { UpgradeModal } from "@/components/aurum/UpgradeModal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { T } from "@/lib/i18n/translations";
import { generateRoadmap, type Roadmap, type RoadmapTask } from "@/lib/identity.functions";

export const Route = createFileRoute("/roadmap")({
  component: RoadmapPage,
});

const TYPE_CONFIG: Record<RoadmapTask["type"], { icon: typeof Users; color: string; bg: string }> = {
  networking: { icon: Users,    color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/20" },
  content:    { icon: Sparkles, color: "text-violet-400",  bg: "bg-violet-400/10 border-violet-400/20" },
  learning:   { icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  outreach:   { icon: Send,     color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20" },
  mindset:    { icon: Brain,    color: "text-rose-400",    bg: "bg-rose-400/10 border-rose-400/20" },
};

const WEEK_BORDER = ["border-blue-400/30", "border-violet-400/30", "border-emerald-400/30", "border-amber-400/30"];
const WEEK_BG     = ["bg-blue-400/5",      "bg-violet-400/5",      "bg-emerald-400/5",      "bg-amber-400/5"];

/**
 * A brand-new user staring at "Research the global luxury yacht market size and
 * growth rates" doesn't need a link to another page — they need the answer.
 * Clicking "Get help" generates task-specific guidance right there: facts if
 * it's research, a concrete mini-plan if it's an action, a short exercise if
 * it's mindset. "Continue in Mentor" is offered for anyone who wants to go deeper.
 */
function TaskHelp({
  task,
  industryLabel,
  lang,
  t,
  gate,
  onUsed,
}: {
  task: RoadmapTask;
  industryLabel: string;
  lang: "en" | "fr";
  t: T;
  gate: (reason?: string) => boolean;
  onUsed: () => void;
}) {
  const ask = useServerFn(askGemini);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (text || loading) return;
    if (!gate(t.roadmapHelpGateMessage)) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { text: reply } = await ask({
        data: {
          system: `You are AURUM, an expert mentor for someone breaking into the ${industryLabel} industry. A user on their 30-day roadmap is stuck on one task and needs real help completing it right now — not encouragement, not a link to click. If it's research, give real facts, figures, or estimates and how to verify them. If it's an action (outreach, content, networking), give a concrete step-by-step mini-plan or a short template they can use immediately. If it's a mindset task, give one short concrete exercise. Be specific, no generic advice, never say "it depends". Keep it under 180 words, plain text, short paragraphs or a tight numbered list. ${lang === "fr" ? "Respond in French." : "Respond in English."}`,
          messages: [{ role: "user" as const, text: `Task: "${task.title}". ${task.detail}` }],
        },
      });
      setText(reply || null);
      onUsed();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.roadmapHelpFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => void toggle()}
        className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-primary/80 hover:text-primary transition-colors"
      >
        <Sparkles className="h-3 w-3" />
        {open ? t.roadmapHideHelp : t.roadmapGetHelp}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3.5 animate-fade-up">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              {t.roadmapHelpLoading}
            </div>
          ) : error ? (
            <div className="text-xs text-destructive">{error}</div>
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{text}</p>
              <Link
                to="/mentor"
                search={{ prompt: `Continue helping me with this roadmap task: "${task.title}" — ${task.detail}` }}
                className="mt-3 inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-primary/80 hover:text-primary transition-colors"
              >
                {t.roadmapContinueInMentor}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RoadmapPage() {
  const { industry, industryId } = useIndustry();
  const { state: core, update: updateCore } = useAurumCoreState();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const helpGate = useProGate("roadmap_help");
  const { isPro, loading: subLoading } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const genRoadmap = useServerFn(generateRoadmap);

  const typeLabels: Record<RoadmapTask["type"], string> = {
    networking: t.typeNetworking,
    content: t.typeContent,
    learning: t.typeLearning,
    outreach: t.typeOutreach,
    mindset: t.typeMindset,
  };

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const swapAsk = useServerFn(askGemini);

  // Roadmaps are stored as a map keyed by industryId so each mode keeps its own.
  // Shape: core.roadmap = Record<string, Roadmap & { generated_at: string }>
  // Shape: core.roadmap_progress = Record<string, Record<string, boolean>>

  const getRoadmapMap = () =>
    (core?.roadmap as Record<string, Roadmap & { generated_at?: string }> | null) ?? {};
  const getProgressMap = () =>
    (core?.roadmap_progress as Record<string, Record<string, boolean>> | null) ?? {};

  const generate = useCallback(async () => {
    if (!core || !isPro) return;
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
          language: lang,
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
  }, [core, isPro, industry.label, profile?.goal, core?.ritual_profile, genRoadmap, updateCore, industryId, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load this industry's roadmap from the map — only generate if none exists for this mode.
  // Free-plan users never auto-generate (the page is locked; generate() also self-guards on isPro,
  // but skipping the call entirely here avoids even attempting it while locked).
  useEffect(() => {
    if (!core || !isPro) return;
    const savedMap = getRoadmapMap();
    const saved = savedMap[industryId] ?? null;
    const progress = getProgressMap()[industryId] ?? null;

    if (saved) {
      setRoadmap(saved as Roadmap);
      setCompleted(progress ?? {});
    } else if (!loading) {
      void generate();
    }
  }, [core?.id, industryId, isPro]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTask = useCallback(async (task: RoadmapTask) => {
    const nowDone = !completed[task.id];
    setCompleted((prev) => {
      const next = { ...prev, [task.id]: nowDone };
      const progressMap = getProgressMap();
      updateCore({ roadmap_progress: { ...progressMap, [industryId]: next } as unknown as null });
      return next;
    });

    // Mirror onto aurum_tasks so completions also show up on the Calendar page (CAP-85).
    if (!user) return;
    await supabase.from("aurum_tasks").delete().eq("user_id", user.id).eq("source", "roadmap").eq("title", task.title);
    if (nowDone) {
      await supabase.from("aurum_tasks").insert({
        user_id: user.id,
        title: task.title,
        description: task.detail,
        status: "completed",
        priority: "medium",
        source: "roadmap",
        completed_at: new Date().toISOString(),
      });
    }
  }, [updateCore, core?.roadmap_progress, industryId, completed, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Swap: regenerate one task in place instead of a full round trip to Mentor.
  // Keeps the same task.id so the completed/progress map stays keyed correctly.
  const swapTask = useCallback(async (weekIdx: number, dayIdx: number, task: RoadmapTask, otherTask: RoadmapTask | undefined) => {
    if (!roadmap) return;
    const week = roadmap.weeks[weekIdx];
    const day = week?.days[dayIdx];
    if (!day) return;
    setSwapError(null);
    setSwappingId(task.id);
    try {
      const isFrench = lang === "fr";
      const { text } = await swapAsk({
        data: {
          system: `You are AURUM — elite luxury industry strategist. Return ONLY valid JSON, no markdown, no explanation. The task must use real ${industry.label} industry terms, platforms, and actions, achievable in about ${task.duration}.${isFrench ? " Write every text value in natural, native French — not a literal translation. The 'type' value must remain one of the English enum words exactly as specified." : ""}`,
          messages: [
            {
              role: "user",
              text: [
                `INDUSTRY: ${industry.label}`,
                `LEVEL: ${core?.current_level ?? "beginner"}`,
                `WEEK THEME: ${week.theme}`,
                `DAY THEME: ${day.theme}`,
                `Replace this task with a different one: "${task.title}" — ${task.detail}`,
                otherTask ? `The other task already assigned that day is: "${otherTask.title}" — the replacement must be meaningfully different from both.` : "",
                `Return this exact JSON structure:`,
                `{"type": "networking|content|learning|outreach|mindset", "title": "action title max 8 words", "detail": "specific how-to 1 sentence", "duration": "${task.duration}"}`,
              ].filter(Boolean).join("\n"),
            },
          ],
        },
      });
      const cleaned = text.replace(/```json|```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("no JSON object found in AI response");
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<RoadmapTask>;
      const validTypes: RoadmapTask["type"][] = ["networking", "content", "learning", "outreach", "mindset"];
      const newTask: RoadmapTask = {
        id: task.id,
        type: validTypes.includes(parsed.type as RoadmapTask["type"]) ? (parsed.type as RoadmapTask["type"]) : task.type,
        title: parsed.title?.trim() || task.title,
        detail: parsed.detail?.trim() || task.detail,
        duration: parsed.duration?.trim() || task.duration,
      };

      const updatedWeeks = roadmap.weeks.map((w, wi) =>
        wi !== weekIdx ? w : {
          ...w,
          days: w.days.map((d, di) =>
            di !== dayIdx ? d : { ...d, tasks: d.tasks.map((tk) => (tk.id === task.id ? newTask : tk)) }
          ),
        }
      );
      const updatedRoadmap = { ...roadmap, weeks: updatedWeeks };
      setRoadmap(updatedRoadmap);
      await updateCore({ roadmap: { ...getRoadmapMap(), [industryId]: updatedRoadmap } as unknown as null });
    } catch (e) {
      console.error("swapTask failed:", e);
      setSwapError(task.id);
    } finally {
      setSwappingId(null);
    }
  }, [roadmap, lang, industry.label, core?.current_level, swapAsk, updateCore, industryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalTasks = roadmap?.weeks.flatMap(w => w.days.flatMap(d => d.tasks)).length ?? 0;
  const completedCount = Object.values(completed).filter(Boolean).length;
  const pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const savedRoadmapForMode = getRoadmapMap()[industryId];
  const currentDay = savedRoadmapForMode?.generated_at
    ? Math.min(Math.floor((Date.now() - new Date(savedRoadmapForMode.generated_at).getTime()) / 86_400_000) + 1, 30)
    : core?.roadmap_generated_at
      ? Math.min(Math.floor((Date.now() - new Date(core.roadmap_generated_at).getTime()) / 86_400_000) + 1, 30)
      : 1;

  // Free-plan users see a locked page instead of the roadmap — never the roadmap itself,
  // and generate() / the auto-generate effect above both self-guard on isPro so no Gemini
  // call is ever made on their behalf.
  if (!subLoading && !isPro) {
    return (
      <AppShell>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={t.roadmapLockDesc} />
        <PageLock
          icon={Map}
          eyebrow={t.proFeatureLabel}
          title={t.roadmapLockTitle}
          description={t.roadmapLockDesc}
          features={t.roadmapLockFeatures}
          upgradeLabel={t.setUpgradeToPro}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <UpgradeModal
        open={helpGate.showUpgrade}
        onClose={() => helpGate.setShowUpgrade(false)}
        reason={t.roadmapHelpGateMessage}
      />
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
          {t.roadmapEyebrow(industry.modeLabel)}
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl leading-tight">
              {loading ? t.roadmapBuilding : (roadmap?.headline ?? t.roadmapDefaultHeadline)}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">
              {t.roadmapDescription}
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
            {loading ? t.roadmapGenerating : t.roadmapRegenerate}
          </button>
        </div>
      </div>

      {/* Progress */}
      {roadmap && !loading && (
        <div className="glass rounded-xl p-5 mb-8 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">{t.roadmapOverallProgress}</div>
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
                  <Icon className="h-3 w-3" />{typeLabels[type]}
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
          <p className="font-serif text-2xl mb-2">{t.roadmapArchitecting}</p>
          <p className="text-sm text-muted-foreground">
            {t.roadmapArchitectingDesc(industry.label)}
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
                <span className="hidden sm:inline">{t.roadmapWeekLabel(week.week)}</span>{week.theme}
              </button>
            ))}
          </div>

          {/* Active week */}
          {roadmap.weeks[activeWeek] && (
            <div className={`glass rounded-2xl border ${WEEK_BORDER[activeWeek]} p-1 animate-fade-up`}>
              {/* Week header */}
              <div className={`rounded-xl p-6 mb-1 ${WEEK_BG[activeWeek]}`}>
                <div className="text-[10px] tracking-[0.3em] text-primary/80 mb-1">{t.roadmapWeekHeader(roadmap.weeks[activeWeek].week)}</div>
                <div className="font-serif text-2xl mb-1">{roadmap.weeks[activeWeek].theme}</div>
                <p className="text-sm text-muted-foreground">{roadmap.weeks[activeWeek].focus}</p>
              </div>

              {/* Days */}
              <div className="space-y-1">
                {roadmap.weeks[activeWeek].days.map((day, dayIdx) => {
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
                            {isToday && <span className="text-[9px] tracking-[0.25em] text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t.today}</span>}
                            {isMilestone && <span className="flex items-center gap-1 text-[9px] tracking-[0.2em] text-primary"><Trophy className="h-3 w-3" /> {t.roadmapMilestone}</span>}
                          </div>
                          {isMilestone && <p className="text-xs text-primary/80 italic mb-3">{day.milestone}</p>}

                          {/* Tasks */}
                          <div className="space-y-2 mt-2">
                            {day.tasks.map((task) => {
                              const cfg = TYPE_CONFIG[task.type] ?? TYPE_CONFIG.learning;
                              const Icon = cfg.icon;
                              const done = !!completed[task.id];
                              return (
                                <div
                                  key={`${task.id}:${task.title}`}
                                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                                    done ? "bg-secondary/20 border-border/30 opacity-60" : cfg.bg
                                  }`}
                                >
                                  <button
                                    onClick={() => void toggleTask(task)}
                                    className="mt-0.5 shrink-0"
                                    aria-label={done ? t.roadmapMarkIncomplete : t.roadmapMarkComplete}
                                  >
                                    {done
                                      ? <CheckCircle2 className="h-4 w-4 text-primary" />
                                      : <Circle className={`h-4 w-4 ${cfg.color}`} />
                                    }
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                      <span className={`flex items-center gap-1 text-[9px] tracking-[0.2em] uppercase ${cfg.color}`}>
                                        <Icon className="h-2.5 w-2.5" />{typeLabels[task.type] ?? typeLabels.learning}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-mono">{task.duration}</span>
                                    </div>
                                    <div className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{task.title}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{task.detail}</div>
                                    {!done && (
                                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                                        <TaskHelp
                                          task={task}
                                          industryLabel={industry.label}
                                          lang={lang}
                                          t={t}
                                          gate={helpGate.gate}
                                          onUsed={() => void helpGate.increment("roadmap_help")}
                                        />
                                        <button
                                          onClick={() =>
                                            void swapTask(activeWeek, dayIdx, task, day.tasks.find((tk) => tk.id !== task.id))
                                          }
                                          disabled={swappingId === task.id}
                                          className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                                        >
                                          {swappingId === task.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <RefreshCw className="h-3 w-3" />
                                          )}
                                          {swappingId === task.id ? t.roadmapSwapping : t.roadmapSwapTask}
                                        </button>
                                      </div>
                                    )}
                                    {swapError === task.id && (
                                      <div className="text-[10px] text-destructive mt-1">{t.roadmapSwapFailed}</div>
                                    )}
                                  </div>
                                </div>
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
              {t.roadmapPrevWeek}
            </button>
            <button onClick={() => setActiveWeek(w => Math.min(3, w + 1))} disabled={activeWeek === 3}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-30">
              {t.roadmapNextWeek}
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}
