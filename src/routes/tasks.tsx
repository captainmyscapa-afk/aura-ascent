import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ClipboardList,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
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
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">{t.taskCtrlEyebrow}</div>
        <h1 className="font-serif text-4xl">{t.taskCtrlTitle}</h1>
        <p className="mt-3 text-muted-foreground max-w-xl text-sm">{t.taskCtrlDesc}</p>
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
          {activeQuiz.questions.map((q, qi) => (
            <div key={qi} className="rounded-lg border border-border/50 p-3.5">
              <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1.5">
                {t.taskCtrlQuestionOf(qi + 1, activeQuiz.questions.length)}
              </div>
              <div className="text-sm text-foreground/90 mb-3">{q.question}</div>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                      answers[qi] === oi ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/60 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!allAnswered && <p className="text-[11px] text-muted-foreground">{t.taskCtrlAnswerAllHint}</p>}
          <button
            onClick={() => void submitQuiz()}
            disabled={!allAnswered || submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
            style={{ background: "var(--gradient-gold)" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? t.taskCtrlSubmitting : t.taskCtrlSubmitQuiz}
          </button>
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
