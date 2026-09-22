import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { Sparkles, RefreshCw, CheckCircle2, Circle, Users, BookOpen, Send, Brain, Trophy, Loader2, ArrowUpRight, Map, Flag, ListChecks, MessageSquareText, X, Clock, Calendar, type LucideIcon } from "lucide-react";
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
import { useGemBalance } from "@/hooks/useGemBalance";
import { GEM_COSTS } from "@/lib/gemCosts";
import { toast } from "sonner";

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

// Solid dots for the My Roadmap timeline's per-day task-type indicators — same
// hue family as TYPE_CONFIG's icon colors, just filled instead of tinted.
const TYPE_DOT: Record<RoadmapTask["type"], string> = {
  networking: "bg-blue-400",
  content: "bg-violet-400",
  learning: "bg-emerald-400",
  outreach: "bg-amber-400",
  mindset: "bg-rose-400",
};

function typeLabelsFor(t: T): Record<RoadmapTask["type"], string> {
  return {
    networking: t.typeNetworking,
    content: t.typeContent,
    learning: t.typeLearning,
    outreach: t.typeOutreach,
    mindset: t.typeMindset,
  };
}

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
  const gems = useGemBalance();
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
      void gems.spend(GEM_COSTS.roadmapGetHelp, "roadmap_get_help");
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

/**
 * CAP-150: lets a user answer a roadmap task in their own words and get it
 * reviewed by AURUM — a score out of 10 plus a short correction if the answer
 * was wrong or incomplete. Submitting also marks the task complete, which is
 * what mirrors it onto aurum_tasks (and therefore the Calendar) with the
 * graded answer attached. Stays mounted even after the task is marked done so
 * the score doesn't vanish once the row re-renders as completed.
 */
