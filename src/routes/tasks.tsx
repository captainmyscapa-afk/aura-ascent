import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ClipboardList,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
  Map,
  Brain,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { T } from "@/lib/i18n/translations";
import { generateTaskReviewQuiz, type TaskQuizQuestion, type TaskQuizSourceTask } from "@/lib/identity.functions";

export const Route = createFileRoute("/tasks")({
  component: TaskControl,
});

type Source = "daily_ritual" | "roadmap";

type CompletedTask = {
  id: string;
  title: string;
  description: string | null;
  industry: string | null;
  source: Source;
  completed_at: string;
  answer_text: string | null;
  answer_score: number | null;
  answer_feedback: string | null;
};

type Milestone = "day7" | "day30";

type QuizRow = {
  id: string;
  milestone: Milestone;
  day_count_at_generation: number;
  questions: TaskQuizQuestion[];
  answers: number[] | null;
  score: number | null;
  total: number;
  created_at: string;
  completed_at: string | null;
};

const MILESTONE_TARGET: Record<Milestone, number> = { day7: 7, day30: 30 };
const MILESTONE_SAMPLE_CAP: Record<Milestone, number> = { day7: 20, day30: 50 };

// Prioritizes tasks with a real graded answer (richer quiz material), then
// fills the rest, capped so the AI prompt stays a reasonable size.
function sampleTasks(tasks: CompletedTask[], cap: number): CompletedTask[] {
  const withAnswers = tasks.filter((t) => t.answer_text);
  const withoutAnswers = tasks.filter((t) => !t.answer_text);
  return [...withAnswers, ...withoutAnswers].slice(0, cap);
}

