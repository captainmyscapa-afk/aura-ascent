import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, BookOpen, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseForm, ExerciseEditor } from "@/components/aurum/ExerciseForm";
import { parseExercise, type ExerciseAnswers, type ExerciseDef } from "@/lib/academy/exercise";
import { RichBody, Confetti, StreakChip, ProgressBar, RecapCards } from "@/components/aurum/AcademyRich";

// ─── Types ─────────────────────────────────────────────────────────────────
// These mirror the shapes already used in academy.tsx (DbOption/DbQuestion)
// but are kept local to this file so it can be dropped in standalone.

type ReaderOption = {
  id: string;
  option_text: string;
  order_index: number;
};

type ReaderQuestion = {
  id: string;
  question_text: string;
  options: ReaderOption[];
};

export type ReaderPage = {
  id: string;
  module_id: string;
  page_number: number;
  heading: string;
  body_html: string;
  checkpoint_question_id: string | null;
  exercise?: unknown | null;
};

export type ExerciseState = Record<string, { answers: ExerciseAnswers; completed: boolean }>;

type CheckpointFeedback = {
  correct: boolean;
  correctOptionId: string;
};

// ─── Component ───────────────────────────────────────────────────────────────
//
// Usage (from academy.tsx):
//
//   <AcademyReader
//     pages={pages[activeModuleId] ?? []}
//     checkpointQuestionsById={checkpointQuestionsById}
//     onFinish={() => setView("quiz")}   // or wherever "done reading" should go
//     onExit={goBack}
//   />
//
// Per-page "quick check" is formative only — it calls the submit_checkpoint_answer
// RPC (added in the academy_interactive_reader_schema migration) which logs the
// response and returns correctness, but never touches user_module_progress or
// pass/fail state. The end-of-module quiz (QuizView, unchanged) is still the
// only thing that unlocks the next module.