function AnswerTask({
  task,
  industryLabel,
  lang,
  t,
  onGraded,
}: {
  task: RoadmapTask;
  industryLabel: string;
  lang: "en" | "fr";
  t: T;
  onGraded: (task: RoadmapTask, result: { answerText: string; score: number; feedback: string }) => Promise<void>;
}) {
  const ask = useServerFn(askGemini);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Answers must be typed, not pasted in from elsewhere (ChatGPT, notes, etc.) —
  // blocks both keyboard paste and a dragged-in text drop, and pokes fun at anyone trying.
  const blockPaste = (e: React.ClipboardEvent<HTMLTextAreaElement> | React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    toast(t.roadmapAnswerNoPaste);
  };

  const submit = async () => {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { text } = await ask({
        data: {
          system: `You are AURUM, an expert mentor grading a roadmap task answer for someone breaking into the ${industryLabel} industry. Return ONLY valid JSON, no markdown: {"score": integer 0-10, "feedback": "1-3 sentence assessment of quality and correctness; if the answer is wrong, incomplete, or could be sharper, give the correction or the better answer directly in this string"}. Be honest and specific — never inflate the score. ${lang === "fr" ? "Write the feedback in natural, native French." : "Write the feedback in English."}`,
          messages: [
            {
              role: "user" as const,
              text: `Task: "${task.title}". ${task.detail}\n\nUser's answer: "${draft.trim()}"`,
            },
          ],
        },
      });
      const cleaned = text.replace(/```json|```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("no JSON object found in AI response");
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { score?: number; feedback?: string };
      const score = Math.max(0, Math.min(10, Math.round(Number(parsed.score) || 0)));
      const feedback = parsed.feedback?.trim() || "";
      await onGraded(task, { answerText: draft.trim(), score, feedback });
      setResult({ score, feedback });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.roadmapAnswerFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
      >
        <MessageSquareText className="h-3 w-3" />
        {open ? t.roadmapHideAnswer : t.roadmapAnswerTask}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3.5 animate-fade-up space-y-2.5">
          {result ? (
            <>
              <div className="font-mono text-sm text-primary">{t.roadmapAnswerScoreLabel(result.score)}</div>
              {result.feedback && (
                <div>
                  <div className="text-[9px] tracking-[0.2em] uppercase text-primary/70 mb-1">{t.roadmapAnswerCorrectionLabel}</div>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{result.feedback}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onPaste={blockPaste}
                onDrop={blockPaste}
                placeholder={t.roadmapAnswerPlaceholder}
                rows={3}
                disabled={submitting}
                className="w-full rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 resize-none"
              />
              {error && <div className="text-xs text-destructive">{error}</div>}
              <button
                onClick={() => void submit()}
                disabled={submitting || !draft.trim()}
                className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-primary/80 hover:text-primary transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                {submitting ? t.roadmapSubmittingAnswer : t.roadmapSubmitAnswer}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CAP-151/follow-up: "My Roadmap" — the 30-day journey drawn as an actual
 * path, one row per week, with a flag planted on every day the user finished
 * all of that day's tasks and a trophy at the finish line.
 *
 * Follow-up polish: the industry's own vehicle (yacht for Yachts, jet for
 * Jets, etc. — reuses IndustryConfig.icon so every mode gets its own, not
 * just yachting) sails along the path exactly as far as the user has actually
 * completed — not merely "today's date" — so it's a real progress marker,
 * with a gold "wake" line trailing behind it. Clicking a flag opens the
 * completed day's tasks with the date each was actually completed.
 */
function MyRoadmapPath({
  roadmap,
  completed,
  currentDay,
  industryIcon: VehicleIcon,
  userId,
  lang,
  t,
  onJumpToWeek,
}: {
  roadmap: Roadmap;
  completed: Record<string, boolean>;
  currentDay: number;
  industryIcon: LucideIcon;
  userId: string | null;
  lang: "en" | "fr";
  t: T;
  onJumpToWeek: (weekIndex: number) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<{
    globalDay: number;
    weekIndex: number;
    weekTheme: string;
    tasks: RoadmapTask[];
    status: "done" | "today" | "pending";
  } | null>(null);

  // Distance "sailed" = days actually completed, not the calendar date — so the
  // vehicle reflects real progress rather than just showing where "today" is.
  let sailedDays = 0;
  roadmap.weeks.forEach((week) => {
    week.days.forEach((day) => {
      if (day.tasks.length > 0 && day.tasks.every((tk) => completed[tk.id])) sailedDays += 1;
    });
  });

  // Walk week by week to find exactly which row the vehicle sits in and how far
  // across that row's line it is — avoids rendering it twice at a week boundary.
  let remaining = sailedDays;
  let vehicleWeekIndex = roadmap.weeks.length - 1;
  let vehicleWeekPct = 100;
  for (let i = 0; i < roadmap.weeks.length; i++) {
    const len = roadmap.weeks[i]?.days.length ?? 0;
    if (remaining < len || i === roadmap.weeks.length - 1) {
      vehicleWeekIndex = i;
      vehicleWeekPct = len > 0 ? Math.max(0, Math.min(100, (remaining / len) * 100)) : 0;
      break;
    }
    remaining -= len;
  }

  return (
    <>
      <div className="glass rounded-2xl p-6 sm:p-10 overflow-x-auto animate-fade-up">
        <p className="text-sm text-muted-foreground mb-8 max-w-xl">{t.roadmapMyRoadmapDesc}</p>
        <div className="min-w-[760px] space-y-14">
          {roadmap.weeks.map((week, wi) => {
            const isLastWeek = wi === roadmap.weeks.length - 1;
            const showVehicle = wi === vehicleWeekIndex;
            const wakePct = wi < vehicleWeekIndex ? 100 : wi === vehicleWeekIndex ? vehicleWeekPct : 0;
            const weekDoneCount = week.days.filter((d) => d.tasks.length > 0 && d.tasks.every((tk) => completed[tk.id])).length;
            const weekComplete = weekDoneCount === week.days.length;
            return (
              <div key={week.week}>
                <div className="flex items-center gap-2.5 mb-6">
                  <div
                    className={`text-[10px] tracking-[0.3em] uppercase ${
                      WEEK_BORDER[wi]?.replace("border-", "text-").replace("/30", "") ?? "text-muted-foreground/70"
                    }`}
                  >
                    {t.roadmapWeekHeader(week.week)} · {week.theme}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                      weekComplete ? "border-primary/40 text-primary bg-primary/10" : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    {weekComplete && <CheckCircle2 className="h-2.5 w-2.5" />}
                    {weekDoneCount}/{week.days.length}
                  </span>
                </div>
                <div className="relative flex items-start justify-between pt-7">
                  <div className="absolute left-6 right-6 top-7 h-0.5 bg-border/50" />
                  <div
                    className="absolute left-6 top-7 h-0.5 bg-[var(--gradient-gold)] transition-[width] duration-700"
                    style={{ width: `calc((100% - 3rem) * ${wakePct / 100})` }}
                  />
                  {showVehicle && (
                    <div
                      className="absolute top-7 z-20 pointer-events-none"
                      style={{
                        left: `calc(1.5rem + (100% - 3rem) * ${wakePct / 100})`,
                        transform: "translate(-50%, -100%)",
                      }}
                    >
                      <div
                        className="animate-boat-bob mb-1 h-8 w-8 rounded-full flex items-center justify-center shadow-[0_0_16px_rgba(201,168,76,0.55)]"
                        style={{ background: "var(--gradient-gold)" }}
                      >
                        <VehicleIcon className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  {week.days.map((day, di) => {
                    // day.day is already normalized to the global 1-28 day number (see
                    // parseWeekJson's "Normalize day numbers to global" step) -- adding the week
                    // offset again here double-counted it, e.g. showing week 2 as D15-D21.
                    const globalDay = day.day;
                    const dayDone = day.tasks.length > 0 && day.tasks.every((tk) => completed[tk.id]);
                    const isToday = globalDay === currentDay;
                    const isLastDay = isLastWeek && di === week.days.length - 1;
                    const isMissed = !dayDone && !isToday && !isLastDay && globalDay < currentDay;
                    const status: "done" | "today" | "pending" = dayDone ? "done" : isToday ? "today" : "pending";
                    return (
                      <div
                        key={day.day}
                        className="relative z-10 flex flex-1 flex-col items-center gap-1.5 px-1 animate-fade-up"
                        style={{ animationDelay: `${(wi * 7 + di) * 35}ms` }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDay({ globalDay, weekIndex: wi, weekTheme: week.theme, tasks: day.tasks, status })
                          }
                          title={t.roadmapDayDetailHint}
                          className={`relative h-12 w-12 rounded-full border flex items-center justify-center shrink-0 transition-all hover:scale-110 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            dayDone
                              ? "border-primary bg-primary/15 hover:shadow-[0_0_20px_rgba(201,168,76,0.4)]"
                              : isToday
                                ? "border-primary/60 ring-4 ring-primary/15 bg-secondary/40 hover:shadow-[0_0_16px_rgba(201,168,76,0.3)]"
                                : isLastDay
                                  ? "border-primary/40 bg-secondary/20 hover:border-primary/60"
                                  : isMissed
                                    ? "border-amber-400/40 bg-amber-400/5 hover:border-amber-400/60"
                                    : "border-border/60 bg-secondary/10 hover:border-primary/40"
                          }`}
                        >
                          {isToday && !dayDone && (
                            <>
                              <span
                                className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary animate-sparkle"
                                style={{ animationDelay: "0.3s" }}
                              />
                              <span
                                className="absolute -bottom-0.5 -left-1 h-1 w-1 rounded-full bg-primary animate-sparkle"
                                style={{ animationDelay: "1.2s" }}
                              />
                            </>
                          )}
                          {dayDone ? (
                            <Flag className="h-5 w-5 text-primary" />
                          ) : isLastDay ? (
                            <Trophy className="h-5 w-5 text-primary/60" />
                          ) : (
                            <span
                              className={`font-mono text-xs ${
                                isToday ? "text-primary" : isMissed ? "text-amber-400/80" : "text-muted-foreground"
                              }`}
                            >
                              {globalDay}
                            </span>
                          )}
                        </button>
                        {day.tasks.length > 0 && (
                          <div className="flex items-center gap-1 h-1.5">
                            {day.tasks.slice(0, 3).map((tk) => (
                              <span
                                key={tk.id}
                                className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT[tk.type] ?? TYPE_DOT.learning} ${
                                  dayDone ? "" : "opacity-50"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <span
                          className={`text-[9px] tracking-[0.1em] uppercase text-center ${
                            dayDone ? "text-primary" : isMissed ? "text-amber-400/70" : "text-muted-foreground/60"
                          }`}
                        >
                          {isLastDay ? t.roadmapFinishLine : `D${globalDay}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <DayDetailModal
        day={selectedDay}
        userId={userId}
        lang={lang}
        t={t}
        onClose={() => setSelectedDay(null)}
        onJumpToWeek={onJumpToWeek}
      />
    </>
  );
}

/** Shown when a day on My Roadmap is clicked. A completed day shows when each
 * task was actually finished; a "today" or "pending" day shows the tasks
 * themselves (type-coded, same as the weekly task list) with a shortcut into
 * the task list to go work on them. */
function DayDetailModal({
  day,
  userId,
  lang,
  t,
  onClose,
  onJumpToWeek,
}: {
  day: {
    globalDay: number;
    weekIndex: number;
    weekTheme: string;
    tasks: RoadmapTask[];
    status: "done" | "today" | "pending";
  } | null;
  userId: string | null;
  lang: "en" | "fr";
  t: T;
  onClose: () => void;
  onJumpToWeek: (weekIndex: number) => void;
}) {
  const [dates, setDates] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const typeLabels = typeLabelsFor(t);

  useEffect(() => {
    if (!day || day.status !== "done") return;
    setDates({});
    if (!userId) return;
    setLoading(true);
    const titles = day.tasks.map((tk) => tk.title);
    supabase
      .from("aurum_tasks")
      .select("title, completed_at")
      .eq("user_id", userId)
      .eq("source", "roadmap")
      .in("title", titles)
      .then(({ data }) => {
        const map: Record<string, string | null> = {};
        (data ?? []).forEach((row) => {
          if (row.title) map[row.title] = row.completed_at ?? null;
        });
        setDates(map);
        setLoading(false);
      });
  }, [day, userId]);

  if (!day) return null;

  const dateLocale = lang === "fr" ? "fr-FR" : "en-US";
  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(dateLocale, { weekday: "short", month: "short", day: "numeric" })
      : t.roadmapDayDetailNoDate;

  const HeaderIcon = day.status === "done" ? Flag : day.status === "today" ? Clock : Calendar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl max-w-md w-full p-6 border border-primary/20 shadow-[0_0_60px_rgba(201,168,76,0.1)] animate-pop">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-gold)" }}
          >
            <HeaderIcon className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.25em] text-primary/80 uppercase">{day.weekTheme}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-serif text-lg">{t.roadmapDayDetailTitle(day.globalDay)}</div>
              {day.status === "today" && (
                <span className="text-[9px] tracking-[0.25em] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {t.today}
                </span>
              )}
              {day.status === "pending" && (
                <span className="text-[9px] tracking-[0.2em] text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full uppercase">
                  {t.roadmapDayNotDoneYet}
                </span>
              )}
            </div>
          </div>
        </div>

        {day.status === "done" ? (
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                {t.roadmapDayDetailLoading}
              </div>
            ) : (
              day.tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-secondary/20">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground/90">{task.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                      {formatDate(dates[task.title] ?? null)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {day.tasks.map((task) => {
                const cfg = TYPE_CONFIG[task.type] ?? TYPE_CONFIG.learning;
                const Icon = cfg.icon;
                return (
                  <div key={task.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${cfg.bg}`}>
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-foreground/90">{task.title}</span>
                        <span className={`text-[9px] tracking-[0.15em] uppercase ${cfg.color}`}>
                          {typeLabels[task.type] ?? typeLabels.learning}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{task.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                onJumpToWeek(day.weekIndex);
                onClose();
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              style={{ background: "var(--gradient-gold)" }}
            >
              {t.roadmapOpenTaskList} <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const FIREWORK_COLORS = ["#D4A843", "#F2E6C9", "#C9A84C", "#fff4d6"];
const FIREWORK_BURSTS = [
  { left: 20, top: 28, delay: 0 },
  { left: 78, top: 22, delay: 0.35 },
  { left: 50, top: 38, delay: 0.7 },
  { left: 30, top: 62, delay: 1.1 },
  { left: 72, top: 58, delay: 1.5 },
];

function FireworkBurst({ left, top, delay, color }: { left: number; top: number; delay: number; color: string }) {
  const particles = Array.from({ length: 12 });
  return (
    <div className="absolute" style={{ left: `${left}%`, top: `${top}%` }}>
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const dist = 46 + (i % 3) * 16;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        return (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full firework-particle"
            style={
              {
                background: color,
                boxShadow: `0 0 6px 1px ${color}`,
                animationDelay: `${delay}s`,
                "--tx": `${tx}px`,
                "--ty": `${ty}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** CAP-151: full-screen fireworks celebration shown once, the moment all 30 days are complete. */
function RoadmapCelebration({ industryLabel, t, onClose }: { industryLabel: string; t: T; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/92 backdrop-blur-sm animate-fade-up">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {FIREWORK_BURSTS.map((b, i) => (
          <FireworkBurst key={i} left={b.left} top={b.top} delay={b.delay} color={FIREWORK_COLORS[i % FIREWORK_COLORS.length]} />
        ))}
      </div>
      <div className="relative z-10 max-w-lg mx-auto text-center px-6">
        <div
          className="mx-auto mb-6 h-16 w-16 rounded-full flex items-center justify-center animate-pulse-gold"
          style={{ background: "var(--gradient-gold)" }}
        >
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl leading-tight mb-4 text-primary uppercase tracking-tight">
          {t.roadmapCelebrationTitle(industryLabel)}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">{t.roadmapCelebrationSubtitle}</p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground"
          style={{ background: "var(--gradient-gold)" }}
        >
          {t.roadmapCelebrationCta}
        </button>
      </div>
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
  const gems = useGemBalance();
  const { isPro, loading: subLoading } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const genRoadmap = useServerFn(generateRoadmap);

  const typeLabels = typeLabelsFor(t);

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [viewMode, setViewMode] = useState<"tasks" | "path">("tasks");
  const [showCelebration, setShowCelebration] = useState(false);
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

  // CAP-150: submitting a graded answer also marks the task complete — same
  // mirror-to-aurum_tasks pattern as toggleTask (CAP-85), now carrying the
  // answer text, score, and AI feedback along so they surface on the Calendar.
  const submitAnswer = useCallback(async (task: RoadmapTask, result: { answerText: string; score: number; feedback: string }) => {
    if (!user) throw new Error("not signed in");

    await supabase.from("aurum_tasks").delete().eq("user_id", user.id).eq("source", "roadmap").eq("title", task.title);
    const { error } = await supabase.from("aurum_tasks").insert({
      user_id: user.id,
      title: task.title,
      description: task.detail,
      status: "completed",
      priority: "medium",
      source: "roadmap",
      industry: industryId,
      completed_at: new Date().toISOString(),
      answer_text: result.answerText,
      answer_score: result.score,
      answer_feedback: result.feedback,
    });
    if (error) {
      console.error("[aurum_tasks] roadmap answer save failed:", error.message);
      throw new Error("roadmap answer save failed");
    }

    setCompleted((prev) => {
      const next = { ...prev, [task.id]: true };
      const progressMap = getProgressMap();
      updateCore({ roadmap_progress: { ...progressMap, [industryId]: next } as unknown as null });
      return next;
    });
  }, [updateCore, core?.roadmap_progress, industryId, user]); // eslint-disable-line react-hooks/exhaustive-deps

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
      void gems.spend(GEM_COSTS.roadmapSwapTask, "roadmap_swap_task");
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

  // CAP-151: the finish-line fireworks fire exactly once — the celebrated flag lives
  // under a reserved "_celebrated" key in roadmap_progress (never a real industryId),
  // kept separate from the per-task completed map so it can't inflate completedCount.
  const allDone = totalTasks > 0 && completedCount === totalTasks;
  useEffect(() => {
    if (!roadmap || loading || !allDone) return;
    const progressMap = getProgressMap();
    const celebratedMap = (progressMap["_celebrated"] as Record<string, boolean> | undefined) ?? {};
    if (celebratedMap[industryId]) return;
    setShowCelebration(true);
    void updateCore({
      roadmap_progress: {
        ...progressMap,
        _celebrated: { ...celebratedMap, [industryId]: true },
      } as unknown as null,
    });
  }, [allDone, industryId, roadmap, loading]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {showCelebration && (
        <RoadmapCelebration
          industryLabel={industry.label.toUpperCase()}
          t={t}
          onClose={() => setShowCelebration(false)}
        />
      )}
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

      {/* CAP-151: switch between the day-by-day task list and the visual "My Roadmap" path */}
      {roadmap && !loading && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode("tasks")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-all ${
              viewMode === "tasks"
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <ListChecks className="h-3.5 w-3.5" />
            {t.roadmapViewTasks}
          </button>
          <button
            onClick={() => setViewMode("path")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm transition-all ${
              viewMode === "path"
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            {t.roadmapViewMyRoadmap}
          </button>
        </div>
      )}

      {roadmap && !loading && viewMode === "path" && (
        <MyRoadmapPath
          roadmap={roadmap}
          completed={completed}
          currentDay={currentDay}
          industryIcon={industry.icon}
          userId={user?.id ?? null}
          lang={lang}
          t={t}
          onJumpToWeek={(weekIndex) => {
            setActiveWeek(weekIndex);
            setViewMode("tasks");
          }}
        />
      )}

      {/* Roadmap content */}
      {roadmap && !loading && viewMode === "tasks" && (
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
                  // day.day is already the global day number -- see the timeline view's
                  // identical fix above.
                  const globalDay = day.day;
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
                                    {/* Answer stays mounted even once done, so its score/feedback
                                        doesn't disappear the moment the task flips to completed
                                        (CAP-150). Help + Swap only make sense before completion. */}
                                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                                      {!done && (
                                        <>
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
                                        </>
                                      )}
                                      <AnswerTask
                                        task={task}
                                        industryLabel={industry.label}
                                        lang={lang}
                                        t={t}
                                        onGraded={submitAnswer}
                                      />
                                    </div>
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