function TaskControl() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [dayCount, setDayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Source>("all");

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [tasksRes, quizzesRes, daysRes] = await Promise.all([
      (supabase.from("aurum_tasks") as any)
        .select("id, title, description, industry, source, completed_at, answer_text, answer_score, answer_feedback")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .in("source", ["daily_ritual", "roadmap"])
        .order("completed_at", { ascending: false })
        .limit(500),
      (supabase as any).from("task_quizzes")
        .select("id, milestone, day_count_at_generation, questions, answers, score, total, created_at, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      (supabase.rpc as any)("completed_task_days", { p_user_id: user.id }),
    ]);
    setTasks((tasksRes.data as CompletedTask[]) ?? []);
    setQuizzes((quizzesRes.data as QuizRow[]) ?? []);
    setDayCount(typeof daysRes.data === "number" ? daysRes.data : 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const filteredTasks = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((tk) => tk.source === filter)),
    [tasks, filter],
  );

  const grouped = useMemo(() => {
    const groups: { day: string; items: CompletedTask[] }[] = [];
    for (const tk of filteredTasks) {
      const day = new Date(tk.completed_at).toDateString();
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.items.push(tk);
      else groups.push({ day, items: [tk] });
    }
    return groups;
  }, [filteredTasks]);

  const dateLocale = lang === "fr" ? "fr-FR" : "en-US";

  return (
    <AppShell>
      <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">{t.taskCtrlEyebrow}</div>
          <h1 className="font-serif text-4xl">{t.taskCtrlTitle}</h1>
          <p className="mt-3 text-muted-foreground max-w-xl text-sm">{t.taskCtrlDesc}</p>
        </div>
        <MasteryScoreCard tasks={tasks} quizzes={quizzes} t={t} />
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        <QuizMilestoneCard
          milestone="day7"
          dayCount={dayCount}
          quizzes={quizzes.filter((q) => q.milestone === "day7")}
          tasks={tasks}
          t={t}
          lang={lang}
          onChanged={load}
        />
        <QuizMilestoneCard
          milestone="day30"
          dayCount={dayCount}
          quizzes={quizzes.filter((q) => q.milestone === "day30")}
          tasks={tasks}
          t={t}
          lang={lang}
          onChanged={load}
        />
      </div>

      <SectionHeading eyebrow={t.taskCtrlHistoryTitle} title={t.taskCtrlHistoryDesc} />

      <div className="flex items-center gap-2 mb-6 mt-4">
        {(["all", "daily_ritual", "roadmap"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
              filter === f ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {f === "all" ? t.taskCtrlFilterAll : f === "daily_ritual" ? t.taskCtrlFilterDailyRitual : t.taskCtrlFilterRoadmap}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-secondary/20 animate-pulse" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">{t.taskCtrlNoHistory}</div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.day}>
              <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-3">
                {new Date(group.items[0].completed_at).toLocaleDateString(dateLocale, { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div className="space-y-2">
                {group.items.map((tk) => <HistoryRow key={tk.id} task={tk} t={t} dateLocale={dateLocale} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

type ScoreTier = "unranked" | "bronze" | "silver" | "gold" | "platinum";

const TIER_MIN: Record<Exclude<ScoreTier, "unranked">, number> = {
  bronze: 0,
  silver: 40,
  gold: 70,
  platinum: 90,
};
const TIER_ORDER: Exclude<ScoreTier, "unranked">[] = ["bronze", "silver", "gold", "platinum"];
const TIER_COLOR: Record<ScoreTier, string> = {
  unranked: "var(--muted-foreground)",
  bronze: "#c58e4d",
  silver: "#c7c7cf",
  gold: "var(--primary)",
  platinum: "#dce9f7",
};

function scoreTier(score: number | null): ScoreTier {
  if (score == null) return "unranked";
  let tier: Exclude<ScoreTier, "unranked"> = "bronze";
  for (const candidate of TIER_ORDER) {
    if (score >= TIER_MIN[candidate]) tier = candidate;
  }
  return tier;
}

function tierLabel(tier: ScoreTier, t: T): string {
  switch (tier) {
    case "bronze": return t.taskCtrlScoreTierBronze;
    case "silver": return t.taskCtrlScoreTierSilver;
    case "gold": return t.taskCtrlScoreTierGold;
    case "platinum": return t.taskCtrlScoreTierPlatinum;
    default: return t.taskCtrlScoreTierUnranked;
  }
}

// Champagne-gold, emerald, sapphire, copper — CVD-validated at adjacent
// spacing (worst adjacent ΔE 8.9 deutan / 15.2 normal-vision) against the
// app's dark surface; each ring is also always paired with an icon + label,
// so identity never rides on hue alone.
function MasteryScoreCard({ tasks, quizzes, t }: { tasks: CompletedTask[]; quizzes: QuizRow[]; t: T }) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  const metrics = useMemo(() => {
    const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);
    const ritualScores = tasks.filter((tk) => tk.source === "daily_ritual" && tk.answer_score != null).map((tk) => (tk.answer_score as number) * 10);
    const roadmapScores = tasks.filter((tk) => tk.source === "roadmap" && tk.answer_score != null).map((tk) => (tk.answer_score as number) * 10);
    const quiz7Scores = quizzes.filter((q) => q.milestone === "day7" && q.completed_at && q.score != null && q.total > 0).map((q) => ((q.score as number) / q.total) * 100);
    const quiz30Scores = quizzes.filter((q) => q.milestone === "day30" && q.completed_at && q.score != null && q.total > 0).map((q) => ((q.score as number) / q.total) * 100);

    return [
      { key: "ritual", label: t.taskCtrlScoreRitual, value: avg(ritualScores), color: "#a8842a", icon: ClipboardList },
      { key: "roadmap", label: t.taskCtrlScoreRoadmap, value: avg(roadmapScores), color: "#2fa87c", icon: Map },
      { key: "quiz7", label: t.taskCtrlScoreQuiz7, value: avg(quiz7Scores), color: "#4f7fd1", icon: Brain },
      { key: "quiz30", label: t.taskCtrlScoreQuiz30, value: avg(quiz30Scores), color: "#c9705a", icon: GraduationCap },
    ];
  }, [tasks, quizzes, t]);

  const available = metrics.filter((m) => m.value != null);
  const overall = available.length ? available.reduce((a, m) => a + (m.value as number), 0) / available.length : null;
  const tier = scoreTier(overall);
  const color = TIER_COLOR[tier];

  const nextTier = tier === "unranked" ? "bronze" : tier === "platinum" ? null : TIER_ORDER[TIER_ORDER.indexOf(tier as Exclude<ScoreTier, "unranked">) + 1];
  const pointsToNext = overall != null && nextTier ? Math.max(1, Math.ceil(TIER_MIN[nextTier] - overall)) : null;

  return (
    <div className="glass rounded-2xl p-5 sm:p-6 w-full lg:w-[360px] shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] tracking-[0.3em] uppercase text-primary/80">{t.taskCtrlScoreEyebrow}</div>
        <div
          className="text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full border"
          style={{ color, borderColor: `color-mix(in oklab, ${color} 45%, transparent)` }}
        >
          {tierLabel(tier, t)}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 140 140" className="h-28 w-28 -rotate-90">
            {metrics.map((m, i) => {
              const radius = 58 - i * 12;
              const circumference = 2 * Math.PI * radius;
              const pct = m.value ?? 0;
              const isHovered = hovered === m.key;
              const strokeWidth = isHovered ? 9 : 7;
              return (
                <g key={m.key}>
                  <circle
                    cx={70}
                    cy={70}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className="text-white/[0.08]"
                    stroke="currentColor"
                  />
                  {m.value != null && (
                    <circle
                      cx={70}
                      cy={70}
                      r={radius}
                      fill="none"
                      stroke={m.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={mounted ? circumference * (1 - pct / 100) : circumference}
                      style={{
                        transition: `stroke-dashoffset 1.1s cubic-bezier(0.32,0.72,0,1) ${i * 0.12}s, stroke-width 0.15s ease, filter 0.15s ease`,
                        filter: isHovered ? `drop-shadow(0 0 5px ${m.color})` : undefined,
                      }}
                    />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-serif text-2xl leading-none" style={{ color }}>
              {overall != null ? Math.round(overall) : "—"}
            </div>
            <div className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground mt-1.5">
              {t.taskCtrlScoreOverall}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          {metrics.map((m) => {
            const Icon = m.icon;
            const isHovered = hovered === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onMouseEnter={() => setHovered(m.key)}
                onMouseLeave={() => setHovered((h) => (h === m.key ? null : h))}
                onFocus={() => setHovered(m.key)}
                onBlur={() => setHovered((h) => (h === m.key ? null : h))}
                className={`w-full flex items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors ${
                  isHovered ? "bg-white/[0.06]" : ""
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-foreground/85 flex-1 truncate">{m.label}</span>
                <span
                  className="font-mono text-[11px] shrink-0"
                  style={{ color: m.value != null ? m.color : "var(--muted-foreground)" }}
                >
                  {m.value != null ? `${Math.round(m.value)}%` : t.taskCtrlScoreNotStarted}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 flex items-start gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary/80 mt-0.5 shrink-0" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {overall == null
            ? t.taskCtrlScoreStartPrompt
            : pointsToNext != null && nextTier
              ? t.taskCtrlScoreToNext(pointsToNext, tierLabel(nextTier, t))
              : t.taskCtrlScoreMaxed}
        </p>
      </div>
    </div>
  );
}

function HistoryRow({ task, t, dateLocale }: { task: CompletedTask; t: T; dateLocale: string }) {
  const [open, setOpen] = useState(false);
  const time = new Date(task.completed_at).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[9px] tracking-[0.25em] uppercase text-primary/80 px-2 py-0.5 border border-primary/30 rounded">
              {task.source === "roadmap" ? t.taskCtrlFilterRoadmap : t.taskCtrlFilterDailyRitual}
            </span>
            {task.industry && (
              <span className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground px-2 py-0.5 border border-border/50 rounded">
                {task.industry}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-mono">{t.taskCtrlCompletedAt(time)}</span>
          </div>
          <div className="text-sm text-foreground/90">{task.title}</div>
          {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
        </div>
        {task.answer_text && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-primary/80 hover:text-primary transition-colors"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            {open ? t.taskCtrlHideAnswer : t.taskCtrlViewAnswer}
          </button>
        )}
      </div>
      {open && task.answer_text && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
          {task.answer_score != null && (
            <div className="font-mono text-xs text-primary">{t.taskCtrlAnswerScoreLabel(task.answer_score)}</div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{task.answer_text}</p>
          {task.answer_feedback && (
            <p className="text-xs text-muted-foreground italic">{task.answer_feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}

function QuizMilestoneCard({
  milestone, dayCount, quizzes, tasks, t, lang, onChanged,
}: {
  milestone: Milestone;
  dayCount: number;
  quizzes: QuizRow[];
  tasks: CompletedTask[];
  t: T;
  lang: "en" | "fr";
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const generateQuiz = useServerFn(generateTaskReviewQuiz);
  const target = MILESTONE_TARGET[milestone];
  const [view, setView] = useState<"idle" | "taking" | "result">("idle");
  const [activeQuiz, setActiveQuiz] = useState<QuizRow | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...quizzes].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const lastGenDayCount = quizzes.reduce((max, q) => Math.max(max, q.day_count_at_generation), 0);
  const nextUnlockAt = lastGenDayCount + target;
  const unlocked = dayCount >= nextUnlockAt;
  const pending = sorted.find((q) => !q.completed_at) ?? null;
  const taken = sorted.filter((q) => q.completed_at);

  const startQuiz = async () => {
    setError(null);
    if (pending) {
      setActiveQuiz(pending);
      setAnswers(new Array(pending.questions.length).fill(-1));
      setQIndex(0);
      setView("taking");
      return;
    }
    if (!user) return;
    setGenerating(true);
    try {
      const mostRecent = sorted[0];
      const windowStart = mostRecent?.created_at ?? null;
      const pool = windowStart ? tasks.filter((tk) => tk.completed_at > windowStart) : tasks;
      const source: TaskQuizSourceTask[] = sampleTasks(pool.length ? pool : tasks, MILESTONE_SAMPLE_CAP[milestone]).map((tk) => ({
        title: tk.title,
        description: tk.description,
        industry: tk.industry,
        source: tk.source,
        answerText: tk.answer_text,
        answerFeedback: tk.answer_feedback,
      }));
      if (source.length === 0) {
        setError(t.taskCtrlNotEnoughTasks);
        setGenerating(false);
        return;
      }
      const questionCount = milestone === "day7" ? 5 : 20;
      const { questions } = await generateQuiz({
        data: { milestone, questionCount, language: lang, tasks: source },
      });
      const { data, error: insertError } = await (supabase as any).from("task_quizzes")
        .insert({
          user_id: user.id,
          milestone,
          day_count_at_generation: dayCount,
          window_start: windowStart,
          questions,
          total: questions.length,
        })
        .select("id, milestone, day_count_at_generation, questions, answers, score, total, created_at, completed_at")
        .single();
      if (insertError || !data) throw new Error(insertError?.message ?? "insert failed");
      setActiveQuiz(data as QuizRow);
      setAnswers(new Array(questions.length).fill(-1));
      setQIndex(0);
      setView("taking");
    } catch {
      setError(t.taskCtrlGenerateFailed);
    } finally {
      setGenerating(false);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    const score = answers.filter((a, i) => a === activeQuiz.questions[i]?.correctIndex).length;
    const { data } = await (supabase as any).from("task_quizzes")
      .update({ answers, score, completed_at: new Date().toISOString() })
      .eq("id", activeQuiz.id)
      .select("id, milestone, day_count_at_generation, questions, answers, score, total, created_at, completed_at")
      .single();
    setActiveQuiz((data as QuizRow) ?? { ...activeQuiz, answers, score, completed_at: new Date().toISOString() });
    setSubmitting(false);
    setView("result");
    onChanged();
  };

  const title = milestone === "day7" ? t.taskCtrlDay7Title : t.taskCtrlDay30Title;
  const allAnswered = answers.length > 0 && answers.every((a) => a >= 0);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
          {milestone === "day7" ? <Sparkles className="h-5 w-5 text-primary-foreground" /> : <Trophy className="h-5 w-5 text-primary-foreground" />}
        </div>
        <div>
          <div className="font-serif text-lg">{title}</div>
          <div className="text-xs text-muted-foreground">{t.taskCtrlDaysOfN(Math.min(dayCount, nextUnlockAt), nextUnlockAt)}</div>
        </div>
      </div>

      {view === "idle" && (
        <>
          <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden mb-4">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, (dayCount / nextUnlockAt) * 100)}%`, background: "var(--gradient-gold)" }}
            />
          </div>
          {error && <div className="text-xs text-destructive mb-3">{error}</div>}
          <button
            onClick={() => void startQuiz()}
            disabled={(!unlocked && !pending) || generating}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
            style={{ background: "var(--gradient-gold)" }}
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t.taskCtrlGenerating}</>
            ) : pending ? t.taskCtrlResumeQuiz : unlocked ? t.taskCtrlTakeQuiz : t.taskCtrlDaysToGo(nextUnlockAt - dayCount)}
          </button>
          {taken.length > 0 && (
            <div className="mt-3 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{t.taskCtrlPastAttempts(taken.length)}</span>
              <span className="font-mono">{t.taskCtrlLastScore(taken[0].score ?? 0, taken[0].total)}</span>
            </div>
          )}
        </>
      )}

      {view === "taking" && activeQuiz && (
        <div className="space-y-4">
          {(() => {
            const q = activeQuiz.questions[qIndex];
            return (
              <div className="rounded-lg border border-border/50 p-3.5">
                <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5">
                  {t.taskCtrlQuestionOf(qIndex + 1, activeQuiz.questions.length)}
                </div>
                <div className="text-sm text-foreground/90 mb-3">{q.question}</div>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qIndex ? oi : a)))}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                        answers[qIndex] === oi ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/60 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-center gap-1.5">
            {activeQuiz.questions.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === qIndex ? "w-5 bg-primary" : answers[i] >= 0 ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          {qIndex === activeQuiz.questions.length - 1 && !allAnswered && (
            <p className="text-[11px] text-muted-foreground text-center">{t.taskCtrlAnswerAllHint}</p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setQIndex((q) => Math.max(0, q - 1))}
              disabled={qIndex === 0}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm border border-border/60 hover:border-primary/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" /> {t.taskCtrlPrevious}
            </button>
            {qIndex < activeQuiz.questions.length - 1 ? (
              <button
                onClick={() => setQIndex((q) => Math.min(activeQuiz.questions.length - 1, q + 1))}
                disabled={answers[qIndex] < 0}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
                style={{ background: "var(--gradient-gold)" }}
              >
                {t.taskCtrlNext} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => void submitQuiz()}
                disabled={!allAnswered || submitting}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
                style={{ background: "var(--gradient-gold)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? t.taskCtrlSubmitting : t.taskCtrlSubmitQuiz}
              </button>
            )}
          </div>
        </div>
      )}

      {view === "result" && activeQuiz && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="font-serif text-3xl text-primary">{t.taskCtrlScoreResult(activeQuiz.score ?? 0, activeQuiz.total)}</div>
          </div>
          <div className="space-y-2.5">
            {activeQuiz.questions.map((q, qi) => {
              const userAnswer = activeQuiz.answers?.[qi] ?? -1;
              const correct = userAnswer === q.correctIndex;
              return (
                <div key={qi} className={`rounded-lg border p-3 ${correct ? "border-emerald-400/30 bg-emerald-400/5" : "border-destructive/30 bg-destructive/5"}`}>
                  <div className="flex items-start gap-2">
                    {correct ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-sm text-foreground/90">{q.question}</div>
                      {!correct && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {t.taskCtrlYourAnswerLabel}: {q.options[userAnswer] ?? "—"} · {t.taskCtrlCorrectAnswerLabel}: {q.options[q.correctIndex]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setView("idle")}
            className="w-full rounded-lg px-4 py-2.5 text-sm border border-border/60 hover:border-primary/40 transition-colors"
          >
            {t.taskCtrlCloseResults}
          </button>
        </div>
      )}
    </div>
  );
}