export function AcademyReader({
  pages,
  checkpointQuestionsById,
  onFinish,
  onExit,
  onCheckpointAnswered,
  exerciseState,
  onExerciseSaved,
  adminEdit,
  reviewMode,
  initialPage,
  onPageChange,
  progressReady,
  adminSkip,
}: {
  pages: ReaderPage[];
  checkpointQuestionsById: Record<string, ReaderQuestion>;
  onFinish: () => void;
  onExit: () => void;
  onCheckpointAnswered?: (pageId: string) => void;
  exerciseState?: ExerciseState;
  onExerciseSaved?: (pageId: string, answers: ExerciseAnswers, completed: boolean) => void;
  // When set (admin + admin mode), page text and the quick check become editable in place.
  adminEdit?: { onSaved: () => void };
  // Completed module: skip quick checks, exercises stay viewable/editable, free page navigation, no quiz at the end.
  reviewMode?: boolean;
  // Resume support: page index to open on (once), and a callback fired whenever the learner moves to another page.
  initialPage?: number;
  onPageChange?: (index: number) => void;
  // Whether the caller's progress data has actually finished loading. initialPage
  // is indistinguishable between "really page 0" and "not loaded yet" -- this
  // flag disambiguates that, so restoration doesn't lock in a premature 0.
  // Omit (undefined) to behave as if always ready, for callers that don't track this.
  progressReady?: boolean;
  // Admin: quick checks and exercises can be skipped (a Skip label replaces the locked button).
  adminSkip?: boolean;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  // Each page is two steps: read the page, then answer its quick check on its own screen
  const [phase, setPhase] = useState<"read" | "check" | "recap">("read");
  const [streak, setStreak] = useState(0);
  // Whether we've resolved what page to open on (restored a saved position, or
  // determined there's nothing to restore). This is real state, not a one-shot
  // ref flag -- React Strict Mode's dev-only effect replay ("reconnectPassiveEffects")
  // was firing the save-effect below once with the still-unrestored pageIndex (0)
  // before the restore effect got a chance to apply, silently overwriting real
  // saved progress with 0. A ref-based guard can't protect against that replay;
  // gating both effects on shared state can.
  const [restored, setRestored] = useState(false);

  // Resume where the learner left off (progress may load a moment after the reader mounts)
  useEffect(() => {
    if (restored) return;
    if (reviewMode || adminEdit) { setRestored(true); return; }
    if (pages.length === 0) return; // wait for pages to load before deciding anything
    if (progressReady === false) return; // real progress data hasn't arrived yet -- initialPage isn't trustworthy
    if (initialPage) setPageIndex(Math.min(initialPage, pages.length - 1));
    setRestored(true);
  }, [restored, initialPage, pages.length, reviewMode, adminEdit, progressReady]);

  // Persist the current page whenever it changes -- but never before restoration
  // has been resolved, so a stale pre-restore pageIndex can never overwrite a
  // real saved position.
  useEffect(() => {
    if (!restored) return;
    if (adminEdit || reviewMode) return;
    onPageChange?.(pageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, restored]);
  const [bestStreak, setBestStreak] = useState(0);
  const [selectedByPage, setSelectedByPage] = useState<Record<string, string>>({});
  const [feedbackByPage, setFeedbackByPage] = useState<Record<string, CheckpointFeedback>>({});
  const [submitting, setSubmitting] = useState(false);

  // Always start each page / quick check at the top of the screen
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pageIndex, phase]);

  const page = pages[pageIndex];
  const question = page?.checkpoint_question_id ? checkpointQuestionsById[page.checkpoint_question_id] : null;
  const answered = !!feedbackByPage[page?.id ?? ""];
  const editing = !!adminEdit;
  const review = !!reviewMode && !editing;
  const exerciseDef = page?.exercise ? parseExercise(page.exercise) : null;
  const exDone = !!exerciseState?.[page?.id ?? ""]?.completed;
  const hasStep = !!question || !!exerciseDef;
  const showCheck = !review && !editing && !!question && phase === "check";
  const showExercise = review ? !!exerciseDef : !editing && !question && !!exerciseDef && phase === "check";
  const showRecap = !editing && !review && phase === "recap";
  const showRead = showRecap ? false : review ? true : !showCheck && !showExercise;
  const canAdvance = editing || review || phase === "recap" || phase === "read" || !!adminSkip || (question ? answered : exerciseDef ? exDone : true);

  // ── Admin inline editing state ──
  const bodyRef = useRef<HTMLDivElement>(null);
  const [headingDraft, setHeadingDraft] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [optDrafts, setOptDrafts] = useState(["", "", "", ""]);
  const [optIds, setOptIds] = useState<(string | null)[]>([null, null, null, null]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);
  const [exerciseDraft, setExerciseDraft] = useState<ExerciseDef | null>(null);
  const [editMsg, setEditMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!editing || !page) return;
    setHeadingDraft(page.heading);
    setQDraft(question?.question_text ?? "");
    setEditMsg(null);
    setExerciseDraft(parseExercise(page.exercise));
    if (!question) {
      setOptDrafts(["", "", "", ""]); setOptIds([null, null, null, null]); setCorrectIdx(0);
      return;
    }
    let cancelled = false;
    (async () => {
      // Admins can read the base options table, which includes is_correct
      const { data } = await (supabase.from("academy_quiz_options") as any)
        .select("id, option_text, is_correct").eq("question_id", question.id).order("order_index");
      if (cancelled) return;
      const rows = (data ?? []) as { id: string; option_text: string; is_correct: boolean }[];
      setOptDrafts([0, 1, 2, 3].map((i) => rows[i]?.option_text ?? ""));
      setOptIds([0, 1, 2, 3].map((i) => rows[i]?.id ?? null));
      setCorrectIdx(Math.max(0, rows.findIndex((o) => o.is_correct)));
    })();
    return () => { cancelled = true; };
  }, [editing, page?.id, page?.heading, page?.body_html, question?.id, question?.question_text, JSON.stringify(page?.exercise ?? null)]);

  const fmt = (cmd: string, value?: string) => {
    bodyRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const check = async (p: PromiseLike<{ error: any }>) => {
    const { error } = await p;
    if (error) throw error;
  };

  const saveEdits = async () => {
    if (!page || !adminEdit) return;
    const html = (bodyRef.current?.innerHTML ?? page.body_html).trim();
    const hasQ = qDraft.trim() !== "" || optDrafts.some((o) => o.trim() !== "");
    if (!headingDraft.trim() || !html) { setEditMsg({ ok: false, text: "Heading and body can't be empty." }); return; }
    if (hasQ && (!qDraft.trim() || optDrafts.some((o) => !o.trim()))) {
      setEditMsg({ ok: false, text: "Fill in the question and all four options, or clear them all." }); return;
    }
    if (question && !hasQ) {
      setEditMsg({ ok: false, text: "This page already has a quick check — edit it rather than clearing it." }); return;
    }
    if (exerciseDraft) {
      if (hasQ || question) {
        setEditMsg({ ok: false, text: "A page has either a quick check or an exercise, not both. Remove one first." }); return;
      }
      const badField = exerciseDraft.groups.some((g) => g.fields.some((f) => !f.label.trim() || (f.type === "choice" && (f.options?.length ?? 0) < 2)));
      if (exerciseDraft.groups.length === 0 || exerciseDraft.groups.some((g) => g.fields.length === 0) || badField) {
        setEditMsg({ ok: false, text: "Every exercise group needs at least one field; every field needs a label; choice fields need 2+ options." }); return;
      }
    }
    setSavingEdit(true); setEditMsg(null);
    try {
      await check((supabase.from("academy_module_pages") as any)
        .update({ heading: headingDraft.trim(), body_html: html, exercise: exerciseDraft ?? null }).eq("id", page.id));
      if (hasQ) {
        if (question) {
          await check((supabase.from("academy_quiz_questions") as any)
            .update({ question_text: qDraft.trim() }).eq("id", question.id));
          for (let i = 0; i < 4; i++) {
            const row = { option_text: optDrafts[i].trim(), is_correct: i === correctIdx };
            if (optIds[i]) await check((supabase.from("academy_quiz_options") as any).update(row).eq("id", optIds[i]));
            else await check((supabase.from("academy_quiz_options") as any).insert({ ...row, question_id: question.id, order_index: i }));
          }
        } else {
          const { data: newQ, error } = await (supabase.from("academy_quiz_questions") as any)
            .insert({ module_id: page.module_id, question_text: qDraft.trim(), stage: "checkpoint", page_number: page.page_number, order_index: 0 })
            .select().single();
          if (error || !newQ) throw error ?? new Error("Could not create question");
          const newId = (newQ as { id: string }).id;
          for (let i = 0; i < 4; i++) {
            await check((supabase.from("academy_quiz_options") as any).insert({
              question_id: newId, option_text: optDrafts[i].trim(), is_correct: i === correctIdx, order_index: i,
            }));
          }
          await check((supabase.from("academy_module_pages") as any).update({ checkpoint_question_id: newId }).eq("id", page.id));
        }
      }
      setEditMsg({ ok: true, text: "Saved." });
      adminEdit.onSaved();
    } catch (e) {
      console.error("Saving page edits failed:", e);
      setEditMsg({ ok: false, text: (e as { message?: string })?.message ?? "Save failed" });
    } finally {
      setSavingEdit(false);
    }
  };

  const answerCheckpoint = async (optionId: string) => {
    if (!page || !question || submitting) return;
    setSubmitting(true);
    setSelectedByPage((s) => ({ ...s, [page.id]: optionId }));

    const { data, error } = await supabase.rpc("submit_checkpoint_answer", {
      p_page_id: page.id,
      p_selected_option_id: optionId,
    });

    setSubmitting(false);
    if (error || !data) {
      console.error("submit_checkpoint_answer failed:", error);
      return;
    }
    setFeedbackByPage((f) => ({ ...f, [page.id]: data as unknown as CheckpointFeedback }));
    const ok = !!(data as unknown as CheckpointFeedback).correct;
    setStreak((s) => (ok ? s + 1 : 0));
    if (ok) setBestStreak((b) => Math.max(b, streak + 1));
    onCheckpointAnswered?.(page.id);
  };

  const goNext = () => {
    if (phase === "recap") { onFinish(); return; }
    if (!editing && !review && hasStep && phase === "read") { setPhase("check"); return; }
    if (pageIndex < pages.length - 1) { setPhase("read"); setPageIndex((i) => i + 1); }
    else if (review) { setPhase("read"); onExit(); }
    else if (editing) { setPhase("read"); onFinish(); }
    else setPhase("recap");
  };

  const goBack = () => {
    if (phase === "check" || phase === "recap") { setPhase("read"); return; }
    if (pageIndex > 0) setPageIndex((i) => i - 1);
    else onExit();
  };

  if (!page) return null;

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> {phase === "check" ? "Back to page" : phase === "recap" ? "Back to last page" : pageIndex === 0 ? "Back to modules" : "Previous page"}
        </button>
        {review && (
          <button
            onClick={goNext}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-primary-foreground text-xs font-medium transition-all"
            style={{ background: "var(--gradient-gold)" }}
          >
            {pageIndex < pages.length - 1 ? "Next page" : "Finish review"} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPhase("read"); setPageIndex((i) => Math.max(0, i - 1)); }}
              disabled={pageIndex === 0}
              className="px-3 py-1.5 rounded-lg border border-border text-xs hover:border-primary/40 disabled:opacity-30 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => { setPhase("read"); setPageIndex((i) => Math.min(pages.length - 1, i + 1)); }}
              disabled={pageIndex >= pages.length - 1}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-primary-foreground text-xs font-medium disabled:opacity-30 transition-all"
              style={{ background: "var(--gradient-gold)" }}
            >
              Next page <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Animated progress: overall bar + per-page segments */}
      {(() => {
        const done = showRecap ? pages.length : pageIndex + (phase === "check" ? 0.5 : 0);
        const frac = review ? (pageIndex + 1) / pages.length : done / pages.length;
        return (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2 gap-3">
              <span className="text-[10px] tracking-[0.3em] text-primary/80">
                {showRecap ? "RECAP" : `PAGE ${pageIndex + 1} / ${pages.length}`} · {Math.round(frac * 100)}%
              </span>
              <StreakChip streak={streak} />
            </div>
            <ProgressBar fraction={frac} />
          </div>
        );
      })()}
      <div className="flex items-center gap-1.5 mb-6">
        {pages.map((p, i) => (
          <div
            key={p.id}
            onClick={review ? () => { setPhase("read"); setPageIndex(i); } : undefined}
            className={`h-1 flex-1 rounded-full transition-colors ${review ? "cursor-pointer" : ""} ${
              review || i < pageIndex || (i === pageIndex && (answered || exDone))
                ? "bg-primary"
                : i === pageIndex
                ? "bg-primary/40"
                : "bg-secondary/40"
            }`}
          />
        ))}
      </div>

      {showRecap && <RecapCards pages={pages} streak={bestStreak} />}

      {showRead && (
      <div key={page.id} className="glass rounded-xl p-6 sm:p-8 mb-6 animate-page-enter">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.34em] text-primary/80 mb-3">
          <BookOpen className="h-3.5 w-3.5" /> PAGE {pageIndex + 1} OF {pages.length}
        </div>
        {editing ? (
          <>
            <div className="text-[10px] tracking-[0.2em] text-amber-400/90 mb-3">
              EDITING THIS PAGE — changes are saved for all learners when you press Save
            </div>
            <input
              value={headingDraft}
              onChange={(e) => setHeadingDraft(e.target.value)}
              className="w-full font-serif text-xl sm:text-2xl mb-3 bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-colors"
            />
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {([
                ["B", () => fmt("bold"), "font-bold"],
                ["I", () => fmt("italic"), "italic"],
                ["• List", () => fmt("insertUnorderedList"), ""],
                ["Paragraph", () => fmt("formatBlock", "p"), ""],
                ["Clear", () => fmt("removeFormat"), ""],
              ] as [string, () => void, string][]).map(([label, run, cls]) => (
                <button
                  key={label}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); run(); }}
                  className={`px-2.5 py-1 rounded-md border border-border text-xs hover:border-primary/40 transition-colors ${cls}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              key={`${page.id}:${page.body_html}`}
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              className="prose prose-sm prose-invert max-w-none min-h-[8rem] text-sm leading-relaxed text-foreground/90 [&_p]:mb-3 [&_b]:text-foreground [&_em]:text-primary/80 border border-primary/30 rounded-lg p-3 outline-none focus:border-primary/60"
              dangerouslySetInnerHTML={{ __html: page.body_html }}
            />
          </>
        ) : (
          <>
            <h3 key={`h-${page.id}`} className="rd-in font-serif text-2xl sm:text-3xl mb-5 text-gold-gradient">{page.heading}</h3>
            <RichBody key={page.id} html={page.body_html} />
          </>
        )}
      </div>
      )}

      {editing && (
        <div className="glass rounded-xl p-5 sm:p-6 mb-6 border border-amber-400/30">
          <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">QUICK CHECK (EDIT)</div>
          <textarea
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Quick check question (leave empty for no quick check)"
            rows={2}
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none transition-colors mb-3"
          />
          <div className="space-y-2">
            {optDrafts.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectIdx(i)}
                  title="Mark as correct answer"
                  className={`shrink-0 h-4 w-4 rounded-full border-2 transition-colors ${correctIdx === i ? "border-primary bg-primary" : "border-border"}`}
                />
                <span className="text-[10px] font-mono text-muted-foreground w-4">{["A", "B", "C", "D"][i]}</span>
                <input
                  value={opt}
                  onChange={(e) => setOptDrafts((o) => { const n = [...o]; n[i] = e.target.value; return n; })}
                  placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                  className="flex-1 bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Filled circle = correct answer.</p>

          <div className="mt-6 pt-5 border-t border-border">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">EXERCISE (EDIT) · REPLACES THE QUICK CHECK, SAVED TO THE BROKER PORTFOLIO</div>
            {exerciseDraft ? (
              <>
                <ExerciseEditor value={exerciseDraft} onChange={setExerciseDraft} />
                <button type="button" onClick={() => setExerciseDraft(null)} className="mt-3 text-xs text-destructive hover:underline">
                  Remove exercise from this page
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setExerciseDraft({ intro: "", groups: [{ title: "", section: "profile", fields: [{ key: `f_${Math.random().toString(36).slice(2, 8)}`, label: "", type: "long", min: 20 }] }] })}
                className="text-xs text-primary hover:underline"
              >
                + Add an exercise to this page (clear the quick check above first)
              </button>
            )}
          </div>
          {editMsg && (
            <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${editMsg.ok ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
              {editMsg.text}
            </div>
          )}
          <button
            onClick={saveEdits}
            disabled={savingEdit}
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-primary-foreground text-sm disabled:opacity-50"
            style={{ background: "var(--gradient-gold)" }}
          >
            {savingEdit ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save page
          </button>
        </div>
      )}

      {showCheck && question && (
        <div className="relative glass rounded-xl p-6 sm:p-8 mb-6 border border-primary/20 animate-fade-up">
          {answered && feedbackByPage[page.id]?.correct && <Confetti seed={page.id} />}
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-1">QUICK CHECK · PAGE {pageIndex + 1} OF {pages.length}</div>
          <div className="text-xs text-muted-foreground mb-5">{page.heading}</div>
          <p className="text-base font-medium leading-relaxed mb-5">{question.question_text}</p>
          <div className="space-y-2">
            {question.options.map((opt, oi) => {
              const selected = selectedByPage[page.id] === opt.id;
              const fb = feedbackByPage[page.id];
              const isCorrectOpt = !!fb && opt.id === fb.correctOptionId;
              const isWrongSelected = !!fb && selected && opt.id !== fb.correctOptionId;
              return (
                <button
                  key={opt.id}
                  onClick={() => !answered && answerCheckpoint(opt.id)}
                  disabled={answered || submitting}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all text-sm disabled:cursor-default ${
                    isWrongSelected ? "rd-shake" : isCorrectOpt ? "animate-pop" : !answered ? "hover:-translate-y-0.5" : ""
                  } ${
                    isCorrectOpt
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : isWrongSelected
                      ? "border-destructive/60 bg-destructive/10 text-destructive"
                      : selected
                      ? "border-primary/60 bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-4">
                    {["A", "B", "C", "D"][oi]}
                  </span>
                  <span className="flex-1">{opt.option_text}</span>
                  {isCorrectOpt && <Check className="h-4 w-4 shrink-0" />}
                  {isWrongSelected && <X className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
          {answered && (
            <p className="text-[11px] text-muted-foreground mt-3">
              {feedbackByPage[page.id].correct
                ? "Nice — that's it."
                : "Not quite — the highlighted option is the one to remember."}
            </p>
          )}
        </div>
      )}

      {showExercise && exerciseDef && (
        <ExerciseForm
          key={page.id}
          pageId={page.id}
          heading={page.heading}
          def={exerciseDef}
          initial={exerciseState?.[page.id]?.answers ?? {}}
          completed={exDone}
          onSaved={(a, c) => onExerciseSaved?.(page.id, a, c)}
        />
      )}

      <button
        onClick={goNext}
        disabled={!canAdvance}
        className="w-full h-12 rounded-xl text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
        style={{ background: "var(--gradient-gold)" }}
      >
        {adminSkip && phase === "check" && !(question ? answered : exDone) ? (pageIndex < pages.length - 1 ? "Skip (admin) · Next page" : "Skip (admin) · See your recap") : phase === "recap" ? "Continue to the quiz" : !editing && !review && hasStep && phase === "read" ? (question ? "Continue to quick check" : "Continue to exercise") : pageIndex < pages.length - 1 ? "Next page" : review ? "Finish review" : editing ? "Finish reading" : "See your recap"}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
